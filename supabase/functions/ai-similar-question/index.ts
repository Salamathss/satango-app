import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Digital SAT (DSAT) coach. Your task is to generate a new, similar practice question based on the question provided by the user.

RULES:
1. The new question must test the EXACT same SAT topic (e.g. Algebra, Systems of Equations, Command of Evidence, Transitions, etc.).
2. Change the variables, values, scenarios, names, or context to make it a fresh, unique question.
3. Return STRICTLY a raw JSON object with the following exact keys:
   {
     "question_text": "text of the new question",
     "options": ["Option A", "Option B", "Option C", "Option D"],
     "correct_answer": 0, // integer index of the correct answer (0, 1, 2, or 3)
     "explanation": "concise step-by-step explanation of the solution"
   }
4. DO NOT wrap the JSON inside markdown code blocks. Output raw JSON only.
5. Ensure the difficulty and quality align perfectly with official College Board DSAT questions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question_text, options, correct_answer } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      // Return a simulated backup question if API key is not configured
      const simulated = {
        question_text: `[Similar Practice] ${question_text.replace(/\d+/g, (n) => String(parseInt(n) * 2))}`,
        options: options || ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: correct_answer !== undefined ? correct_answer : 0,
        explanation: "This is a simulated practice question targeting the same concept with modified values.",
      };
      return new Response(JSON.stringify(simulated), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Original Question: ${question_text}\nOptions: ${JSON.stringify(options)}\nCorrect Answer Index: ${correct_answer}\n\nGenerate the JSON for a similar question.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Clean up potential markdown wrappers
    const cleanContent = rawContent.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleanContent);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI question generator error:", e);
    // Fallback simulation
    return new Response(JSON.stringify({
      error: true,
      explanation: "Failed to generate similar question via AI. Please try again later.",
    }), {
      status: 200, // return soft error structure
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
