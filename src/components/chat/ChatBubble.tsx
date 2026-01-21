import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ReactionPicker } from './ReactionPicker';

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

interface ChatBubbleProps {
  message: {
    id: string;
    sender_id: string;
    sender_name: string;
    text: string;
    created_at: string;
    reactions: Reaction[];
  };
  isOwn: boolean;
  onReact: (messageId: string, reactionType: string) => void;
  userId: string;
  isNew?: boolean;
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

export function ChatBubble({ message, isOwn, onReact, userId, isNew }: ChatBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group reactions by type
  const reactionCounts = message.reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = message.reactions
    .filter(r => r.user_id === userId)
    .map(r => r.reaction_type);

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%] animate-message-in',
        isOwn ? 'self-end items-end' : 'self-start items-start',
        isNew && 'animate-new-message'
      )}
    >
      {/* Sender name for received messages */}
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-3">
          {message.sender_name}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'relative px-4 py-2.5 rounded-2xl transition-all duration-200',
          isOwn
            ? 'bg-chat-sender text-chat-sender-foreground rounded-br-md'
            : 'bg-chat-receiver text-chat-receiver-foreground rounded-bl-md'
        )}
        onClick={() => setShowReactions(!showReactions)}
      >
        <p className="text-sm leading-relaxed break-words">{message.text}</p>
        
        {/* Timestamp */}
        <span className={cn(
          'text-[10px] mt-1 block',
          isOwn ? 'text-chat-sender-foreground/70' : 'text-chat-receiver-foreground/70'
        )}>
          {formatTime(message.created_at)}
        </span>
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <ReactionPicker
          onSelect={(emoji) => {
            onReact(message.id, emoji);
            setShowReactions(false);
          }}
          onClose={() => setShowReactions(false)}
          isOwn={isOwn}
        />
      )}

      {/* Reactions display */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className={cn(
          'flex flex-wrap gap-1 mt-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          {REACTION_EMOJIS.filter(emoji => reactionCounts[emoji]).map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all',
                'bg-muted hover:bg-muted/80',
                userReactions.includes(emoji) && 'ring-1 ring-primary'
              )}
            >
              <span className="animate-reaction-pop">{emoji}</span>
              <span className="text-muted-foreground">{reactionCounts[emoji]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
