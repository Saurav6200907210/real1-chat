interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const displayText = users.length === 1 
    ? `${users[0]} is typing`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-slide-up">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-typing animate-typing-dot" />
        <span className="w-2 h-2 rounded-full bg-typing animate-typing-dot-delay-1" />
        <span className="w-2 h-2 rounded-full bg-typing animate-typing-dot-delay-2" />
      </div>
      <span className="text-xs text-muted-foreground">{displayText}...</span>
    </div>
  );
}
