import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UsernameModalProps {
  open: boolean;
  onSubmit: (username: string) => void;
  currentName: string;
}

export function UsernameModal({ open, onSubmit, currentName }: UsernameModalProps) {
  const [username, setUsername] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a display name');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }
    
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Choose Your Display Name
          </DialogTitle>
          <DialogDescription>
            This name will be visible to other users in the chat room
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="Enter your name"
              maxLength={20}
              className="h-12 text-base bg-card border-border rounded-xl"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
          >
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
