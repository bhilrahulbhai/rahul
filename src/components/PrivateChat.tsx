import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { io } from 'socket.io-client';

interface PrivateMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  created_at: string;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string;
}

interface PrivateChatProps {
  currentUser: any;
  targetUser: any;
  onClose: () => void;
}

export const PrivateChat: React.FC<PrivateChatProps> = ({ currentUser, targetUser, onClose }) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/private/${targetUser.id}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch private messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    socketRef.current = io();
    const channel = `private-message-${currentUser.id}-${targetUser.id}`;
    socketRef.current.on(channel, (msg: PrivateMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser.id, targetUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current?.emit('send-private-message', {
      senderId: currentUser.id,
      receiverId: targetUser.id,
      text: newMessage.trim()
    });

    setNewMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-full max-w-[350px] h-[500px] bg-bhakti-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100]"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bhakti-accent/20 flex items-center justify-center overflow-hidden">
            {targetUser.avatar ? (
              <img src={targetUser.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-bhakti-accent" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{targetUser.name}</p>
            <p className="text-[10px] text-gray-400">@{targetUser.username}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-bhakti-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Send className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-400">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.sender_id === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.sender_id === currentUser.id
                    ? "bg-bhakti-accent text-white rounded-tr-none"
                    : "bg-white/5 text-gray-200 rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
              <span className="text-[8px] text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/5">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/20 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-bhakti-accent transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-bhakti-accent text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
