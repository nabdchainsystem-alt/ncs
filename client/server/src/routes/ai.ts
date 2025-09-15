import { Router } from 'express';

const router = Router();

// small fetch helper (Node <18 fallback)
async function gfetch(url: string, init?: any) {
  const gf: any = (globalThis as any).fetch;
  if (gf) return gf(url, init);
  const mod = await import('node-fetch');
  return (mod.default as any)(url, init);
}

router.get('/health', async (_req, res) => {
  res.json({ ok: true, openaiKey: !!process.env.OPENAI_API_KEY });
});

router.post('/ask', async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error('[AI] missing OPENAI_API_KEY');
      return res.status(500).json({ error: 'missing_openai_key' });
    }

    const prompt = String(req.body?.prompt || '').slice(0, 4000);
    if (!prompt) return res.status(400).json({ error: 'empty_prompt' });

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant embedded in the NCS procurement app.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    } as const;

    const r = await gfetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('[AI] OpenAI error', r.status, errText);
      return res.status(500).json({ error: 'openai_failed', details: errText });
    }
    const data: any = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: 'ai_ask_failed' });
  }
});

export default router;
