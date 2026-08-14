"use client";

import { useState, useTransition } from "react";
import type { ConversationStarter } from "@/lib/ai/schemas";
import { getConversationStarterSuggestion } from "../actions";

type Props = {
  conversationId: string;
  onSend: (content: string) => void;
};

// AI önerisini üretir ve kullanıcıya gösterir; kullanıcı "Gönder" demeden
// hiçbir şey otomatik gönderilmez.
export function ConversationStarterCard({ conversationId, onSend }: Props) {
  const [suggestion, setSuggestion] = useState<ConversationStarter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await getConversationStarterSuggestion(conversationId);
        setSuggestion(result);
      } catch {
        setError("Öneri üretilemedi. GEMINI_API_KEY tanımlı mı kontrol edin.");
      }
    });
  }

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-4">
      <p className="text-sm font-medium text-violet-700">AI Conversation Starter</p>

      {!suggestion && !error && (
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="mt-2 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Üretiliyor..." : "Bir mesaj öner"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {suggestion && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-neutral-800">{suggestion.message}</p>
          {suggestion.basedOn.length > 0 && (
            <ul className="list-inside list-disc text-xs text-neutral-500">
              {suggestion.basedOn.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSend(suggestion.message);
                setDismissed(true);
              }}
              className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white"
            >
              Gönder
            </button>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm disabled:opacity-50"
            >
              Farklı öneri
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="mt-2 block text-xs text-neutral-400 underline"
      >
        Kapat
      </button>
    </div>
  );
}
