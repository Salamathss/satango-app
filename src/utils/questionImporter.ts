import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Validate a single question object structure.
 * Required fields: category, topic, difficulty, question_text, choices, correct_answer.
 * Trims all string fields and removes leading/trailing whitespace.
 */
function validateAndSanitize(question: any): any {
  const required = ['category', 'topic', 'difficulty', 'question_text', 'choices', 'correct_answer'];
  for (const key of required) {
    if (!(key in question)) {
      throw new Error(`Missing required field "${key}" in question: ${JSON.stringify(question)}`);
    }
  }

  // Trim string fields
  const sanitized: any = { ...question };
  ['category', 'topic', 'difficulty', 'question_text', 'correct_answer', 'explanation', 'ai_tutor_prompt', 'passage'].forEach((k) => {
    if (typeof sanitized[k] === 'string') {
      sanitized[k] = sanitized[k].trim();
    }
  });

  // Ensure choices is an array of trimmed strings
  if (!Array.isArray(sanitized.choices)) {
    throw new Error('Field "choices" must be an array');
  }
  sanitized.choices = sanitized.choices.map((c: any) => (typeof c === 'string' ? c.trim() : c));

  return sanitized;
}

/**
 * Bulk import an array of SAT questions into Supabase.
 * @param questionsArray Array of question objects.
 * @returns The number of inserted rows.
 */
export async function importQuestions(questionsArray: any[]): Promise<number> {
  if (!Array.isArray(questionsArray)) {
    throw new Error('importQuestions expects an array of question objects');
  }

  const sanitized = questionsArray.map(validateAndSanitize);

  // Perform bulk insert - Supabase accepts an array of objects.
  const { data, error } = await supabase.from('questions').insert(sanitized as any);

  if (error) {
    console.error('Supabase bulk insert error:', error);
    throw error;
  }

  // Ensure we always return a number even if data is null or undefined
  if (!data) {
    return 0;
  }
  return (data as any[]).length;
}
