import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Bot, User, ArrowLeftCircle, ArrowRightCircle, SendIcon } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: Date;
  followUpQuestions?: string[];
}

interface ChatWindowProps {
  mode: "trend" | "headline";
  context: { title: string; [key: string]: any };
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
  canProceedToNextTopic?: boolean;
  onNextTopic?: () => void;
  onPreviousTopic?: () => void;
  isLastTopic?: boolean;
}

export default function ChatWindow({
  mode,
  context,
  onSendMessage,
  messages,
  isLoading,
  canProceedToNextTopic,
  onNextTopic,
  onPreviousTopic,
  isLastTopic
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [showFollowUpQuestions, setShowFollowUpQuestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show follow-up questions after 3 seconds for system messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'system' && lastMessage.followUpQuestions) {
        const timer = setTimeout(() => {
          setShowFollowUpQuestions(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      await onSendMessage(inputValue.trim());
      setInputValue('');
      setShowFollowUpQuestions(false);
    }
  };

  const handleFollowUpQuestion = async (question: string) => {
    await onSendMessage(question);
    setShowFollowUpQuestions(false);
  };

  return (
    <div className="space-y-6">
      {/* Chat Messages */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end space-x-2 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-[var(--accent)]' 
                  : 'bg-[var(--surface-alt)]'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-[var(--text)]" />
                )}
              </div>
              
              <div className={`px-4 py-2 rounded-lg max-w-full ${
                message.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-alt)] text-[var(--text)]'
              }`}>
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                  <div className="text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({node, ...props}) => <strong className="text-[var(--accent)] font-semibold" {...props} />,
                        em: ({node, ...props}) => <em className="text-[var(--text-secondary)]" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--accent)] pl-4 italic text-[var(--text)] my-2" {...props} />,
                        code: ({node, ...props}) => <code className="bg-[var(--accent)] px-1 rounded text-[var(--accent)]" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Follow-up Questions */}
        {(() => {
          const lastMessage = messages[messages.length - 1];
          const systemMessageCount = messages.filter(m => m.role === 'system').length;
          return systemMessageCount >= 2 && 
                 lastMessage && 
                 lastMessage.role === 'system' && 
                 lastMessage.followUpQuestions && 
                 lastMessage.followUpQuestions.length > 0 && 
                 showFollowUpQuestions ? (
            <div className="flex justify-start">
              <div className="w-full max-w-3xl">
                <p className="text-xs text-[var(--text-secondary)] mb-3">继续讨论：</p>
                <div className="flex flex-wrap gap-2">
                  {lastMessage.followUpQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3 text-xs border-[var(--border)] hover:bg-[var(--surface)] max-w-full"
                      onClick={() => handleFollowUpQuestion(question)}
                      disabled={isLoading}
                    >
                      <span className="break-words text-left">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start items-end space-x-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="w-full max-w-3xl px-4 py-2 rounded-lg bg-[var(--surface-alt)] text-[var(--text)]">
              <p className="text-sm max-w-xs">思考中...</p>
            </div>
          </div>
        )}

        {/* Topic Navigation Buttons */}
        {canProceedToNextTopic && (
          <div className="flex justify-center space-x-4">
            {/* Previous Topic Button - Show if not first topic */}
            {onPreviousTopic && (
              <Button
                onClick={onPreviousTopic}
                variant="outline"
                className="px-6"
              >
                <ArrowLeftCircle className="w-4 h-4 mr-2" />
                上一话题
              </Button>
            )}
            
            {/* Next Topic Button */}
            {onNextTopic && (
              <Button
                onClick={onNextTopic}
                variant="outline"
                className="px-6"
              >
                <ArrowRightCircle className="w-4 h-4 mr-2" />
                {isLastTopic ? "结束对话" : "下一话题"}
              </Button>
            )}
          </div>
        )}
        
        {/* Scroll reference for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Floating at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入您的问题..."
              className="flex-1 border-0 shadow-none bg-transparent focus:ring-0 focus:border-0"
              onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
              disabled={!inputValue.trim() || isLoading}
            >
              <SendIcon className="w-4 h-4" />
              
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
