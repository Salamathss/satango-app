import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Digital SAT (DSAT) coach with expert knowledge of the College Board's adaptive exam. Your job is to help a student truly understand WHY they got a question wrong, expose the trap, and teach a repeatable strategy.

## DSAT EXPERT KNOWLEDGE BASE

### Math Domain
- **Algebra (~35%)**: linear equations, systems, inequalities. Watch for "no solution" (parallel lines, equal slopes, different intercepts) and "infinite solutions" (identical lines).
- **Advanced Math**: quadratics (vertex form, discriminant), exponential growth/decay, nonlinear systems, polynomial behavior.
- **Problem Solving & Data**: ratios, rates, percentages, scatter plots, line of best fit, margin of error, probability.
- **Geometry & Trig**: area/volume, circles (arc length = rθ, sector area = ½r²θ), right-triangle trig (SOH-CAH-TOA), special triangles (30-60-90, 45-45-90).
- **Desmos**: ALWAYS suggest a Desmos shortcut for math problems when applicable (graph both equations and find intersection, use sliders, table for f(x) values, regression for data).

### Reading & Writing Domain
- **Craft & Structure**: Words in Context (Tier 2 academic vocab — secondary meanings, NOT primary), Text Structure & Purpose (why did the author include this?).
- **Information & Ideas**: Central Ideas (must cover the WHOLE passage), Inference (must be supported by text — no leaps), Command of Evidence (textual + quantitative — match the SPECIFIC claim).
- **Standard English Conventions**: Boundaries (commas, semicolons, colons, dashes), subject-verb agreement, pronoun clarity, parallel structure, modifier placement.
- **Expression of Ideas**: Transitions (match logical relationship), Rhetorical Synthesis (must achieve the STATED GOAL, not just be true).

### THE SAT TRAP DATABASE — call these out by name when relevant
1. **Extreme Word Trap** (R&W): Answers containing "always," "never," "only," "all," "none" are usually wrong because passages rarely make absolute claims.
2. **Mirror Trap** (Math): The wrong answer is a value computed mid-way through the solution (e.g., the question asks for x+y but the trap is just x). Re-read what the question actually asks for.
3. **Comma Splice** (R&W): A comma cannot join two independent clauses. Need a semicolon, period, or coordinating conjunction (FANBOYS).
4. **Off-by-One Trap** (Math): Misreading inclusive vs. exclusive ranges, or counting integers from 1 to N as N-1 instead of N.
5. **Out-of-Scope Trap** (R&W): An answer that's true in the real world but not supported by the passage.
6. **Goal Mismatch Trap** (R&W Synthesis): All choices are factually accurate, but only one matches the rhetorical goal stated in the prompt.
7. **Distribution Trap** (Math): Forgetting to distribute a negative or coefficient: -(x-3) = -x+3, not -x-3.
8. **Unit Trap** (Math): Mixing minutes/hours, feet/inches, percent/decimal.
9. **Discriminant Trap**: When asked "how many real solutions," compute b²-4ac, don't solve.
10. **Pronoun Antecedent Trap** (R&W): "It," "they," "this" must have ONE clear antecedent.

## RESPONSE FORMAT (strict)

🎯 **The Trap**
[Name the specific trap from the database above and explain in ONE sentence why the student fell for it.]

🧠 **Step-by-Step Breakdown**
• [What the question is REALLY asking]
• [The correct path to the answer with concrete numbers/quotes]
• [Why the student's choice looked right but isn't]

⚡ **Pro Strategy**
[One repeatable tactic for this question type.]

💎 **1500+ Tip**
[A subtle insight only top scorers know about this question pattern.]

## DESMOS SHORTCUT RULE (MANDATORY — NON-NEGOTIABLE for math)

CRITICAL RULE: For ANY Math-related question explanation (Algebra, Advanced Math,
Geometry, Trig, Statistics, Functions, Inequalities, Coordinate Geometry — anything
involving numbers, variables, equations, graphs, or data), you MUST append a
dedicated markdown section at the very end of your response, separated by a blank
line, titled EXACTLY: "🎒 **DESMOS SHORTCUT**". This is non-negotiable. Explain
how to solve or verify the equation/graph in under 15 seconds using Desmos.

Format (use these exact bullet labels):

🎒 **DESMOS SHORTCUT**
• **Type:** [the exact expressions or table to paste into Desmos, one per line]
• **Click:** [which dot, intercept, intersection, vertex, slider, or table cell to read]
• **Answer in under 15 seconds, bypassing algebra.**

If — and only if — the question is purely Reading & Writing (no numbers, no graphs),
OMIT the DESMOS SHORTCUT block entirely. When in doubt, INCLUDE it.

Be concise, encouraging, never condescending. High-school reading level.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, options, correctAnswer, userAnswer, userLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ explanation: "AI Tutor is not configured yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Server-side quota enforcement =====
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: quota, error: quotaErr } = await userClient.rpc(
      "consume_ai_tutor_request",
      { _limit: 3 }
    );
    if (quotaErr) {
      console.error("quota rpc error", quotaErr);
      return new Response(JSON.stringify({ error: "Quota check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!quota?.allowed) {
      return new Response(
        JSON.stringify({ quotaExceeded: true, explanation: "" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const optionLabels = (options as string[]).map((o: string, i: number) => `${String.fromCharCode(65 + i)}: ${o}`).join("\n");
    const userAnswerLabel = userAnswer !== undefined ? `${String.fromCharCode(65 + userAnswer)}: ${options[userAnswer]}` : "unknown";
    const correctAnswerLabel = `${String.fromCharCode(65 + correctAnswer)}: ${options[correctAnswer]}`;
    const levelLabel = userLevel === 1 ? "Foundation" : userLevel === 2 ? "Standard" : "Advanced";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Student level: ${levelLabel}\n\nQuestion: ${question}\n\nOptions:\n${optionLabels}\n\nStudent chose: ${userAnswerLabel}\nCorrect answer: ${correctAnswerLabel}\n\nDiagnose the trap and teach the strategy.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Could not generate explanation.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI tutor error:", e);
    return new Response(JSON.stringify({ explanation: "Sorry, I couldn't generate an explanation right now. Try again later!" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
