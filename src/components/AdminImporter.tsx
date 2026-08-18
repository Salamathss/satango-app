// src/components/AdminImporter.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { importQuestions } from "@/utils/questionImporter"; // Supabase insertion disabled
import template from "@/data/sat_template.json";
import { supabase } from "@/integrations/supabase/client";
import { SAT_MODULES } from "@/lib/modules";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Human-readable labels for topic slugs
const TOPIC_LABELS: Record<string, string> = {
  "linear-equations": "Linear Equations",
  "central-ideas": "Central Ideas",
  "standard-conventions": "Standard English Conventions",
  "percentages": "Percentages",
  "geometry": "Geometry",
  "statistics": "Statistics & Data Analysis",
  "words-in-context": "Words in Context",
  "ratios-rates": "Ratios & Rates",
  "quadratics": "Quadratics",
  "systems-of-equations": "Systems of Equations",
  "advanced-math": "Advanced Math",
  "text-structure": "Text Structure & Purpose",
  "expression-of-ideas": "Expression of Ideas",
  "command-of-evidence": "Command of Evidence",
  "rhetorical-synthesis": "Rhetorical Synthesis",
};

// Lookup map: topic slug → module number, built from SAT_MODULES
// e.g. "linear-equations" → 1, "standard-conventions" → 2, etc.
const TOPIC_TO_MODULE: Record<string, number> = {};
SAT_MODULES.forEach((mod) => {
  mod.topics.forEach((slug) => {
    // Only set if not already assigned (first module wins for shared topics)
    if (!(slug in TOPIC_TO_MODULE)) {
      TOPIC_TO_MODULE[slug] = mod.id;
    }
  });
});

/**
 * Admin page for bulk importing SAT questions into Supabase.
 * Includes manual JSON upload and AI‑generated question creation via Gemini.
 */
