-- AI Assistant Database Schema
-- Stores chat conversations and messages for the AI accounting assistant

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  context_type TEXT, -- 'general', 'report', 'transaction', etc.
  context_data JSONB, -- Related report data, transaction IDs, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB, -- Store additional data like report references, calculations, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Insights Table - Store AI-generated insights about user's financial data
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'expense_trend', 'cash_flow_alert', 'profitability_insight', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- Supporting calculations and data
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive insights
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage their own conversations"
  ON public.ai_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_messages  
CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert insights"
  ON public.ai_insights
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

CREATE POLICY "Users can update their own insights"
  ON public.ai_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_read ON public.ai_insights(is_read);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();

-- Function to create a new conversation
CREATE OR REPLACE FUNCTION public.create_ai_conversation(
  p_user_id UUID,
  p_title TEXT DEFAULT 'New Conversation',
  p_context_type TEXT DEFAULT NULL,
  p_context_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  INSERT INTO public.ai_conversations (user_id, title, context_type, context_data)
  VALUES (p_user_id, p_title, p_context_type, p_context_data)
  RETURNING id INTO conversation_id;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add message to conversation
CREATE OR REPLACE FUNCTION public.add_ai_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Verify user owns the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE id = p_conversation_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  
  INSERT INTO public.ai_messages (conversation_id, role, content, metadata)
  VALUES (p_conversation_id, p_role, p_content, p_metadata)
  RETURNING id INTO message_id;
  
  -- Update conversation timestamp
  UPDATE public.ai_conversations 
  SET updated_at = NOW() 
  WHERE id = p_conversation_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation with recent messages
CREATE OR REPLACE FUNCTION public.get_conversation_with_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  conversation_context_type TEXT,
  conversation_context_data JSONB,
  message_id UUID,
  message_role TEXT,
  message_content TEXT,
  message_metadata JSONB,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.context_type,
    c.context_data,
    m.id,
    m.role,
    m.content,
    m.metadata,
    m.created_at
  FROM public.ai_conversations c
  LEFT JOIN public.ai_messages m ON c.id = m.conversation_id
  WHERE c.id = p_conversation_id 
    AND c.user_id = auth.uid()
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old insights
CREATE OR REPLACE FUNCTION public.cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_insights 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;