import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ReactionPicker } from './ReactionPicker';
import { MessageActions } from './MessageActions';
import { EditMessageInput } from './EditMessageInput';

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
    is_edited?: boolean;
  };
  isOwn: boolean;
  onReact: (messageId: string, reactionType: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  userId: string;
  isNew?: boolean;
}

const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

export function ChatBubble({ message, isOwn, onReact, onEdit, onDelete, userId, isNew }: ChatBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleEdit = () => {
    setIsEditing(true);
    setShowReactions(false);
  };

  const handleSaveEdit = (newText: string) => {
    if (onEdit) {
      onEdit(message.id, newText);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%] animate-message-in group',
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

      {/* Message bubble with actions */}
      <div className={cn(
        'flex items-center gap-1',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}>
        <div
          className={cn(
            'relative px-4 py-2.5 rounded-2xl transition-all duration-200',
            isOwn
              ? 'bg-chat-sender text-chat-sender-foreground rounded-br-md'
              : 'bg-chat-receiver text-chat-receiver-foreground rounded-bl-md'
          )}
          onClick={() => !isEditing && setShowReactions(!showReactions)}
        >
          {isEditing ? (
            <EditMessageInput
              initialText={message.text}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <p className="text-sm leading-relaxed break-words">{message.text}</p>
              
              {/* Timestamp and edited indicator */}
              <span className={cn(
                'text-[10px] mt-1 block',
                isOwn ? 'text-chat-sender-foreground/70' : 'text-chat-receiver-foreground/70'
              )}>
                {formatTime(message.created_at)}
                {message.is_edited && ' • edited'}
              </span>
            </>
          )}
        </div>

        {/* Actions for own messages */}
        {isOwn && !isEditing && (
          <MessageActions onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      {/* Reaction picker */}
      {showReactions && !isEditing && (
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
