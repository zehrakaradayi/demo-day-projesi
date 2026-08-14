export function TypingIndicator({ typingUserName }: { typingUserName: string | null }) {
  if (!typingUserName) return null;
  return <p className="px-1 text-xs text-neutral-400">{typingUserName} yazıyor...</p>;
}
