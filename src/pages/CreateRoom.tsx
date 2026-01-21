import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateRoomCode, getInviteLink, getUserId, getUserName, setUserName } from '@/lib/user';
import { UsernameModal } from '@/components/UsernameModal';
import { toast } from 'sonner';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(getUserName());

  // Check if user has a custom name set
  useEffect(() => {
    const storedName = localStorage.getItem('realchat_user_name');
    // Only show modal if user has auto-generated name (starts with "User ")
    if (!storedName || storedName.startsWith('User ')) {
      setShowUsernameModal(true);
    }
  }, []);

  const handleUsernameSubmit = (username: string) => {
    setUserName(username);
    setCurrentUserName(username);
    setShowUsernameModal(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const code = generateRoomCode();
      const userId = getUserId();
      const userName = currentUserName;

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: code,
          created_by: userId
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          room_id: room.id,
          user_id: userId,
          user_name: userName,
          is_online: true
        });

      if (participantError) throw participantError;

      setRoomCode(code);
      toast.success('Room created successfully!');
    } catch (err) {
      console.error('Error creating room:', err);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (type: 'code' | 'link') => {
    if (!roomCode) return;

    const text = type === 'code' ? roomCode : getInviteLink(roomCode);
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success(type === 'code' ? 'Code copied!' : 'Link copied!');
  };

  const handleShare = async () => {
    if (!roomCode) return;

    const shareData = {
      title: 'Join my RealChat room',
      text: `Join me on RealChat! Room code: ${roomCode}`,
      url: getInviteLink(roomCode)
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy('link');
      }
    } catch (err) {
      // User cancelled share
    }
  };

  const handleEnterRoom = () => {
    if (roomCode) {
      navigate(`/chat/${roomCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Username Modal */}
      <UsernameModal
        open={showUsernameModal}
        onSubmit={handleUsernameSubmit}
        currentName={currentUserName}
      />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full h-9 w-9"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Create Room</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!roomCode ? (
          <div className="flex flex-col items-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start a New Room</h2>
            <p className="text-muted-foreground text-center mb-4 max-w-xs">
              Create a chat room and invite others using the room code or link
            </p>
            <p className="text-sm text-primary mb-6">
              Joining as: <span className="font-semibold">{currentUserName}</span>
            </p>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-14 px-8 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm animate-fade-scale">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-1">Room Created!</h2>
              <p className="text-muted-foreground text-sm">Share the code or link to invite others</p>
            </div>

            {/* Room code display */}
            <div className="bg-card rounded-2xl p-6 border border-border mb-6">
              <p className="text-sm text-muted-foreground mb-2">Room Code</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold tracking-widest text-foreground">
                  {roomCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy('code')}
                  className="rounded-full"
                >
                  {copied === 'code' ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleCopy('link')}
                variant="secondary"
                className="w-full h-12 rounded-xl bg-card border border-border hover:bg-muted"
              >
                {copied === 'link' ? (
                  <Check className="w-4 h-4 mr-2 text-primary" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Invite Link
              </Button>

              <Button
                onClick={handleShare}
                variant="secondary"
                className="w-full h-12 rounded-xl bg-card border border-border hover:bg-muted"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              <Button
                onClick={handleEnterRoom}
                className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
              >
                Enter Room
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
