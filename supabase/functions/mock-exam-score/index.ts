import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated user — prevents unauth callers from draining AI credits.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { answers, totalTime, examType = "full" } = await req.json();

    if (!Array.isArray(answers) || answers.length === 0 || answers.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid answers payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["full", "rw", "math"].includes(examType)) {
      return new Response(JSON.stringify({ error: "Invalid examType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const isFull = examType === "full";
    const scoreMax = isFull ? 1600 : 800;
    const scoreMin = isFull ? 400 : 200;

    // Build topic breakdown
    const topicMap: Record<string, { correct: number; total: number }> = {};
    for (const a of answers) {
      if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0 };
      topicMap[a.topic].total++;
      if (a.isCorrect) topicMap[a.topic].correct++;
    }

    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const totalCount = answers.length;
    const accuracy = correctCount / totalCount;

    // Section breakdown for full exam
    let sectionInfo = "";
    const rwAnswers = answers.filter((a: any) => a.category === "reading_writing");
    const mathAnswers = answers.filter((a: any) => a.category === "math");
    if (isFull && rwAnswers.length > 0 && mathAnswers.length > 0) {
      const rwCorrect = rwAnswers.filter((a: any) => a.isCorrect).length;
      const mathCorrect = mathAnswers.filter((a: any) => a.isCorrect).length;
      sectionInfo = `\nSection breakdown: R&W ${rwCorrect}/${rwAnswers.length} (${Math.round((rwCorrect / rwAnswers.length) * 100)}%), Math ${mathCorrect}/${mathAnswers.length} (${Math.round((mathCorrect / mathAnswers.length) * 100)}%)`;
    }

    const summaryText = answers.map((a: any, i: number) => {
      return `Q${i + 1} [${a.topic}/${a.category}, D${a.difficulty}]: "${a.questionText}" | Answer: ${a.selectedAnswer !== null ? a.options[a.selectedAnswer] : 'SKIPPED'} | Correct: ${a.options[a.correctAnswer]} | ${a.isCorrect ? '✓' : '✗'} | Time: ${a.timeSpent}s`;
    }).join("\n");

    const topicSummary = Object.entries(topicMap).map(([t, d]) =>
      `${t}: ${d.correct}/${d.total} (${Math.round((d.correct / d.total) * 100)}%)`
    ).join(", ");

    const toolParams: any = {
      type: "object",
      properties: {
        estimatedScore: {
          type: "number",
          description: `Estimated SAT ${isFull ? 'total' : 'section'} score on ${scoreMin}-${scoreMax} scale`
        },
        weakAreas: {
          type: "array",
          items: { type: "string" },
          description: "3-5 specific weak areas"
        },
        studyPlan: {
          type: "array",
          items: { type: "string" },
          description: "7-day study plan with daily tasks"
        }
      },
      required: ["estimatedScore", "weakAreas", "studyPlan"],
      additionalProperties: false
    };

    // Add section scores for full exam
    if (isFull) {
      toolParams.properties.rwScore = { type: "number", description: "R&W section score 200-800" };
      toolParams.properties.mathScore = { type: "number", description: "Math section score 200-800" };
      toolParams.required.push("rwScore", "mathScore");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: "Generate a structured SAT performance diagnostic report",
              parameters: toolParams
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_report" } },
        messages: [
          {
            role: "system",
            content: `You are an expert SAT scoring engine. Generate an accurate performance diagnostic.
- ${isFull ? 'Total SAT score: 400-1600 (sum of R&W 200-800 + Math 200-800)' : `Section score: ${scoreMin}-${scoreMax}`}
- Use accuracy, difficulty distribution, and topic performance
- Identify specific weak areas (skills, not just topic names)
- Create an actionable 7-day study plan
- Be encouraging but honest`
          },
          {
            role: "user",
            content: `SAT ${isFull ? 'Full' : examType === 'rw' ? 'Reading & Writing' : 'Math'} Exam Results:
Total: ${correctCount}/${totalCount} correct (${Math.round(accuracy * 100)}%)
Time used: ${Math.round(totalTime / 60)} minutes${sectionInfo}
Topic breakdown: ${topicSummary}

Detailed results:
${summaryText}`
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    let aiReport;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      aiReport = JSON.parse(toolCall.function.arguments);
    } catch {
      aiReport = {
        estimatedScore: Math.round(scoreMin + accuracy * (scoreMax - scoreMin)),
        weakAreas: ["Unable to generate detailed analysis"],
        studyPlan: ["Review your incorrect answers and practice weak topics"],
      };
    }

    // Build topic breakdown with percentages
    const topicBreakdown: Record<string, any> = {};
    for (const [topic, d] of Object.entries(topicMap)) {
      topicBreakdown[topic] = {
        correct: d.correct,
        total: d.total,
        percentage: Math.round((d.correct / d.total) * 100),
      };
    }

    const result: any = {
      estimatedScore: aiReport.estimatedScore,
      correctCount,
      totalCount,
      weakAreas: aiReport.weakAreas,
      studyPlan: aiReport.studyPlan,
      topicBreakdown,
      examType,
    };

    if (isFull && aiReport.rwScore && aiReport.mathScore) {
      result.sectionScores = { rw: aiReport.rwScore, math: aiReport.mathScore };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Mock exam scoring error:", e);
    return new Response(JSON.stringify({ error: "Scoring failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
