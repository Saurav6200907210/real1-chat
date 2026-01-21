import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditMessageInputProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function EditMessageInput({ initialText, onSave, onCancel }: EditMessageInputProps) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && text.trim() !== initialText) {
      onSave(text.trim());
    } else if (text.trim() === initialText) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 h-8 text-sm bg-background/50 border-primary/30 rounded-lg"
        placeholder="Edit message..."
      />
      <div className="flex gap-1">
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full text-primary hover:bg-primary/20"
          disabled={!text.trim()}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
