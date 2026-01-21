import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { getUserId, getUserName } from '@/lib/user';
import { toast } from 'sonner';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const [roomCode, setRoomCode] = useState(urlCode?.toUpperCase() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      const userName = getUserName();

      // Find room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (roomError || !room) {
        setError('Room not found. Please check the code and try again.');
        setLoading(false);
        return;
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single();

      if (existingParticipant) {
        // Update online status
        await supabase
          .from('participants')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', existingParticipant.id);
      } else {
        // Check participant count (limit to 50 for performance)
        const { count } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);

        if (count && count >= 50) {
          setError('This room is full. Maximum 50 participants allowed.');
          setLoading(false);
          return;
        }

        // Add as participant
        const { error: participantError } = await supabase
          .from('participants')
          .insert({
            room_id: room.id,
            user_id: userId,
            user_name: userName,
            is_online: true
          });

        if (participantError) throw participantError;
      }

      toast.success('Joined room successfully!');
      navigate(`/chat/${roomCode.toUpperCase()}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(value);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
        <h1 className="text-lg font-semibold">Join Room</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-1">Enter Room Code</h2>
            <p className="text-muted-foreground text-sm">
              Get the code from the room creator
            </p>
          </div>

          {/* Room code input */}
          <div className="mb-6">
            <Input
              value={roomCode}
              onChange={handleInputChange}
              placeholder="XXXXXX"
              maxLength={6}
              className="h-16 text-center text-2xl font-bold tracking-widest uppercase
                         bg-card border-border rounded-xl
                         focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-destructive text-center animate-fade-scale">
                {error}
              </p>
            )}
          </div>

          {/* Join button */}
          <Button
            onClick={handleJoin}
            disabled={loading || roomCode.length < 6}
            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </div>
    </div>
  );
}
