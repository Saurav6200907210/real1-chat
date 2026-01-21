import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewMessageIndicatorProps {
  count: number;
  onClick: () => void;
}

export function NewMessageIndicator({ count, onClick }: NewMessageIndicatorProps) {
  if (count === 0) return null;

  return (
    <Button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 
                 bg-primary text-primary-foreground shadow-lg animate-slide-up
                 flex items-center gap-2"
    >
      <ChevronDown className="w-4 h-4" />
      <span className="text-sm font-medium">
        {count} new message{count > 1 ? 's' : ''}
      </span>
    </Button>
  );
}
