import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, WifiOff, X } from 'lucide-react';
import { AIAdvisorChat } from './components/AIAdvisorChat';
import { AboutArchitecture } from './components/AboutArchitecture';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditLogView } from './components/AuditLogView';
import {
  CommandPalette,
  OnboardingTour,
  ShortcutsModal,
} from './components/CommandPaletteModal';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { FailurePredictor } from './components/FailurePredictor';
import { FleetDashboard } from './components/FleetDashboard';
import { HomeSection } from './components/HomeSection';
import { MachineDetailPage } from './components/MachineDetailPage';
import { MaintenancePlanner } from './components/MaintenancePlanner';
import { ModelInsights } from './components/ModelInsights';
import { Navbar } from './components/Navbar';
import { PlantFloorMap } from './components/PlantFloorMap';
import { SignInModal } from './components/SignInModal';
import {
  createInitialAlerts,
  createInitialAuditLog,
  createInitialFleet,
  createInitialTasks,
  stepMachineTelemetry,
} from './lib/fleetData';
import type {
  AlertItem,
  AppSection,
  AuditActionType,
  AuditLogEntry,
  Machine,
  MaintenanceTask,
  OperatorSession,
  TaskStatus,
  ToastMessage,
} from './lib/types';

const STORAGE_KEYS = {
  THEME: 'ferrosense_theme_v1',
  ACK_ALERTS: 'ferrosense_ack_alerts_v1',
  TASKS: 'ferrosense_tasks_v1',
  AUDIT: 'ferrosense_audit_v1',
  TOUR_DONE: 'ferrosense_tour_done_v1',
  OPERATOR: 'ferrosense_operator_v1',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function playAlertChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // ignore audio block
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [machines, setMachines] = useState<Machine[]>(() => createInitialFleet());

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const initial = createInitialAlerts(createInitialFleet());
    const ackedIds = loadJson<string[]>(STORAGE_KEYS.ACK_ALERTS, []);
    return initial.map((a) => (ackedIds.includes(a.id) ? { ...a, acknowledged: true } : a));
  });

  const [tasks, setTasks] = useState<MaintenanceTask[]>(() =>
    loadJson<MaintenanceTask[]>(STORAGE_KEYS.TASKS, createInitialTasks(createInitialFleet())),
  );

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() =>
    loadJson<AuditLogEntry[]>(STORAGE_KEYS.AUDIT, createInitialAuditLog()),
  );

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
    } catch {
      return false;
    }
  });

  const [tourStep, setTourStep] = useState<number>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.TOUR_DONE) === 'true' ? -1 : 0;
    } catch {
      return 0;
    }
  });

  const [operator, setOperator] = useState<OperatorSession | null>(() =>
    loadJson<OperatorSession | null>(STORAGE_KEYS.OPERATOR, null),
  );
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('m-04');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [lastTickAt, setLastTickAt] = useState<number>(() => Date.now());
  const [alertFlash, setAlertFlash] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  // Sync Tailwind dark class + localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLog));
    } catch {
      // ignore
    }
  }, [auditLog]);

  useEffect(() => {
    try {
      const acked = alerts.filter((a) => a.acknowledged).map((a) => a.id);
      window.localStorage.setItem(STORAGE_KEYS.ACK_ALERTS, JSON.stringify(acked));
    } catch {
      // ignore
    }
  }, [alerts]);

  const triggerAlertFeedback = useCallback(() => {
    setAlertFlash(true);
    window.setTimeout(() => setAlertFlash(false), 1600);
    if (soundRef.current) {
      playAlertChime();
    }
  }, []);

  const operatorActorRef = useRef<string>(operator?.name || 'Plant Operator');
  operatorActorRef.current = operator?.name || 'Plant Operator';

  const appendAudit = useCallback(
    (actionType: AuditActionType, target: string, summary: string, actor?: string) => {
      const entry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        actionType,
        actor: actor || operatorActorRef.current,
        target,
        summary,
      };
      setAuditLog((prev) => [entry, ...prev].slice(0, 80));
    },
    [],
  );

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, description, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    [],
  );

  const handleSignIn = (session: OperatorSession, remember: boolean) => {
    setOperator(session);
    try {
      if (remember) {
        window.localStorage.setItem(STORAGE_KEYS.OPERATOR, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.OPERATOR);
      }
    } catch {
      // ignore
    }
    appendAudit(
      'OPERATOR_AUTH',
      session.operatorCode,
      `${session.name} (${session.role}) signed in for ${session.shift}.`,
      session.name,
    );
    pushToast(
      `Welcome, ${session.name}`,
      `${session.role} · ${session.shift}`,
      'success',
    );
  };

  const handleSignOut = () => {
    const prev = operator;
    setOperator(null);
    try {
      window.localStorage.removeItem(STORAGE_KEYS.OPERATOR);
    } catch {
      // ignore
    }
    if (prev) {
      appendAudit(
        'OPERATOR_AUTH',
        prev.operatorCode,
        `${prev.name} signed out from ${prev.shift}.`,
        prev.name,
      );
      pushToast('Operator signed out', `${prev.name} shift session ended.`, 'info');
    }
  };

  // Global keyboard shortcuts: Ctrl/Cmd+K, ?, Esc, 1-6
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        setShortcutsOpen(false);
        return;
      }

      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setShortcutsOpen(false);
        setSignInOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((p) => !p);
        setPaletteOpen(false);
        return;
      }

      const quickRoutes: Record<string, AppSection> = {
        '1': 'home',
        '2': 'dashboard',
        '3': 'floor-map',
        '4': 'predictor',
        '5': 'analytics',
        '6': 'planner',
      };
      if (quickRoutes[e.key]) {
        setActiveSection(quickRoutes[e.key]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Live 2-second simulation tick
  useEffect(() => {
    if (!isSimulating || isOffline) return;
    let tickCount = 0;

    const interval = window.setInterval(() => {
      tickCount += 1;
      setLastTickAt(Date.now());
      setMachines((prevMachines) => {
        const nextMachines = prevMachines.map((m) => stepMachineTelemetry(m, tickCount));

        const newAlerts: AlertItem[] = [];
        nextMachines.forEach((nextM, idx) => {
          const prevM = prevMachines[idx];
          if (
            nextM.prediction.status !== 'Healthy' &&
            nextM.prediction.status !== prevM.prediction.status
          ) {
            newAlerts.push({
              id: `alt-${nextM.id}-${Date.now()}`,
              machineId: nextM.id,
              machineName: nextM.name,
              machineCode: nextM.code,
              timestamp: nextM.lastUpdated,
              severity: nextM.prediction.status === 'Critical' ? 'Critical' : 'Warning',
              probability: nextM.prediction.failureProbability,
              failureMode: nextM.prediction.dominantFailureMode,
              probableCause: `${nextM.prediction.contributions[0]?.feature} (${nextM.prediction.contributions[0]?.contributionPct}%)`,
              acknowledged: false,
            });
          }
        });

        if (newAlerts.length > 0) {
          setAlerts((prevAlerts) => [...newAlerts, ...prevAlerts].slice(0, 24));
          triggerAlertFeedback();
          const topNew = newAlerts[0];
          pushToast(
            `${topNew.severity}: ${topNew.machineCode}`,
            `${topNew.failureMode} (${topNew.probability.toFixed(0)}%)`,
            'warning',
          );
        }

        return nextMachines;
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [isSimulating, isOffline, triggerAlertFeedback, pushToast]);

  const handleNavigate = (section: AppSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setActiveSection('machine-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInjectFault = (machineId: string) => {
    const target = machines.find((m) => m.id === machineId);
    if (!target) return;

    if (isOffline) setIsOffline(false);
    if (!isSimulating) setIsSimulating(true);
    setLastTickAt(Date.now());

    setMachines((prev) =>
      prev.map((m) =>
        m.id === machineId
          ? {
              ...m,
              driftDirection: 1,
              faultTicksRemaining: 10,
            }
          : m,
      ),
    );

    const immediateAlert: AlertItem = {
      id: `alt-fault-${target.id}-${Date.now()}`,
      machineId: target.id,
      machineName: target.name,
      machineCode: target.code,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      severity: 'Critical',
      probability: Math.max(76, target.prediction.failureProbability),
      failureMode: 'Overstrain Failure',
      probableCause: `Fault injection initiated · Wear & torque escalating over 20s`,
      acknowledged: false,
    };

    setAlerts((prev) => [immediateAlert, ...prev].slice(0, 24));
    triggerAlertFeedback();
    appendAudit(
      'FAULT_INJECTED',
      target.code,
      `Injected 20s progressive wear/torque fault on ${target.name}; escalated recommendation ready.`,
      target.leadTechnician,
    );
    pushToast(
      `Fault injected on ${target.code}`,
      `${target.name} escalating toward Critical threshold (~20s).`,
      'warning',
    );
  };

  const handleQuickScheduleMachine = (machineId: string) => {
    const m = machines.find((item) => item.id === machineId);
    if (!m) return;
    const task: MaintenanceTask = {
      id: `tsk-quick-${Date.now()}`,
      machineId: m.id,
      machineName: m.name,
      machineCode: m.code,
      title: `Urgent ${m.prediction.dominantFailureMode} Intervention`,
      failureMode: m.prediction.dominantFailureMode,
      priority: m.prediction.recommendation.priority,
      status: 'Scheduled',
      scheduledDate: new Date(Date.now() + 14400000).toISOString().slice(0, 16),
      technician: m.leadTechnician,
      estimatedHours: m.prediction.recommendation.estimatedRepairHours,
      estimatedCostInr: m.prediction.recommendation.plannedCostInr,
      notes: m.prediction.recommendation.action,
    };
    setTasks((prev) => [task, ...prev]);
    appendAudit(
      'MAINTENANCE_SCHEDULED',
      m.code,
      `One-click scheduled "${task.title}" assigned to ${m.leadTechnician}.`,
      m.leadTechnician,
    );
    pushToast('Work order scheduled', `${m.code} assigned to ${m.leadTechnician}`);
  };

  const handleToggleOffline = () => {
    setIsOffline((prev) => {
      const next = !prev;
      appendAudit(
        'NETWORK_STATE',
        'MQTT Gateway',
        next ? 'Simulated telemetry link drop (Offline mode).' : 'Telemetry link restored.',
      );
      pushToast(
        next ? 'Telemetry stream disconnected' : 'Telemetry stream restored',
        next ? 'Displaying last cached readings.' : 'Live 2s polling resumed.',
        next ? 'warning' : 'success',
      );
      return next;
    });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    const target = alerts.find((a) => a.id === alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    );
    if (target) {
      appendAudit(
        'ALERT_ACK',
        target.machineCode,
        `Acknowledged ${target.severity} alert (${target.failureMode}, ${target.probability.toFixed(0)}%).`,
      );
    }
    pushToast('Alert acknowledged', 'Recorded in persistent Audit Log.');
  };

  const handleAcknowledgeAll = () => {
    const count = alerts.filter((a) => !a.acknowledged).length;
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    appendAudit('ALERT_ACK', 'Fleet Wide', `Acknowledged ${count} active fleet alerts.`);
    pushToast('All active alerts acknowledged');
  };

  const handleScheduleTask = (newTask: Omit<MaintenanceTask, 'id'>) => {
    const task: MaintenanceTask = {
      ...newTask,
      id: `tsk-${Date.now()}`,
    };
    setTasks((prev) => [task, ...prev]);
    appendAudit(
      'MAINTENANCE_SCHEDULED',
      newTask.machineCode,
      `Scheduled "${newTask.title}" (${newTask.priority}) for ${newTask.technician}.`,
      newTask.technician,
    );
    pushToast(
      'Maintenance scheduled',
      `${newTask.machineCode} assigned to ${newTask.technician}`,
    );
  };

  const handleMoveTask = (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    if (target) {
      appendAudit(
        'TASK_MOVED',
        target.machineCode,
        `Moved "${target.title}" to ${newStatus}.`,
        target.technician,
      );
    }
    pushToast('Work order updated', `Moved to ${newStatus}`);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    pushToast('Work order removed', undefined, 'info');
  };

  const handleClearAudit = () => {
    setAuditLog([]);
    pushToast('Audit log cleared', undefined, 'info');
  };

  const dismissTour = () => {
    setTourStep(-1);
    try {
      window.localStorage.setItem(STORAGE_KEYS.TOUR_DONE, 'true');
    } catch {
      // ignore
    }
  };

  const selectedMachine =
    machines.find((m) => m.id === selectedMachineId) || machines[0];

  return (
    <div className="min-h-screen bg-[#F4EEE4] text-[#231A3B] transition-colors duration-200 dark:bg-[#231A3B] dark:text-[#F4EEE4]">
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isSimulating={isSimulating}
        isOffline={isOffline}
        isDark={isDark}
        alertFlash={alertFlash}
        operator={operator}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSignIn={() => setSignInOpen(true)}
        onSignOut={handleSignOut}
      />

      {isOffline && (
        <div
          role="alert"
          className="no-print border-b border-[#B3265E] bg-[#B3265E] px-4 py-2.5 text-xs font-semibold text-[#FBF8F2]"
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-2 sm:px-4">
            <span className="inline-flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              Telemetry gateway unreachable — displaying last cached sensor snapshot. Predictions
              may be stale.
            </span>
            <button
              type="button"
              onClick={handleToggleOffline}
              className="rounded-lg bg-[#E6FF3D] px-3 py-1 text-xs font-bold text-[#231A3B] hover:bg-[#d8f325]"
            >
              Reconnect Now
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection === 'machine-detail' ? `detail-${selectedMachine.id}` : activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'home' && (
              <HomeSection
                machines={machines}
                operator={operator}
                onNavigate={handleNavigate}
                onSelectMachine={handleSelectMachine}
                onOpenSignIn={() => setSignInOpen(true)}
                onSignOut={handleSignOut}
              />
            )}

            {activeSection === 'dashboard' && (
              <FleetDashboard
                machines={machines}
                alerts={alerts}
                isSimulating={isSimulating}
                isOffline={isOffline}
                lastTickAt={lastTickAt}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled((s) => !s)}
                onToggleSimulation={() => setIsSimulating((p) => !p)}
                onToggleOffline={handleToggleOffline}
                onInjectFault={handleInjectFault}
                onSelectMachine={handleSelectMachine}
                onQuickScheduleMachine={handleQuickScheduleMachine}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onAcknowledgeAll={handleAcknowledgeAll}
                onNavigate={handleNavigate}
              />
            )}

            {activeSection === 'floor-map' && (
              <PlantFloorMap
                machines={machines}
                onSelectMachine={handleSelectMachine}
              />
            )}

            {activeSection === 'machine-detail' && selectedMachine && (
              <MachineDetailPage
                machine={selectedMachine}
                isSimulating={isSimulating}
                isOffline={isOffline}
                onBack={() => handleNavigate('dashboard')}
                onScheduleTask={handleScheduleTask}
                onExportToast={(filename) =>
                  pushToast('CSV Report Downloaded', filename)
                }
              />
            )}

            {activeSection === 'predictor' && <FailurePredictor />}

            {activeSection === 'analytics' && <AnalyticsView machines={machines} />}

            {activeSection === 'models' && <ModelInsights />}

            {activeSection === 'planner' && (
              <MaintenancePlanner
                tasks={tasks}
                machines={machines}
                onMoveTask={handleMoveTask}
                onAddTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
                onSelectMachine={handleSelectMachine}
              />
            )}

            {activeSection === 'executive' && (
              <ExecutiveSummary
                machines={machines}
                alerts={alerts}
                tasks={tasks}
                auditLog={auditLog}
                onSelectMachine={handleSelectMachine}
              />
            )}

            {activeSection === 'audit' && (
              <AuditLogView entries={auditLog} onClearLog={handleClearAudit} />
            )}

            {activeSection === 'about' && <AboutArchitecture />}
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        machines={machines}
        operator={operator}
        onNavigate={handleNavigate}
        onSelectMachine={handleSelectMachine}
        onToggleTheme={() => setIsDark((d) => !d)}
        onInjectFaultQuick={handleInjectFault}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenSignIn={() => setSignInOpen(true)}
        onSignOut={handleSignOut}
        isDark={isDark}
      />

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignIn={handleSignIn}
        activeMachineCount={machines.length}
        criticalCount={machines.filter((m) => m.prediction.status === 'Critical').length}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        onStartTour={() => setTourStep(0)}
      />

      <OnboardingTour
        step={tourStep}
        onNext={() => setTourStep((s) => s + 1)}
        onPrev={() => setTourStep((s) => Math.max(0, s - 1))}
        onSkip={dismissTour}
        onNavigate={handleNavigate}
      />

      <AIAdvisorChat
        machines={machines}
        alerts={alerts}
        tasks={tasks}
        focusedMachine={activeSection === 'machine-detail' ? selectedMachine : null}
      />

      <div
        aria-live="polite"
        className="no-print fixed bottom-5 left-5 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs shadow-lg ${
              toast.tone === 'warning'
                ? 'border-[#B3265E] bg-[#B3265E] text-[#FBF8F2]'
                : 'border-[#231A3B] bg-[#231A3B] text-[#FBF8F2] dark:border-[#8B79C2]'
            }`}
          >
            {toast.tone === 'warning' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#E6FF3D]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E6FF3D]" />
            )}
            <div>
              <p className="font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] opacity-85">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}
              className="ml-2 opacity-75 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
