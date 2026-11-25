import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { FailureMode, Machine, MaintenanceTask, TaskStatus } from '../lib/types';

interface MaintenancePlannerProps {
  tasks: MaintenanceTask[];
  machines: Machine[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Omit<MaintenanceTask, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectMachine: (machineId: string) => void;
}

const COLUMNS: TaskStatus[] = ['To Do', 'Scheduled', 'In Progress', 'Done'];
const TECHNICIANS = ['Ananya Rao', 'Vikram Patel', 'Marcus Chen', 'Priya Nair', 'Elena Novak'];

export const MaintenancePlanner: React.FC<MaintenancePlannerProps> = ({
  tasks,
  machines,
  onMoveTask,
  onAddTask,
  onDeleteTask,
  onSelectMachine,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [title, setTitle] = useState('Spindle Inspection & Wear Calibration');
  const [priority, setPriority] = useState<MaintenanceTask['priority']>('Urgent');
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [scheduledDate, setScheduledDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  );
  const [notes, setNotes] = useState('');

  const filteredTasks = tasks.filter((t) =>
    priorityFilter === 'All' ? true : t.priority === priorityFilter,
  );

  const handleDrop = (col: TaskStatus) => {
    if (draggedTaskId) {
      onMoveTask(draggedTaskId, col);
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const machine = machines.find((m) => m.id === selectedMachineId) || machines[0];
    if (!machine) return;
    onAddTask({
      machineId: machine.id,
      machineName: machine.name,
      machineCode: machine.code,
      title: title.trim() || `${machine.prediction.dominantFailureMode} Service`,
      failureMode: machine.prediction.dominantFailureMode as FailureMode,
      priority,
      status: 'To Do',
      scheduledDate,
      technician,
      estimatedHours: machine.prediction.recommendation.estimatedRepairHours,
      estimatedCostInr: machine.prediction.recommendation.plannedCostInr,
      notes: notes.trim() || machine.prediction.recommendation.action,
    });
    setModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            Work Order Dispatch
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
            Maintenance Planner
          </h1>
          <p className="mt-1 text-sm text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
            Drag cards across columns or use step buttons to advance work orders from triage to
            completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter work orders by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-[#E4DACB] bg-[#FBF8F2] px-3.5 py-2.5 text-xs font-semibold text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
          >
            <option value="All">All Priorities</option>
            <option value="Immediate">Immediate</option>
            <option value="Urgent">Urgent</option>
            <option value="Elevated">Elevated</option>
            <option value="Routine">Routine</option>
          </select>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#231A3B] px-5 py-2.5 text-sm font-semibold text-[#E6FF3D] transition-colors hover:bg-[#312551] whitespace-nowrap dark:bg-[#E6FF3D] dark:text-[#231A3B]"
          >
            <Plus className="h-4 w-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = filteredTasks.filter((t) => t.status === col);
          const isOver = dragOverCol === col;

          return (
            <section
              key={col}
              aria-label={`${col} maintenance column`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col)}
              className={`flex min-h-[420px] flex-col rounded-2xl border p-4 transition-colors ${
                isOver
                  ? 'border-[#8B79C2] bg-[#8B79C2]/10'
                  : 'border-[#E4DACB] bg-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#2C2149]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#E4DACB] pb-3 dark:border-[#3E3163]">
                <h2 className="font-display text-base font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  {col}
                </h2>
                <span className="rounded-lg bg-[#231A3B] px-2.5 py-0.5 font-mono text-xs font-bold text-[#E6FF3D] tabular-nums dark:bg-[#19122B]">
                  {colTasks.length}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#E4DACB] p-4 text-center dark:border-[#3E3163]">
                    <ClipboardList className="h-6 w-6 text-[#8B79C2]" />
                    <p className="mt-2 text-xs text-[#231A3B]/60 dark:text-[#F4EEE4]/65">
                      No work orders in {col}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const prioStyle =
                      task.priority === 'Immediate'
                        ? 'bg-[#B3265E] text-[#FBF8F2]'
                        : task.priority === 'Urgent'
                          ? 'bg-[#8B79C2] text-[#FBF8F2]'
                          : task.priority === 'Elevated'
                            ? 'bg-[#231A3B] text-[#E6FF3D]'
                            : 'bg-[#E6FF3D] text-[#231A3B]';

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className="cursor-grab rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 p-4 transition-all hover:border-[#8B79C2] active:cursor-grabbing dark:border-[#3E3163] dark:bg-[#1E1635]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectMachine(task.machineId)}
                            className="font-mono text-xs font-bold text-[#5E4B9A] hover:underline dark:text-[#E6FF3D]"
                          >
                            {task.machineCode} · {task.machineName}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                            className="rounded p-1 text-[#231A3B]/45 hover:bg-[#B3265E]/10 hover:text-[#B3265E] dark:text-[#F4EEE4]/55"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <h3 className="mt-1.5 font-display text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                          {task.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                          {task.notes}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${prioStyle}`}>
                            {task.priority}
                          </span>
                          <span className="font-mono text-[11px] text-[#5E4B9A] dark:text-[#C5B8E6]">
                            {task.technician}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-[#E4DACB] pt-2.5 text-[11px] text-[#231A3B]/70 dark:border-[#3E3163] dark:text-[#F4EEE4]/70">
                          <span className="font-mono">
                            {task.estimatedHours}h · ₹{task.estimatedCostInr.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={() => onMoveTask(task.id, COLUMNS[colIdx - 1])}
                              aria-label={`Move ${task.title} to previous stage`}
                              className="rounded-md border border-[#E4DACB] bg-[#FBF8F2] p-1 text-[#231A3B] disabled:opacity-35 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={colIdx === COLUMNS.length - 1}
                              onClick={() => onMoveTask(task.id, COLUMNS[colIdx + 1])}
                              aria-label={`Move ${task.title} to next stage`}
                              className="rounded-md border border-[#E4DACB] bg-[#FBF8F2] p-1 text-[#231A3B] disabled:opacity-35 hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Create Work Order Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231A3B]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-task-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 shadow-xl dark:border-[#3E3163] dark:bg-[#2C2149]">
            <div className="flex items-center justify-between border-b border-[#E4DACB] pb-4 dark:border-[#3E3163]">
              <h2 id="new-task-title" className="font-display text-xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                Create Maintenance Work Order
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#231A3B]/70 hover:bg-[#E4DACB]/50 dark:text-[#F4EEE4]/75"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="wo-machine" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Target Machine
                </label>
                <select
                  id="wo-machine"
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} ({m.prediction.failureProbability}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wo-title" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Work Order Title
                </label>
                <input
                  id="wo-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wo-tech" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                    Technician
                  </label>
                  <select
                    id="wo-tech"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                  >
                    {TECHNICIANS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="wo-prio" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                    Priority
                  </label>
                  <select
                    id="wo-prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenanceTask['priority'])}
                    className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Elevated">Elevated</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="wo-date" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Scheduled Window
                </label>
                <input
                  id="wo-date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div>
                <label htmlFor="wo-notes" className="block text-xs font-semibold text-[#231A3B] dark:text-[#F4EEE4]">
                  Notes
                </label>
                <textarea
                  id="wo-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional inspection instructions..."
                  className="mt-1.5 w-full rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3.5 py-2.5 text-sm text-[#231A3B] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E4DACB] px-4 py-2 text-sm font-semibold text-[#231A3B] dark:border-[#3E3163] dark:text-[#F4EEE4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#231A3B] px-5 py-2 text-sm font-semibold text-[#E6FF3D] dark:bg-[#E6FF3D] dark:text-[#231A3B]"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
