import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Send, 
  User, 
  MessageSquare, 
  X, 
  Play, 
  Film, 
  ImageIcon, 
  FileText, 
  BookOpen,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_username?: string;
  sender_avatar?: string;
  text?: string;
  content_id?: number;
  content_title?: string;
  content_thumbnail?: string;
  content_type?: string;
  created_at: string;
}

interface ChatRoomProps {
  user: any;
  onClose?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ user, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('chat-init', (initialMessages: Message[]) => {
      setMessages(initialMessages);
    });

    socketRef.current.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !user) return;

    socketRef.current?.emit('send-message', {
      senderId: user.id,
      senderName: user.name,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      text: input.trim()
    });
    setInput('');
  };

  const renderContentPreview = (msg: Message) => {
    if (!msg.content_id) return null;

    const Icon = msg.content_type === 'video' ? Play :
                 msg.content_type === 'reel' ? Film :
                 msg.content_type === 'photo' ? ImageIcon :
                 msg.content_type === 'story' ? FileText : BookOpen;

    return (
      <div className="mt-2 bg-black/20 rounded-xl overflow-hidden border border-white/10 group cursor-pointer">
        <div className="aspect-video relative">
          <img 
            src={msg.content_thumbnail} 
            alt={msg.content_title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-8 h-8 rounded-full bg-bhakti-accent flex items-center justify-center">
              <Icon className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-bold line-clamp-1">{msg.content_title}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{msg.content_type}</p>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold">Sign in to Chat</h3>
        <p className="text-gray-400 text-sm">Join the spiritual community and share divine moments.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bhakti-card/50 rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bhakti-accent/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-bhakti-accent" />
          </div>
          <div>
            <h3 className="font-bold">Divine Chat</h3>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Community Online
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                {msg.sender_avatar ? (
                  <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                    {msg.sender_name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className={cn("max-w-[75%] space-y-1", isOwn ? "items-end" : "items-start")}>
                <div className={cn(
                  "p-3 rounded-2xl text-sm",
                  isOwn ? "bg-bhakti-accent text-white rounded-tr-none" : "bg-white/10 text-gray-200 rounded-tl-none"
                )}>
                  {msg.text && <p>{msg.text}</p>}
                  {renderContentPreview(msg)}
                </div>
                <p className="text-[8px] text-gray-500 px-1">
                  {msg.sender_username ? `@${msg.sender_username}` : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-bhakti-accent transition-colors"
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-bhakti-accent rounded-xl hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
