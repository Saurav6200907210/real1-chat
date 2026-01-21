import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoom } from '@/hooks/useRoom';
import { getUserId, getUserName } from '@/lib/user';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { NewMessageIndicator } from '@/components/chat/NewMessageIndicator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ChatRoom() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesCount = useRef(0);
  
  const userId = getUserId();
  const userName = getUserName();

  // Fetch room on mount
  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    const fetchRoom = async () => {
      try {
        const { data: room, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', code.toUpperCase())
          .single();

        if (error || !room) {
          setNotFound(true);
          setInitialLoading(false);
          return;
        }

        // Check if user is a participant
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', room.id)
          .eq('user_id', userId)
          .single();

        if (!participant) {
          // Auto-join the room
          await supabase
            .from('participants')
            .insert({
              room_id: room.id,
              user_id: userId,
              user_name: userName,
              is_online: true
            });
        } else {
          // Update online status
          await supabase
            .from('participants')
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq('id', participant.id);
        }

        setRoomId(room.id);
        setInitialLoading(false);
      } catch (err) {
        console.error('Error fetching room:', err);
        setNotFound(true);
        setInitialLoading(false);
      }
    };

    fetchRoom();

    // Cleanup: set offline on unmount
    return () => {
      if (roomId) {
        supabase
          .from('participants')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('user_id', userId)
          .then(() => {});
      }
    };
  }, [code, navigate, userId, userName, roomId]);

  const {
    participants,
    messages,
    typingUsers,
    onlineCount,
    loading,
    error,
    sendMessage,
    toggleReaction,
    setTypingIndicator
  } = useRoom(roomId);

  // Handle scroll detection
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    
    if (atBottom) {
      setNewMessagesCount(0);
    }
  }, []);

  // Auto-scroll to bottom on new messages if at bottom
  useEffect(() => {
    if (messages.length > previousMessagesCount.current) {
      const newCount = messages.length - previousMessagesCount.current;
      
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Check if the new message is from the current user
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.sender_id === userId) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
          setNewMessagesCount(prev => prev + newCount);
        }
      }
    }
    previousMessagesCount.current = messages.length;
  }, [messages, isAtBottom, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesCount(0);
  };

  const handleLeave = async () => {
    if (roomId) {
      await supabase
        .from('participants')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId);
    }
    toast.info('You left the room');
    navigate('/');
  };

  const handleSend = async (text: string) => {
    try {
      await sendMessage(text);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Room not found
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <h2 className="text-xl font-semibold mb-2">Room Not Found</h2>
        <p className="text-muted-foreground mb-6">The room code may be incorrect or expired.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <ChatHeader
        roomCode={code?.toUpperCase() || ''}
        onlineCount={onlineCount}
        participants={participants}
        onLeave={handleLeave}
      />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar relative"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-1">No messages yet</p>
            <p className="text-sm text-muted-foreground/70">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === userId}
              onReact={toggleReaction}
              userId={userId}
              isNew={index >= previousMessagesCount.current - 1}
            />
          ))
        )}
        
        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} />
        
        <div ref={messagesEndRef} />
        
        {/* New messages indicator */}
        <NewMessageIndicator count={newMessagesCount} onClick={scrollToBottom} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        onTyping={setTypingIndicator}
        disabled={loading || !!error}
      />
    </div>
  );
}
