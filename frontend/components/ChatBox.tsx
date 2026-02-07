'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useWallet } from '@solana/wallet-adapter-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

interface ChatBoxProps {
  raceId: string;
  className?: string;
}

export default function ChatBox({ raceId, className = '' }: ChatBoxProps) {
  const { connected } = useWallet();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const recentMessages = await chatApi.getRecentMessages(raceId, 50);
        setMessages(recentMessages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('[ChatBox] Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [raceId]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.emit('joinRace', { race_id: raceId });

    newSocket.on('chatMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 100);
    });

    newSocket.on('chatError', (error: { message: string; authError?: boolean; rateLimited?: boolean }) => {
      if (error.authError) {
        toast.error('Please log in to send messages');
      } else if (error.rateLimited) {
        toast.warning(error.message);
      } else {
        toast.error(error.message || 'Failed to send message');
      }
    });

    return () => {
      newSocket.emit('leaveRace', { race_id: raceId });
      newSocket.disconnect();
    };
  }, [raceId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || !socket || isSending) return;

    if (trimmedMessage.length > 500) {
      toast.error('Message too long (max 500 characters)');
      return;
    }

    setIsSending(true);

    try {
      socket.emit('sendChatMessage', {
        race_id: raceId,
        message: trimmedMessage,
      });

      setInputMessage('');

      inputRef.current?.focus();
    } catch (error) {
      console.error('[ChatBox] Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const truncateWallet = (wallet: string | null) => {
    if (!wallet) return 'Anonymous';
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const sanitizeMessage = (msg: string) => {
    const div = document.createElement('div');
    div.textContent = msg;
    return div.innerHTML;
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col bg-dark-800 border-2 border-neon-blue shadow-neon-lg rounded-lg overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-12 w-64' : 'h-96 w-80 sm:w-96'
      } ${className}`}
    >
      <div
        className="flex items-center justify-between px-4 py-2 bg-dark-700 border-b border-neon-blue cursor-pointer hover:bg-dark-600 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
          <h3 className="text-neon-blue font-semibold text-sm uppercase tracking-wider">
            Race Chat
          </h3>
        </div>
        <button
          className="text-neon-blue hover:text-neon-purple transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#00d9ff #1a1a24'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-neon-blue text-sm animate-pulse">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm text-center">
                  No messages yet.<br />Be the first to chat!
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={`${msg.id}-${index}`}
                  className="animate-slide-down bg-dark-700 rounded px-2 py-1.5 border border-dark-600 hover:border-neon-blue transition-colors"
                >
                  <div className="flex items-baseline justify-between text-xs mb-0.5">
                    <span className="font-semibold text-neon-purple">
                      {truncateWallet(msg.user_wallet)}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <div
                    className="text-sm text-gray-200 break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizeMessage(msg.message) }}
                  />
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!connected ? (
            <div className="p-3 bg-dark-700 border-t border-neon-blue">
              <div className="flex items-center justify-center py-3 px-4 bg-dark-800/50 rounded border border-neon-yellow/30">
                <p className="text-neon-yellow text-sm text-center">
                  🔒 Connect your wallet to chat
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2 p-3 bg-dark-700 border-t border-neon-blue"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                disabled={isSending}
                className="flex-1 bg-dark-800 text-white text-sm px-3 py-2 rounded border border-dark-600 focus:border-neon-blue focus:outline-none focus:shadow-neon-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="bg-neon-blue hover:bg-neon-purple text-dark-900 font-semibold px-4 py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neon-blue shadow-neon-sm hover:shadow-neon"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
