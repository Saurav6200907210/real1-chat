import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, LogIn, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserName, setUserName } from '@/lib/user';
import { useState } from 'react';
import { UsernameModal } from '@/components/UsernameModal';

export default function Home() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(getUserName());

  const handleUsernameSubmit = (username: string) => {
    setUserName(username);
    setCurrentUserName(username);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Username Settings Modal */}
      <UsernameModal
        open={showSettings}
        onSubmit={handleUsernameSubmit}
        currentName={currentUserName}
      />

      {/* Logo and title */}
      <div className="flex flex-col items-center mb-12 animate-slide-up">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
          <MessageCircle className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">RealChat</h1>
        <p className="text-muted-foreground text-center">
          Real-time messaging, no signup required
        </p>
      </div>

      {/* Current user display */}
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-muted/50 hover:bg-muted transition-colors"
      >
        <span className="text-sm text-muted-foreground">Chatting as:</span>
        <span className="text-sm font-semibold text-foreground">{currentUserName}</span>
        <Settings className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-4">
        <Button
          onClick={() => navigate('/create')}
          className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90
                     flex items-center justify-center gap-3 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Room
        </Button>

        <Button
          onClick={() => navigate('/join')}
          variant="secondary"
          className="w-full h-14 rounded-xl text-base font-semibold
                     flex items-center justify-center gap-3 border border-border
                     bg-card hover:bg-muted"
        >
          <LogIn className="w-5 h-5" />
          Join Room
        </Button>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        No account needed • Start chatting instantly
      </p>
    </div>
  );
}
