import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoom } from '@/hooks/useRoom';
import { useNotifications } from '@/hooks/useNotifications';
import { getUserId, getUserName, setUserName } from '@/lib/user';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { NewMessageIndicator } from '@/components/chat/NewMessageIndicator';
import { UsernameModal } from '@/components/UsernameModal';
import { toast } from 'sonner';
import { Loader2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatRoom() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(getUserName());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesCount = useRef(0);
  
  const userId = getUserId();
  const { permission, requestPermission, showNotification } = useNotifications();

  // Check if user has a custom name set
  useEffect(() => {
    const storedName = localStorage.getItem('realchat_user_name');
    // Only show modal if user has auto-generated name (starts with "User ")
    if (!storedName || storedName.startsWith('User ')) {
      setShowUsernameModal(true);
    }
  }, []);

  const handleUsernameSubmit = async (username: string) => {
    setUserName(username);
    setCurrentUserName(username);
    setShowUsernameModal(false);
    
    // Update participant name if already in room
    if (roomId) {
      await supabase
        .from('participants')
        .update({ user_name: username })
        .eq('room_id', roomId)
        .eq('user_id', userId);
    }
  };

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
          .maybeSingle();

        if (error || !room) {
          setNotFound(true);
          setInitialLoading(false);
          return;
        }

        const userName = getUserName();

        // Check if user is a participant
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', room.id)
          .eq('user_id', userId)
          .maybeSingle();

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
  }, [code, navigate, userId, roomId]);

  const {
    participants,
    messages,
    typingUsers,
    onlineCount,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    setTypingIndicator
  } = useRoom(roomId);

  // Show notification for new messages from others
  useEffect(() => {
    if (messages.length > previousMessagesCount.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender_id !== userId) {
        showNotification(`${lastMessage.sender_name}`, {
          body: lastMessage.text,
          roomCode: code?.toUpperCase(),
          url: `/chat/${code?.toUpperCase()}`
        });
      }
    }
  }, [messages, userId, code, showNotification]);

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

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      await editMessage(messageId, newText);
      toast.success('Message edited');
    } catch (err) {
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notifications permission denied');
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
      {/* Username Modal */}
      <UsernameModal
        open={showUsernameModal}
        onSubmit={handleUsernameSubmit}
        currentName={currentUserName}
      />

      {/* Header */}
      <ChatHeader
        roomCode={code?.toUpperCase() || ''}
        onlineCount={onlineCount}
        participants={participants}
        onLeave={handleLeave}
      />

      {/* Notification prompt */}
      {permission === 'default' && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Enable notifications for new messages</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEnableNotifications}
            className="h-8 gap-2"
          >
            <Bell className="w-4 h-4" />
            Enable
          </Button>
        </div>
      )}

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
              onEdit={handleEdit}
              onDelete={handleDelete}
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
