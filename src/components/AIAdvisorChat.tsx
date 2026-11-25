import React, { useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { answerAdvisorFallback } from '../lib/fleetData';
import type { AlertItem, Machine, MaintenanceTask } from '../lib/types';

interface AIAdvisorChatProps {
  machines: Machine[];
  alerts: AlertItem[];
  tasks: MaintenanceTask[];
  focusedMachine: Machine | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

const QUICK_PROMPTS = [
  'Which machines are critical right now?',
  'Why is PMP-03 at risk?',
  'Summarize fleet RUL & savings',
];

export const AIAdvisorChat: React.FC<AIAdvisorChatProps> = ({
  machines,
  alerts,
  tasks,
  focusedMachine,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, I am the FerroSense Reliability Advisor. Ask me why a machine is flagged, which assets need immediate maintenance, or how to reduce failure risk.',
    },
  ]);

  const sendQuestion = async (rawText: string) => {
    const question = rawText.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const machinesSummary = machines
      .map(
        (m, idx) =>
          `Machine ${idx + 1} (${m.code} ${m.name}, ${m.line}): ${m.prediction.failureProbability}% [${m.prediction.status}], Mode=${m.prediction.dominantFailureMode}, RUL=${m.prediction.rulHours}h, Air=${m.sensors.airTemp}K, Proc=${m.sensors.processTemp}K, RPM=${m.sensors.rotationalSpeed}, Torque=${m.sensors.torque}Nm, Wear=${m.sensors.toolWear}min, Vib=${m.sensors.vibration}mm/s`,
      )
      .join('\n');

    const focusedContext = focusedMachine
      ? `${focusedMachine.code} ${focusedMachine.name} (${focusedMachine.prediction.failureProbability}%, ${focusedMachine.prediction.dominantFailureMode}, top driver: ${focusedMachine.prediction.contributions[0]?.feature} ${focusedMachine.prediction.contributions[0]?.contributionPct}%)`
      : null;

    let replyText = '';
    let sourceLabel = 'Live Telemetry Engine';

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          machinesSummary,
          focusedMachine: focusedContext,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          fallback?: boolean;
          answer?: string;
          source?: string;
        };
        if (!data.fallback && data.answer) {
          replyText = data.answer;
          sourceLabel = 'Gemini Advisor';
        }
      }
    } catch {
      // Fall through cleanly to local rule-based responder
    }

    if (!replyText) {
      replyText = answerAdvisorFallback(question, machines, alerts, tasks, focusedMachine);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        source: sourceLabel,
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-50">
      {open ? (
        <section
          aria-label="AI Maintenance Advisor"
          className="flex h-[500px] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-[#231A3B] bg-[#FBF8F2] shadow-2xl dark:border-[#8B79C2] dark:bg-[#2C2149]"
        >
          <div className="flex items-center justify-between bg-[#231A3B] px-4 py-3.5 text-[#FBF8F2] dark:bg-[#19122B]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6FF3D] text-[#231A3B]">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold">Maintenance Advisor</h2>
                <p className="text-[11px] text-[#E6FF3D]">Connected to live telemetry</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Maintenance Advisor"
              className="rounded-lg p-1.5 text-[#F4EEE4]/80 hover:bg-white/10 hover:text-[#FBF8F2]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F4EEE4]/65 p-4 text-xs dark:bg-[#1E1635]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#8B79C2] text-[#FBF8F2]'
                      : 'border border-[#E4DACB] bg-[#FBF8F2] text-[#231A3B] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#F4EEE4]'
                  }`}
                >
                  {m.text}
                </div>
                {m.source && (
                  <span className="mt-1 px-1 text-[10px] font-mono text-[#5E4B9A] dark:text-[#E6FF3D]">
                    {m.source}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="inline-block rounded-2xl border border-[#E4DACB] bg-[#FBF8F2] px-3.5 py-2 text-xs text-[#5E4B9A] dark:border-[#3E3163] dark:bg-[#2C2149] dark:text-[#E6FF3D]">
                Analyzing live sensor state...
              </div>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-t border-[#E4DACB] bg-[#FBF8F2] px-3 py-2 dark:border-[#3E3163] dark:bg-[#2C2149]">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuestion(q)}
                className="shrink-0 rounded-lg border border-[#E4DACB] bg-[#F4EEE4] px-2.5 py-1 text-[11px] font-medium text-[#231A3B] hover:border-[#8B79C2] dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex items-center gap-2 border-t border-[#E4DACB] bg-[#FBF8F2] p-3 dark:border-[#3E3163] dark:bg-[#2C2149]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about machine health..."
              aria-label="Ask Maintenance Advisor"
              className="flex-1 rounded-xl border border-[#E4DACB] bg-[#F4EEE4]/70 px-3 py-2 text-xs text-[#231A3B] focus:border-[#8B79C2] focus:outline-none dark:border-[#3E3163] dark:bg-[#1E1635] dark:text-[#F4EEE4]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#231A3B] text-[#E6FF3D] disabled:opacity-40 hover:bg-[#312551] dark:bg-[#E6FF3D] dark:text-[#231A3B]"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI Maintenance Advisor"
          className="inline-flex items-center gap-2.5 rounded-2xl border border-[#231A3B] bg-[#231A3B] px-4 py-3 text-sm font-semibold text-[#E6FF3D] shadow-lg transition-transform hover:-translate-y-0.5 dark:border-[#8B79C2] dark:bg-[#E6FF3D] dark:text-[#231A3B]"
        >
          <Bot className="h-5 w-5" />
          <span className="whitespace-nowrap">AI Advisor</span>
        </button>
      )}
    </div>
  );
};
