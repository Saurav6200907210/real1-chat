import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserId, getUserName } from '@/lib/user';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  is_online: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
  reactions: Reaction[];
  is_edited: boolean;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
}

export function useRoom(roomId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userId = getUserId();
  const userName = getUserName();

  // Fetch initial data
  useEffect(() => {
    if (!roomId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', roomId);

        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
        setOnlineCount(participantsData?.filter(p => p.is_online).length || 0);

        // Fetch messages with reactions
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch reactions for all messages
        const messageIds = messagesData?.map(m => m.id) || [];
        let reactionsData: Reaction[] = [];
        
        if (messageIds.length > 0) {
          const { data: reactions, error: reactionsError } = await supabase
            .from('reactions')
            .select('*')
            .in('message_id', messageIds);

          if (reactionsError) throw reactionsError;
          reactionsData = reactions || [];
        }

        // Combine messages with their reactions
        const messagesWithReactions = (messagesData || []).map(msg => ({
          ...msg,
          is_edited: msg.is_edited ?? false,
          reactions: reactionsData.filter(r => r.message_id === msg.id)
        }));

        setMessages(messagesWithReactions);
        setError(null);
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load room data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMessage = { ...payload.new as Message, reactions: [], is_edited: false };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id
              ? { ...msg, text: updatedMessage.text, is_edited: updatedMessage.is_edited }
              : msg
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const deletedMessage = payload.old as { id: string };
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReaction = payload.new as Reaction;
            setMessages(prev => prev.map(msg => 
              msg.id === newReaction.message_id
                ? { ...msg, reactions: [...msg.reactions, newReaction] }
                : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedReaction = payload.old as Reaction;
            setMessages(prev => prev.map(msg => 
              msg.id === deletedReaction.message_id
                ? { ...msg, reactions: msg.reactions.filter(r => r.id !== deletedReaction.id) }
                : msg
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new as Participant]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants(prev => prev.map(p => 
              p.id === (payload.new as Participant).id ? payload.new as Participant : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev => prev.filter(p => p.id !== (payload.old as Participant).id));
          }
          // Update online count
          setParticipants(current => {
            setOnlineCount(current.filter(p => p.is_online).length);
            return current;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Presence channel for typing indicators
    const presenceChannel = supabase.channel(`presence-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typingUsersList: string[] = [];
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.isTyping && presence.userId !== userId) {
              typingUsersList.push(presence.userName);
            }
          });
        });
        
        setTypingUsers(typingUsersList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            userId,
            userName,
            isTyping: false
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [roomId, userId, userName]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!roomId || !text.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: userId,
          sender_name: userName,
          text: text.trim()
        });

      if (error) throw error;
      
      // Stop typing indicator
      setTypingIndicator(false);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [roomId, userId, userName]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!roomId || !newText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ text: newText.trim(), is_edited: true })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error editing message:', err);
      throw err;
    }
  }, [roomId, userId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!roomId) return;

    try {
      // First delete associated reactions
      await supabase
        .from('reactions')
        .delete()
        .eq('message_id', messageId);

      // Then delete the message
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [roomId, userId]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, reactionType: string) => {
    if (!roomId) return;

    try {
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            room_id: roomId,
            user_id: userId,
            reaction_type: reactionType
          });
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  }, [roomId, userId]);

  // Set typing indicator
  const setTypingIndicator = useCallback(async (typing: boolean) => {
    if (!presenceChannelRef.current) return;
    
    setIsTyping(typing);
    
    await presenceChannelRef.current.track({
      online_at: new Date().toISOString(),
      userId,
      userName,
      isTyping: typing
    });

    // Auto-clear typing after 3 seconds
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(false);
      }, 3000);
    }
  }, [userId, userName]);

  return {
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
    setTypingIndicator,
    userId
  };
}
