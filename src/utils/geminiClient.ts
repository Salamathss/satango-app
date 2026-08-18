import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Generate SAT questions using Gemini API.
 * @param params - generation parameters.
 * @returns Array of question objects matching the DB schema.
 */
export async function generateQuestions(params: {
  section: 'Reading & Writing' | 'Math';
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  count: number;
}): Promise<any[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)');
  }

  const prompt = `Generate ${params.count} SAT question${params.count !== 1 ? 's' : ''} for the Digital SAT.
Section: ${params.section}
Domain: ${params.domain}
Difficulty: ${params.difficulty}
Each question must be a JSON object with the following fields:
- "category": "${params.section}",
- "topic": "${params.domain}",
- "difficulty": "${params.difficulty}",
- "passage": ${params.section === 'Reading & Writing' ? 'a short passage string (or null if not needed)' : 'null'},
- "question_text": "...",
- "choices": ["A", "B", "C", "D"],
- "correct_answer": "A" (the exact text of the correct choice),
- "explanation": "...",
- "ai_tutor_prompt": "..."
Return a JSON array of objects without any additional commentary.`;

  // Try multiple model versions in order until one succeeds
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.0-flash'];
  let responseData: any = null;
  let lastError: string | null = null;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (res.ok) {
        responseData = await res.json();
        break; // success
      } else {
        const errData = await res.json().catch(() => null);
        lastError = errData?.error?.message || res.statusText;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  if (!responseData) {
    throw new Error(`All Gemini models failed. Last error: ${lastError}`);
  }

  const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Unexpected Gemini response format');
  }

  try {
    const parsed = JSON.parse(text.trim());
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response is not an array');
    }
    return parsed;
  } catch (e) {
    throw new Error('Failed to parse Gemini JSON output: ' + (e as Error).message);
  }
}
