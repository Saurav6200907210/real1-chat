import { useState } from 'react';
import { ArrowLeft, Users, Copy, Check, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  is_online: boolean;
}

interface ChatHeaderProps {
  roomCode: string;
  onlineCount: number;
  participants: Participant[];
  onLeave: () => void;
}

export function ChatHeader({ roomCode, onlineCount, participants, onLeave }: ChatHeaderProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border safe-area-top">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full h-9 w-9"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col">
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
          >
            {roomCode}
            {copied ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-online animate-pulse-gentle" />
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Participants sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Users className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">
                Participants ({participants.length})
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {participant.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-muted',
                      participant.is_online ? 'bg-online' : 'bg-secondary'
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{participant.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Leave button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          className="rounded-full h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
