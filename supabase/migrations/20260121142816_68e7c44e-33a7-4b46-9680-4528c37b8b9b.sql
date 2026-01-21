-- Add is_edited column to messages table
ALTER TABLE public.messages ADD COLUMN is_edited boolean NOT NULL DEFAULT false;

-- Enable UPDATE and DELETE events for realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.messages, public.reactions, public.participants, public.rooms;