export default function AdminImporter() {
  const navigate = useNavigate();
  // Hardcoded fallback OpenRouter API key (never empty)
  const HARDCODED_OPENROUTER_KEY = "sk-or-v1-8b535d28ac2a81c802f4d2ae512be265a22a6ac624b0dde99bbb7ab22745178";
  // ----- Manual upload state -----
  const [jsonInput, setJsonInput] = useState<string>("");
  const [manualLoading, setManualLoading] = useState<boolean>(false);
  const [manualStatus, setManualStatus] = useState<string>("");

  // ----- AI generation state -----
  const [section, setSection] = useState("Reading & Writing");
  const [moduleNum, setModuleNum] = useState<number>(1);
  const [domain, setDomain] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  // Dynamically get available topics from the selected module
  const availableTopics = useMemo(() => {
    const mod = SAT_MODULES.find(m => m.id === moduleNum);
    return mod?.topics || [];
  }, [moduleNum]);

  // Auto-select first topic when module changes
  useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.includes(domain)) {
      setDomain(availableTopics[0]);
    }
  }, [availableTopics]);
  const [count, setCount] = useState<number>(5);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genStatus, setGenStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_GROQ_API_KEY || "");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Load API key from .env or localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("gemini_api_key");
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    setApiKey(envKey ?? stored ?? "");
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
  };

  // ----- Manual upload handler -----
  const handleManualUpload = async () => {
    setManualLoading(true);
    setManualStatus("");
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Input JSON must be an array of question objects.");
      setGeneratedQuestions(parsed);
      const msg = `Parsed ${parsed.length} question${parsed.length !== 1 ? "s" : ""}.`;
      setManualStatus(msg);
      toast.success(msg);
    } catch (e: any) {
      const err = e.message || "Unexpected error";
      setManualStatus(`Error: ${err}`);
      toast.error(err);
    } finally {
      setManualLoading(false);
    }
  };

  // ----- Template download -----
  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sat_template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----- AI generation handler -----
  const handleGenerateAndUpload = async () => {
    // No explicit API key validation – effectiveKey will always have a fallback.
    setGenerating(true);
    setProgress(0);
    setGenStatus("");
    try {
      // Persist key for future sessions
      saveApiKey(apiKey);

      setProgress(20);
      const topicLabel = TOPIC_LABELS[domain] || domain;
      const prompt = `Generate ${count} SAT question${count !== 1 ? 's' : ''} for the Digital SAT.
Section: ${section}
Topic: ${topicLabel} (slug: "${domain}")
Module/Unit: ${moduleNum}
Difficulty: ${difficulty}
Each question must be a JSON object with the following fields:
- "category": "${section}",
- "topic": "${domain}",
- "module": ${moduleNum},
- "difficulty": "${difficulty}",
- "passage": ${section === 'Reading & Writing' ? 'a short passage string (or null if not needed)' : 'null'},
- "question_text": "...",
- "choices": ["A", "B", "C", "D"],
- "correct_answer": "A" (the exact text of the correct choice),
- "explanation": "...",
- "ai_tutor_prompt": "A brief instruction for an AI tutor on how to explain this question step-by-step to a student"
Return a JSON array of objects without any additional commentary`;
        // Use Groq API for AI generation
        const keyToUse = apiKey?.trim() || import.meta.env.VITE_GROQ_API_KEY || 'gsk_ТВОЙ_КЛЮЧ_ЗДЕСЬ';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keyToUse}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert SAT question generator. Output ONLY a raw, valid JSON array of question objects without markdown blocks, code wrappers, or any explanation text.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Ошибка Groq API');
        const rawContent = data.choices[0].message.content;
        const generated = JSON.parse(rawContent.trim());
      setProgress(60);
      // const added = await importQuestions(generated);
      setProgress(100);
      setGeneratedQuestions(generated);
      const msg = `Successfully generated ${generated.length} question${generated.length !== 1 ? "s" : ""}.`;
      setGenStatus(msg);
      toast.success(msg);
    } catch (e: any) {
      let errMsg = e.message || "Unexpected error";
      if (e.status === 429) errMsg = "Rate limit exceeded (429). Please wait before trying again.";
      setGenStatus(`Error: ${errMsg}`);
      toast.error(errMsg);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full flex justify-center py-4 sm:py-8">
  <div className="w-full max-w-[95rem] px-4 md:px-8">
  <Button asChild variant="outline"><Link to="/">← Back to Dashboard</Link></Button>
      {/* Manual JSON upload */}
      <div>
        <h2 className="text-2xl font-bold">Bulk Question Importer</h2>
        <p className="text-muted-foreground mb-4">
          Paste a JSON array of question objects below or download the template to get started.
        </p>
        <textarea
          className="w-full h-48 p-3 border rounded-md bg-background text-foreground font-mono"
          placeholder='[ { "category": "Math", ... }, ... ]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <div className="flex gap-4 mt-4">
          <Button onClick={handleManualUpload} disabled={manualLoading || !jsonInput.trim()}>
            {manualLoading ? "Uploading…" : "Parse JSON"}
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            Download JSON Template
          </Button>
        </div>
        {manualStatus && <p className="mt-2 text-sm font-medium">{manualStatus}</p>}
      </div>

      {/* AI Generation */}
      <div className="border-t border-border/60 pt-6">
        <h2 className="text-2xl font-bold mb-4">AI Question Generator (Groq)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reading & Writing">Reading & Writing</SelectItem>
                <SelectItem value="Math">Math</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Module / Unit */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit / Module (1–9)</label>
            <Select value={String(moduleNum)} onValueChange={(v) => setModuleNum(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {SAT_MODULES.map((mod) => (
                  <SelectItem key={mod.id} value={String(mod.id)}>
                    {mod.icon} {mod.name} — {mod.subtitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Topic (slug, filtered by module) */}
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {availableTopics.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {TOPIC_LABELS[slug] || slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Count */}
          <div>
            <label className="block text-sm font-medium mb-1">Number of questions (1‑20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
              className="w-full border rounded-md p-2 bg-background text-foreground"
            />
          </div>
          {/* API Key */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Gemini API Key</label>
            <input
              type="password"
              placeholder="Enter Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border rounded-md p-2 bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The key will be stored locally in your browser for future sessions.
            </p>
          </div>
          <div className="col-span-1 md:col-span-2 flex items-center gap-4 mt-2">
            <Button onClick={handleGenerateAndUpload} disabled={generating}>
              {generating ? "Generating…" : "🚀 Сгенерировать и залить в Supabase"}
            </Button>
            {generating && (
              <progress max={100} value={progress} className="w-32 h-4 bg-muted rounded" />
            )}
          </div>
        </div>
        {genStatus && <p className="mt-3 text-sm font-medium">{genStatus}</p>}
      </div>
      {generatedQuestions.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Preview Generated Questions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-card shadow-sm">
                <p className="font-medium mb-2">{idx + 1}. {q.question_text}</p>
                <ul className="list-disc list-inside mb-2">
                  {q.choices?.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <p className="text-sm text-green-600 font-semibold">Answer: {q.correct_answer}</p>
                {q.explanation && (
                  <p className="text-sm text-muted-foreground mt-1">Explanation: {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={() => {
              const blob = new Blob([JSON.stringify(generatedQuestions, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "generated_questions.json";
              a.click();
              URL.revokeObjectURL(url);
            }}>Download JSON</Button>
            
            <Button 
              onClick={async () => {
                setManualLoading(true);
                try {
                  const sanitized = generatedQuestions.map((q: any) => {
                    // Map difficulty from string to number (1: Easy, 2: Medium, 3: Hard)
                    let diffNum = 1;
                    if (q.difficulty === "Medium") diffNum = 2;
                    else if (q.difficulty === "Hard") diffNum = 3;

                    // Locate correct_answer index in choices
                    const choices = q.choices || q.options || [];
                    const correctAnsStr = q.correct_answer || q.answer;
                    let correctIndex = choices.indexOf(correctAnsStr);
                    if (correctIndex === -1) {
                      // fallback logic in case it's already an index or not matching
                      const parsedIdx = parseInt(correctAnsStr, 10);
                      correctIndex = isNaN(parsedIdx) ? 0 : parsedIdx;
                    }

                    // Prioritize UI module selection, fallback to topic map, then default to 1
                    const topicSlug = q.topic || domain || "linear-equations";
                    const resolvedModule = Number(moduleNum) || TOPIC_TO_MODULE[topicSlug] || 1;

                    return {
                      category: q.category || section || "Math",
                      topic: topicSlug,
                      module: resolvedModule,
                      difficulty: diffNum,
                      question_text: q.question_text || q.question,
                      options: choices,
                      correct_answer: correctIndex,
                      explanation: q.explanation || "",
                      ai_tutor_prompt: q.ai_tutor_prompt || q.explanation || ""
                    } as any;
                  });
                  
                  const { error } = await supabase.from("questions").insert(sanitized);
                  if (error) throw error;
                  
                  toast.success("Все вопросы успешно загружены в Supabase! 🎉");
                  setGeneratedQuestions([]);
                } catch (e: any) {
                  toast.error(e.message || "Не удалось загрузить вопросы");
                } finally {
                  setManualLoading(false);
                }
              }}
              disabled={manualLoading}
            >
              {manualLoading ? "Загрузка..." : "Save to Supabase (Загрузить в Supabase)"}
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
