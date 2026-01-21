import { cn } from '@/lib/utils';

const REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOwn: boolean;
}

export function ReactionPicker({ onSelect, onClose, isOwn }: ReactionPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Picker */}
      <div className={cn(
        'flex gap-1 p-2 rounded-full bg-card border border-border shadow-lg z-50 mt-1',
        'animate-fade-scale',
        isOwn ? 'mr-2' : 'ml-2'
      )}>
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-lg rounded-full 
                       hover:bg-muted active:scale-90 transition-all duration-150"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
