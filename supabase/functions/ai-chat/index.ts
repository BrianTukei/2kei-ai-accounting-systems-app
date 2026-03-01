import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationId?: string;
  contextType?: string;
  contextData?: any;
}

interface AIResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { authorization } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { message, conversationId, contextType, contextData }: ChatRequest = await req.json();

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    // Rate limiting check (simple implementation)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const { count: recentMessages } = await supabaseAdmin
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', 
        supabaseAdmin
          .from('ai_conversations')
          .select('id')
          .eq('user_id', user.id)
      )
      .gte('created_at', oneHourAgo.toISOString());

    if ((recentMessages || 0) > 100) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    let currentConversationId = conversationId;

    // Create new conversation if needed
    if (!currentConversationId) {
      const { data: newConversation, error: conversationError } = await supabaseAdmin
        .rpc('create_ai_conversation', {
          p_user_id: user.id,
          p_title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          p_context_type: contextType,
          p_context_data: contextData
        });

      if (conversationError) {
        throw conversationError;
      }

      currentConversationId = newConversation;
    }

    // Add user message to conversation
    await supabaseAdmin.rpc('add_ai_message', {
      p_conversation_id: currentConversationId,
      p_role: 'user',
      p_content: message
    });

    // Get conversation context and recent messages for AI
    const { data: conversationData } = await supabaseAdmin
      .rpc('get_conversation_with_messages', {
        p_conversation_id: currentConversationId,
        p_limit: 20
      });

    // Build conversation history for AI
    const conversationHistory = conversationData?.map((msg: any) => ({
      role: msg.message_role,
      content: msg.message_content
    })).filter((msg: any) => msg.role && msg.content) || [];

    // Prepare system prompt
    const systemPrompt = buildSystemPrompt(contextType, contextData);
    
    // Generate AI response with better error handling
    let aiResponse: string;
    try {
      aiResponse = await generateAIResponse(systemPrompt, conversationHistory, message);
    } catch (error) {
      console.error('AI response generation failed:', error);
      aiResponse = generateRuleBasedResponse(message);
    }

    // Add AI response to conversation
    await supabaseAdmin.rpc('add_ai_message', {
      p_conversation_id: currentConversationId,
      p_role: 'assistant',
      p_content: aiResponse
    });

    const response: AIResponse = {
      success: true,
      response: aiResponse,
      conversationId: currentConversationId
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    const errorResponse: AIResponse = {
      success: false,
      error: error.message
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function buildSystemPrompt(contextType?: string, contextData?: any): string {
  let basePrompt = `You are an AI Accounting Assistant integrated into 2K AI Accounting Systems. 

Your responsibilities:
- Help users understand financial reports (Balance Sheet, Income Statement, Cash Flow, Trial Balance)
- Explain accounting principles and concepts
- Assist with expense categorization and bookkeeping
- Provide guidance on payroll and tax matters
- Analyze financial trends and provide insights
- Offer recommendations for improving financial health

IMPORTANT RESTRICTIONS:
- Only respond to accounting, finance, and bookkeeping related questions
- If asked about unrelated topics, politely respond: "I am your Accounting Assistant and only handle accounting and finance related questions."
- Provide practical, actionable advice
- Always maintain professional, helpful tone
- Refer to specific financial data when available

Current context: `;

  if (contextType === 'report' && contextData) {
    basePrompt += `The user is viewing a ${contextData.reportType || 'financial'} report. `;
    if (contextData.reportData) {
      basePrompt += `Report data: ${JSON.stringify(contextData.reportData).substring(0, 1000)}`;
    }
  } else if (contextType === 'transaction' && contextData) {
    basePrompt += `The user is working with transaction data. `;
  } else if (contextType === 'dashboard' && contextData) {
    basePrompt += `The user is on the dashboard viewing financial overview. `;
  } else {
    basePrompt += `General accounting conversation.`;
  }

  return basePrompt;
}

async function generateAIResponse(systemPrompt: string, conversationHistory: any[], userMessage: string): Promise<string> {
  // Check if question is accounting-related
  const nonAccountingKeywords = [
    'weather', 'sports', 'movies', 'music', 'cooking', 'travel', 'games', 'politics',
    'celebrity', 'entertainment', 'social media', 'dating', 'health', 'medicine'
  ];
  
  const messageWords = userMessage.toLowerCase().split(' ');
  const isNonAccounting = nonAccountingKeywords.some(keyword => 
    messageWords.includes(keyword) || userMessage.toLowerCase().includes(keyword)
  );

  // Simple keyword check for obvious non-accounting questions
  if (isNonAccounting && !messageWords.some(word => 
    ['account', 'finance', 'money', 'budget', 'cost', 'profit', 'expense', 'income', 'tax'].includes(word)
  )) {
    return "I am your Accounting Assistant and only handle accounting and finance related questions. How can I help you with your accounting needs today?";
  }

  try {
    // Use OpenAI API or any other AI service
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      // Fallback to rule-based responses when no API key
      console.log('No OpenAI API key found, using rule-based responses');
      return generateRuleBasedResponse(userMessage);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return generateRuleBasedResponse(userMessage);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      console.log('No AI content received, falling back to rule-based response');
      return generateRuleBasedResponse(userMessage);
    }
    
    return aiContent;

  } catch (error) {
    console.error('AI generation error:', error);
    return generateRuleBasedResponse(userMessage);
  }
}

function generateRuleBasedResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Balance sheet questions
  if (message.includes('balance sheet')) {
    return "A Balance Sheet shows your company's financial position at a specific point in time. It displays Assets = Liabilities + Equity. Assets include cash, accounts receivable, and inventory. Liabilities include accounts payable and loans. Equity represents the owner's stake in the business. Would you like me to explain any specific section?";
  }
  
  // Income statement questions
  if (message.includes('income statement') || message.includes('profit') || message.includes('loss')) {
    return "An Income Statement shows your revenue and expenses over a period, revealing your net profit or loss. It starts with Revenue, subtracts Cost of Goods Sold to get Gross Profit, then subtracts Operating Expenses to get Net Income. This helps you understand your business's profitability. What aspect would you like to explore?";
  }
  
  // Cash flow questions
  if (message.includes('cash flow')) {
    return "Cash Flow tracking shows how money moves in and out of your business. Positive cash flow means more money coming in than going out. Monitor your operating activities (day-to-day operations), investing activities (equipment purchases), and financing activities (loans, investments). Good cash flow management is crucial for business survival.";
  }
  
  // Expense questions
  if (message.includes('expense') || message.includes('cost')) {
    return "Expenses should be categorized properly for tax and reporting purposes. Common categories include: Office Supplies, Marketing, Travel, Utilities, Professional Services, and Equipment. Keep receipts and track business vs personal expenses separately. Proper categorization helps with tax deductions and financial analysis.";
  }
  
  // Tax questions
  if (message.includes('tax')) {
    return "For tax purposes, maintain accurate records of all income and deductible expenses. Common business deductions include office expenses, professional services, marketing costs, and business travel. Consider quarterly tax payments if you expect to owe more than $1,000. Consult with a tax professional for specific advice based on your business structure.";
  }

  // Default accounting response
  return "I'm here to help with your accounting questions! I can assist with financial statements, expense tracking, bookkeeping, payroll, and tax guidance. What specific accounting topic would you like to discuss?";
}