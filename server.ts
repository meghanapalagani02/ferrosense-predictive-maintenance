import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/advisor', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({ fallback: true, reason: 'No runtime API key configured' });
      return;
    }

    const body = req.body as {
      question?: string;
      machinesSummary?: string;
      focusedMachine?: string | null;
    };

    const question = (body.question || '').trim();
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = [
        'You are the FerroSense Industrial Reliability & Predictive Maintenance Advisor.',
        'Respond concisely, clearly, and quantitatively using the provided live factory telemetry snapshot.',
        'Reference exact sensor readings (Air Temp K, Process Temp K, RPM, Torque Nm, Tool Wear min, Vibration mm/s), failure probability %, dominant AI4I failure mode, RUL hours, and concrete corrective maintenance actions.',
        'Do not invent machines that are not in the snapshot. Keep answers under 140 words in plain structured paragraphs or concise bullet points.',
      ].join(' ');

      const prompt = [
        body.focusedMachine ? `Focused Machine Context:\n${body.focusedMachine}\n` : '',
        `Live Fleet Telemetry Snapshot:\n${body.machinesSummary || 'Unavailable'}\n`,
        `Engineer Question: ${question}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.json({ fallback: true, reason: 'Empty model response' });
        return;
      }

      res.json({ fallback: false, answer, source: 'gemini' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream error';
      res.json({ fallback: true, reason: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FerroSense server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start FerroSense server:', error);
  process.exit(1);
});
