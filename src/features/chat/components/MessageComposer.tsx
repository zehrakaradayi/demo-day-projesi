"use client";

import { useRef, useState, type FormEvent } from "react";

type Props = {
  onSend: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
};

export function MessageComposer({ onSend, onTypingChange, disabled }: Props) {
  const [value, setValue] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);
    onTypingChange(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 2000);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    onTypingChange(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3"
    >
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Mesaj yaz..."
        disabled={disabled}
        className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-violet-500"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Gönder
      </button>
    </form>
  );
}
