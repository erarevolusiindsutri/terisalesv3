import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { getAIResponse } from '../lib/openai';
import { config } from '../config/env';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChatContainer() {
  const [messages, setMessages] = React.useState<ChatMessageType[]>([
    {
      type: 'bot',
      content: config.openai.isConfigured 
        ? "Hi! I'm T.E.R.I, your AI assistant. How can I help you today?"
        : "Hi! I'm T.E.R.I, but I'm not properly configured yet. Please set up the OpenAI API key to enable my full capabilities.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [showInput, setShowInput] = React.useState(false);
  const [messageKey, setMessageKey] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTypingComplete = React.useCallback(() => {
    setIsTyping(false);
    setShowInput(true);
    scrollToBottom();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setShowInput(false);
    setIsTyping(true);
    setIsError(false);
    setMessageKey(prev => prev + 1);

    const newMessages: ChatMessageType[] = [
      { type: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    try {
      if (!config.openai.isConfigured) {
        throw new Error('OpenAI API key is not configured');
      }

      const aiResponse = await getAIResponse(newMessages);
      
      if (aiResponse) {
        setMessages([
          { type: 'bot', content: aiResponse }
        ]);
      }
    } catch (error) {
      setIsError(true);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessages([
        { type: 'bot', content: errorMessage }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="min-h-full flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-2xl px-4 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {messages.map((message, index) => (
                  <div key={`${messageKey}-${index}`} className="space-y-4">
                    <ChatMessage
                      {...message}
                      onComplete={
                        index === messages.length - 1 && message.type === 'bot'
                          ? handleTypingComplete
                          : undefined
                      }
                      isError={message.type === 'bot' && index === messages.length - 1 && isError}
                      startDelay={index === 0 && messageKey === 0 ? 1000 : 0}
                    />
                    {index === messages.length - 1 && showInput && !isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChatInput
                          value={input}
                          onChange={setInput}
                          onSubmit={handleSend}
                          disabled={!config.openai.isConfigured}
                          placeholder="Type here..."
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}