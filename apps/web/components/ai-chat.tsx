"use client";

import { useState, useTransition, type FormEvent } from "react";

import { askAI } from "@/lib/api";

type Props = {
  plantId: number;
};

export function AiChat({ plantId }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswer(null);
    setError(null);

    startTransition(async () => {
      try {
        const result = await askAI(plantId, question.trim());
        setAnswer(result.answer);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        // Surface the "not running" message clearly
        setError(msg.includes("not running") ? "Ollama is not running. See setup instructions." : msg);
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/40"
          placeholder="Ask anything about this plant — why are the leaves yellowing, should I water today…"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {answer && (
        <div className="rounded-2xl bg-fern/10 p-4 text-sm leading-relaxed text-ink">
          {answer}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Powered by Ollama ({process.env.NEXT_PUBLIC_AI_MODEL ?? "qwen2.5:0.5b"}).
        Pull the model first:{" "}
        <code className="break-all font-mono">docker exec plants-ollama-1 ollama pull qwen2.5:0.5b</code>
      </p>
    </div>
  );
}
