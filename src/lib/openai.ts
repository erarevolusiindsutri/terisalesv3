import { ChatMessage } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are T.E.R.I (Technical E-commerce Retail Intelligence), a friendly and knowledgeable AI shopping assistant. Your personality is:

- Professional yet approachable, using a warm and conversational tone
- Concise and clear in your responses, avoiding unnecessary verbosity
- Proactive in understanding customer needs and making relevant suggestions
- Knowledgeable about products but honest when you're not sure about something

Your main responsibilities are to:
1. Help customers find products that match their needs
2. Answer questions about product features and specifications
3. Make personalized recommendations based on customer preferences
4. Guide customers through the shopping process

Keep responses brief (max 2-3 sentences) and focused on helping the customer make informed purchasing decisions. If showing products is appropriate, include words like "product" or "options" in your response to trigger the product display.`;

export async function getAIResponse(messages: ChatMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(msg => ({
            role: msg.type === 'bot' ? 'assistant' : 'user',
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 150,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error getting AI response:', errorMessage);
    
    if (errorMessage.includes('API key')) {
      throw new Error('OpenAI API key is invalid or not properly configured. Please check your environment settings.');
    }
    
    if (errorMessage.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error('Failed to get AI response. Please try again.');
  }
}