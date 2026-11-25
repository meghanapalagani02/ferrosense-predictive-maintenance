import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Cpu,
  Database,
  Layers,
  Radio,
  Server,
  Terminal,
} from 'lucide-react';

export const AboutArchitecture: React.FC = () => {
  const [espImgErr, setEspImgErr] = useState(false);
  const [cncImgErr, setCncImgErr] = useState(false);

  const architectureNodes = [
    { title: 'Sensors / ESP32', sub: 'DHT22, MPU6050, ACS712', icon: Radio },
    { title: 'MQTT Broker', sub: 'Mosquitto TLS · 2s QoS 1', icon: Layers },
    { title: 'Edge Gateway', sub: 'Ring buffer & ΔT / Power calc', icon: Server },
    { title: 'ML Service', sub: 'XGBoost + AI4I Scoring', icon: Cpu },
    { title: 'Dashboard', sub: 'React + Recharts Command UI', icon: Database },
    { title: 'Alerts & Planner', sub: 'Triage, RUL & Work Orders', icon: Bell },
  ];

  const roadmap = [
    {
      phase: 'Phase 1 · Current',
      title: 'Deterministic Edge Simulation & Explainable Triage',
      detail: '12-asset digital twin, AI4I 2020 failure rules, SHAP attribution, and Kanban dispatch.',
    },
    {
      phase: 'Phase 2 · Q1',
      title: 'Live ESP32 MQTT Bridge',
      detail: 'WebSocket relay ingesting physical vibration FFT and clamp-meter current waveforms.',
    },
    {
      phase: 'Phase 3 · Q2',
      title: 'ERP & CMMS Integration',
      detail: 'Automated spare-parts reservation and technician shift sync via REST webhooks.',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="text-sm font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
          System Blueprint &amp; Edge Hardware
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#231A3B] dark:text-[#F4EEE4]">
          Architecture &amp; IoT Integration
        </h1>
      </div>

      {/* System Architecture Diagram */}
      <section className="rounded-2xl border border-[#231A3B] bg-[#231A3B] p-6 text-[#FBF8F2] sm:p-8 dark:border-[#3E3163] dark:bg-[#19122B]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-mono text-[#E6FF3D]">End-to-End Telemetry Topology</p>
            <h2 className="mt-1 font-display text-xl font-bold">
              Factory Floor to Predictive Dispatch Pipeline
            </h2>
          </div>
          <span className="font-mono text-xs text-[#F4EEE4]/70">
            Sub-100ms inference latency
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {architectureNodes.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div key={node.title} className="relative flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-white/15 bg-white/8 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6FF3D] text-[#231A3B]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-bold text-[#FBF8F2]">
                    {node.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#F4EEE4]/75">{node.sub}</p>
                </div>
                {idx < architectureNodes.length - 1 && (
                  <ArrowRight
                    className="hidden h-4 w-4 shrink-0 text-[#E6FF3D] lg:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* IoT Hardware Integration Showcase */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-7 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <p className="text-xs font-medium text-[#5E4B9A] dark:text-[#E6FF3D]">
            Hardware Prototype Spec
          </p>
          <h2 className="font-display text-2xl font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            ESP32 + DHT22 / MPU6050 / ACS712 Edge Node
          </h2>
          <p className="text-sm leading-relaxed text-[#231A3B]/80 dark:text-[#F4EEE4]/80">
            In production, each CNC spindle or motor housing mounts a compact DIN-rail ESP32 edge
            node. Every 2,000 ms, the microcontroller samples ambient &amp; housing thermal sensors
            (DHT22 / PT100), tri-axial vibration RMS (MPU6050), and motor draw current (ACS712),
            publishing a lightweight JSON frame over MQTT to the gateway.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F4EEE4] p-3.5 dark:bg-[#1E1635]">
              <p className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">DHT22 / PT100</p>
              <p className="mt-1 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                Captures Air Temp &amp; Process Temp to compute cooling ΔT.
              </p>
            </div>
            <div className="rounded-xl bg-[#F4EEE4] p-3.5 dark:bg-[#1E1635]">
              <p className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">MPU6050 IMU</p>
              <p className="mt-1 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                1 kHz accelerometer burst converted to RMS vibration (mm/s).
              </p>
            </div>
            <div className="rounded-xl bg-[#F4EEE4] p-3.5 dark:bg-[#1E1635]">
              <p className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">ACS712 + Hall</p>
              <p className="mt-1 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
                Measures motor torque current and optical spindle RPM.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#231A3B] p-4 font-mono text-xs text-[#F4EEE4] overflow-x-auto dark:bg-[#19122B]">
            <p className="mb-2 text-[#E6FF3D]">MQTT Topic: factory/line-a/cnc-07/telemetry</p>
            <pre className="leading-relaxed">
{`{
  "machineId": "CNC-07",
  "airTempK": 298.4,
  "processTempK": 309.1,
  "rotationalSpeedRpm": 1615,
  "torqueNm": 38.9,
  "toolWearMin": 68.4,
  "vibrationMmS": 1.92
}`}
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#2C2149]">
            {!espImgErr ? (
              <img
                src="/src/assets/images/iot_esp32_node_1795620953186.jpg"
                alt="ESP32 industrial IoT vibration and current sensing enclosure"
                referrerPolicy="no-referrer"
                onError={() => setEspImgErr(true)}
                className="h-56 w-full object-cover"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-[#231A3B] text-[#E6FF3D]">
                <Cpu className="h-12 w-12" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                DIN-Rail Edge Telemetry Enclosure
              </h3>
              <p className="mt-1 text-xs text-[#231A3B]/70 dark:text-[#F4EEE4]/70">
                ESP32-WROOM node wired to MEMS accelerometer and clamp-on CT transducer.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] dark:border-[#3E3163] dark:bg-[#2C2149]">
            {!cncImgErr ? (
              <img
                src="/src/assets/images/cnc_spindle_detail_1795620953079.jpg"
                alt="Precision CNC milling spindle assembly monitored by FerroSense"
                referrerPolicy="no-referrer"
                onError={() => setCncImgErr(true)}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-[#231A3B] text-[#8B79C2]">
                <Radio className="h-12 w-12" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                Instrumented Spindle Assembly
              </h3>
              <p className="mt-1 text-xs text-[#231A3B]/70 dark:text-[#F4EEE4]/70">
                Tracks carbide tool wear progression and overstrain torque spikes in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap + Local README */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
            Product Roadmap
          </h2>
          <div className="space-y-3">
            {roadmap.map((r) => (
              <div key={r.phase} className="rounded-xl bg-[#F4EEE4] p-4 dark:bg-[#1E1635]">
                <span className="font-mono text-xs font-bold text-[#5E4B9A] dark:text-[#E6FF3D]">
                  {r.phase}
                </span>
                <h3 className="mt-1 font-display text-sm font-bold text-[#231A3B] dark:text-[#F4EEE4]">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-[#231A3B]/75 dark:text-[#F4EEE4]/75">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Local Run README */}
        <div className="space-y-4 rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] p-6 lg:col-span-6 dark:border-[#3E3163] dark:bg-[#2C2149]">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-[#5E4B9A] dark:text-[#E6FF3D]" />
            <h2 className="font-display text-lg font-bold text-[#231A3B] dark:text-[#F4EEE4]">
              README — Running FerroSense Locally
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#231A3B]/75 dark:text-[#F4EEE4]/75">
            All prediction logic, fleet simulation, analytics, and Kanban scheduling run natively in
            the browser. Optionally configure <code className="font-mono">GEMINI_API_KEY</code> in{' '}
            <code className="font-mono">.env</code> to enable Gemini responses in the AI Advisor
            (otherwise the built-in telemetry rule engine answers automatically).
          </p>
          <div className="rounded-xl bg-[#231A3B] p-4 font-mono text-xs text-[#F4EEE4] space-y-1.5 overflow-x-auto dark:bg-[#19122B]">
            <p className="text-[#E6FF3D]"># 1. Install dependencies</p>
            <p>npm install</p>
            <p className="pt-2 text-[#E6FF3D]"># 2. Start development server on port 3000</p>
            <p>npm run dev</p>
            <p className="pt-2 text-[#E6FF3D]"># 3. Build production bundle</p>
            <p>npm run build &amp;&amp; npm start</p>
          </div>
        </div>
      </div>
    </div>
  );
};
