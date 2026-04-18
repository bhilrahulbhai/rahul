import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Home, 
  Grid, 
  Upload, 
  User, 
  Settings, 
  Play, 
  Image as ImageIcon, 
  BookOpen, 
  FileText,
  TrendingUp,
  Compass,
  MessageSquare,
  X,
  Send,
  Loader2,
  ChevronRight,
  Plus,
  ArrowLeft,
  Heart,
  Mic,
  Share2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Film,
  Clock,
  ThumbsUp,
  MessageCircle,
  Users,
  LogOut,
  Camera,
  AlertTriangle,
  MoreVertical,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

import { LoginModal } from './components/LoginModal';
import { BhaktiPlayer } from './components/BhaktiPlayer';
import { ChatRoom } from './components/ChatRoom';
import { ExploreView } from './components/ExploreView';
import { ProfileEditModal } from './components/ProfileEditModal';
import { PrivateChat } from './components/PrivateChat';
import { AdminDashboard } from './components/AdminDashboard';
import { io } from 'socket.io-client';

// --- Types ---
interface UserProfile {
  id: number;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  favorite_deity?: string;
  role?: 'admin' | 'user';
}

interface ContentItem {
  id: string | number;
  title: string;
  description?: string;
  type: 'video' | 'photo' | 'story' | 'book' | 'reel';
  url: string;
  thumbnail: string;
  author: string;
  likes: string | number;
  views?: number;
  created_at?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// --- Components ---

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMsg = input.trim();
  setInput('');
  setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
  setIsLoading(true);

  try {
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMsg,
        history,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Chat request failed");
    }

    setMessages(prev => [
      ...prev,
      { role: 'model', text: data.reply || 'Sorry, I could not process that.' }
    ]);
  } catch (error) {
    console.error(error);
    setMessages(prev => [
      ...prev,
      { role: 'model', text: 'Error connecting to the spiritual realm. Please try again.' }
    ]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <>
      {/* Floating Button - Stays in corner */}
      <div className="fixed bottom-24 lg:bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-bhakti-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Draggable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 lg:bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-bhakti-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-bhakti-accent flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">BhaktiSagar AI</h3>
                  <p className="text-[10px] opacity-80">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide cursor-default" onPointerDown={(e) => e.stopPropagation()}>
              {messages.length === 0 && (
                <div className="text-center py-8 opacity-50 text-sm">
                  Ask me anything about bhajans, stories, or spirituality.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-bhakti-accent text-white rounded-tr-none" : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                    <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-bhakti-accent transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="p-2 bg-bhakti-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const CommentSection = ({ contentId, user }: { contentId: string | number, user: UserProfile | null }) => {
  const [comments, setComments] = useState<{ id: number, text: string, author: string, avatar?: string, created_at: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/content/${contentId}/comments`);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch( `/api/content/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: newComment, 
          author: user ? user.name : 'Anonymous',
          avatar: user ? user.avatar : null
        })
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold">{comments.length} Comments</h3>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-bhakti-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-5 h-5 text-bhakti-accent" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-bhakti-accent transition-colors"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-full transition-colors">Cancel</button>
            <button disabled={!newComment.trim() || isSubmitting} className="px-4 py-2 bg-bhakti-accent rounded-full text-sm font-bold disabled:opacity-50">Comment</button>
          </div>
        </div>
      </form>
      <div className="space-y-6">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {comment.avatar ? (
                <img src={comment.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">@{comment.author}</span>
                <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-200">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onUpload, user }: { isOpen: boolean, onClose: () => void, onUpload: () => void, user: UserProfile | null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'photo' | 'story' | 'book' | 'reel',
    url: '',
    thumbnail: '',
    author: user?.name || 'User'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, author: user.name }));
    }
  }, [user]);

  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [thumbUploadMode, setThumbUploadMode] = useState<'url' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedThumbFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalUrl = formData.url;
      let finalThumbnail = formData.thumbnail;

      // If in file upload mode, upload the content file first
      if (uploadMode === 'file' && selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.url) {
          finalUrl = uploadResult.url;
        }
      }

      // Handle thumbnail upload
      if (thumbUploadMode === 'file' && selectedThumbFile) {
        const thumbData = new FormData();
        thumbData.append('file', selectedThumbFile);
        const thumbRes = await fetch('/api/upload', {
          method: 'POST',
          body: thumbData
        });
        const thumbResult = await thumbRes.json();
        if (thumbResult.url) {
          finalThumbnail = thumbResult.url;
        }
      }

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, url: finalUrl, thumbnail: finalThumbnail })
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onUpload();
          onClose();
          setFormData({ title: '', description: '', type: 'video', url: '', thumbnail: '', author: user?.name || 'User' });
          setSelectedFile(null);
          setSelectedThumbFile(null);
          setUploadMode('file');
          setThumbUploadMode('file');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-bhakti-card w-full max-w-2xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-2xl font-bold">Share Your Devotion</h3>
                <p className="text-sm text-gray-400 mt-1">Upload your own spiritual content to the community</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              {showSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-20 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Content Submitted!</h3>
                  <p className="text-gray-400 max-w-xs">
                    Your spiritual content has been sent for review. It will be live once approved by our team.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Content Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'video', label: 'Video', icon: Play },
                            { id: 'reel', label: 'Reel', icon: Film },
                            { id: 'photo', label: 'Photo', icon: ImageIcon },
                            { id: 'story', label: 'Story', icon: FileText },
                            { id: 'book', label: 'Book', icon: BookOpen },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, type: t.id as any })}
                              className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                                formData.type === t.id 
                                  ? "bg-bhakti-accent border-bhakti-accent text-white" 
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                              )}
                            >
                              <t.icon className="w-4 h-4" />
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Title</label>
                        <input
                          required
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-colors"
                          placeholder="Give it a divine title..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Upload File
                          </label>
                        </div>

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept={formData.type === 'photo' ? 'image/*' : (formData.type === 'video' || formData.type === 'reel' ? 'video/*' : '*')}
                          />
                          <div className="w-12 h-12 rounded-full bg-bhakti-accent/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-bhakti-accent" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Click to select content'}</p>
                            <p className="text-xs text-gray-500 mt-1">Max size: 1GB</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thumbnail (Optional Upload)</label>

                        <div 
                          onClick={() => thumbFileInputRef.current?.click()}
                          className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all"
                        >
                          <input
                            type="file"
                            ref={thumbFileInputRef}
                            onChange={handleThumbFileChange}
                            className="hidden"
                            accept="image/*"
                          />
                          <div className="w-10 h-10 rounded-full bg-bhakti-accent/10 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-bhakti-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{selectedThumbFile ? selectedThumbFile.name : 'Choose thumbnail'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-colors resize-none"
                      placeholder="Tell us more about this content..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      disabled={isUploading}
                      className="w-full bg-bhakti-accent py-5 rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-bhakti-accent/20"
                    >
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                      Publish to BhaktiSagar
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [content, setContent] = useState<ContentItem[]>([]);
  const offsetRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [history, setHistory] = useState<ContentItem[]>([]);
  const [liked, setLiked] = useState<ContentItem[]>([]);
  const [watchLater, setWatchLater] = useState<ContentItem[]>([]);
  const [userContent, setUserContent] = useState<ContentItem[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activePrivateChat, setActivePrivateChat] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const socketRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchContent = useCallback(async (query?: string, status?: string, isAppend = false, type?: string) => {
    try {
      if (!isAppend) {
        setIsLoading(true);
        offsetRef.current = 0;
        setHasMore(true);
      } else {
        setIsFetchingMore(true);
      }

      const currentOffset = isAppend ? offsetRef.current : 0;
      const limit = 20;

      let url = `/api/content?limit=${limit}&offset=${currentOffset}`;
      const params = new URLSearchParams();
      
      const searchVal = query !== undefined ? query.trim() : searchQuery.trim();
      if (searchVal) params.append('search', searchVal);
      
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      
      if (isAppend) {
        setContent(prev => [...prev, ...data]);
        offsetRef.current += data.length;
      } else {
        setContent(data);
        offsetRef.current = data.length;
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [searchQuery]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const type = activeTab === 'all' ? undefined : activeTab.slice(0, -1);
        fetchContent(undefined, activeTab === 'admin' ? 'pending' : 'approved', true, type);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore, activeTab, fetchContent]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    socketRef.current = io();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          fetchUserLibrary(userData.id);
          fetchFriends();
          fetchUserContent();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    checkAuth();
  }, []);

  const fetchUserLibrary = async (userId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/library`);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setHistory(data.history);
      setLiked(data.liked);
      setWatchLater(data.watch_later);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const fetchUserContent = async () => {
    try {
      const res = await fetch('/api/user/content');
      if (res.ok) {
        const data = await res.json();
        setUserContent(data);
      }
    } catch (err) {
      console.error('Failed to fetch user content:', err);
    }
  };

  const syncLibrary = async (contentId: string | number, type: string, action: 'add' | 'remove') => {
    if (!user) return;
    try {
      await fetch(`/api/user/${user.id}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, type, action }),
      });
    } catch (error) {
      console.error('Failed to sync library:', error);
    }
  };

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    fetchUserLibrary(userData.id);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setHistory([]);
      setLiked([]);
      setWatchLater([]);
      setUserContent([]);
      setFriends([]);
      setNotification({ message: 'Logged out successfully', type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (targetType: string, targetId: number | string, reason: string) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason })
      });
      if (res.ok) {
        setNotification({ message: 'Report submitted successfully', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectItem = (item: ContentItem) => {
    setSelectedItem(item);
    setHistory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const newHistory = [item, ...filtered].slice(0, 20);
      return newHistory;
    });
    syncLibrary(item.id, 'history', 'add');
  };

  const toggleLike = (item: ContentItem) => {
    const isLiked = liked.find(i => i.id === item.id);
    setLiked(prev => {
      if (isLiked) return prev.filter(i => i.id !== item.id);
      return [item, ...prev];
    });
    syncLibrary(item.id, 'liked', isLiked ? 'remove' : 'add');
  };

  const toggleWatchLater = (item: ContentItem) => {
    const isAdded = watchLater.find(i => i.id === item.id);
    setWatchLater(prev => {
      if (isAdded) return prev.filter(i => i.id !== item.id);
      return [item, ...prev];
    });
    syncLibrary(item.id, 'watch_later', isAdded ? 'remove' : 'add');
  };

  const shareToChat = (item: ContentItem) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    socketRef.current?.emit('send-message', {
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      contentId: item.id
    });
    setActiveTab('chat');
    setSelectedItem(null);
  };

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotification({ message: "Your browser does not support voice recognition.", type: 'error' });
      return;
    }

    try {
      // Explicitly request microphone permission first
      // This helps in some browsers/iframes to trigger the prompt correctly
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setNotification({ 
          message: "Microphone access is blocked. Please enable it in your browser settings to use voice search.", 
          type: 'error' 
        });
      } else {
        setNotification({ message: "Could not access microphone. Please check your settings.", type: 'error' });
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Default to Hindi for BhaktiSagar, but it usually handles English too
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      const type = activeTab === 'all' ? undefined : activeTab.slice(0, -1);
      fetchContent(transcript, activeTab === 'admin' ? 'pending' : 'approved', false, type);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setNotification({ 
          message: "Microphone access is blocked. Please enable it in your browser settings to use voice search.", 
          type: 'error' 
        });
      } else {
        setNotification({ message: `Speech recognition error: ${event.error}`, type: 'error' });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleApprove = async (id: string | number) => {
    try {
      await fetch(`/api/content/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      fetchContent(undefined, 'pending');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string | number) => {
    try {
      await fetch(`/api/content/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      fetchContent(undefined, 'pending');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchContent(undefined, 'pending');
    } else if (activeTab !== 'explore' && activeTab !== 'chat' && activeTab !== 'library' && activeTab !== 'profile') {
      const type = activeTab === 'all' ? undefined : activeTab.slice(0, -1);
      fetchContent(undefined, 'approved', false, type);
    }
  }, [activeTab, fetchContent]);

  const TABS = [
    { id: 'all', label: 'All Content', icon: Grid },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'videos', label: 'भजन Videos', icon: Play },
    { id: 'reels', label: 'Reels', icon: Film },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'stories', label: 'Stories', icon: FileText },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'library', label: 'Library', icon: Clock },
    ...(user ? [{ id: 'profile', label: 'Profile', icon: User }] : []),
    ...(user?.email === 'bhilrahul976@gmail.com' ? [{ id: 'admin', label: 'Approval', icon: ShieldCheck }] : []),
  ];

  if (selectedItem) {
    const isReel = selectedItem.type === 'reel';
    return (
      <div className="min-h-screen bg-bhakti-bg flex flex-col fixed inset-0 z-[60] overflow-hidden animate-in fade-in zoom-in duration-300">
        <header className="h-16 border-b border-white/5 flex items-center px-4 gap-4 bg-bhakti-card/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-[70]">
          <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg truncate flex-1">{selectedItem.title}</h1>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <Share2 className="w-5 h-5 text-gray-300" />
            </button>
            <button className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </header>

        <main className={cn(
          "flex-1 w-full overflow-y-auto pt-16 scrollbar-hide bg-black/40",
          isReel ? "flex flex-col items-center justify-center p-0" : "flex flex-col lg:flex-row items-stretch justify-center p-0 lg:p-12 gap-12"
        )}>
          <div className={cn(
            "relative bg-black transition-all duration-700 ease-out flex items-center justify-center",
            isReel 
              ? "h-[calc(100vh-64px)] w-full max-w-[480px] aspect-[9/16] shadow-[0_0_120px_rgba(0,0,0,0.8)]" 
              : "flex-1 max-w-5xl aspect-video lg:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl"
          )}>
            <BhaktiPlayer 
              id={selectedItem.id}
              url={selectedItem.url} 
              thumbnail={selectedItem.thumbnail} 
              type={selectedItem.type as 'reel' | 'video'} 
              authorName={selectedItem.author}
              autoPlay={true}
            />
          </div>

          {!isReel && (
            <div className="flex-1 max-w-xl w-full mx-auto p-8 lg:p-0 space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-white leading-tight tracking-tight">{selectedItem.title}</h2>
                
                <div className="flex items-center justify-between p-5 bg-bhakti-card rounded-[32px] border border-white/10 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-bhakti-accent flex items-center justify-center text-xl font-bold shadow-lg shadow-bhakti-accent/20">
                      {selectedItem.author[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-lg">{selectedItem.author}</p>
                      <p className="text-xs text-bhakti-accent font-bold uppercase tracking-widest">Verified Devotee</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-bhakti-accent text-white font-black rounded-2xl hover:opacity-90 shadow-lg shadow-bhakti-accent/20 transition-all active:scale-95">
                    Follow
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toggleLike(selectedItem)}
                    className={cn(
                      "flex items-center justify-center gap-3 py-4 rounded-3xl transition-all font-bold text-sm",
                      liked.find(i => i.id === selectedItem.id) ? "bg-bhakti-accent text-white" : "bg-white/5 hover:bg-white/10 border border-white/5"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", liked.find(i => i.id === selectedItem.id) && "fill-current")} />
                    {selectedItem.likes} Likes
                  </button>
                  <button className="flex items-center justify-center gap-3 py-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all font-bold text-sm">
                    <Eye className="w-5 h-5" /> {selectedItem.views || 0} Views
                  </button>
                </div>

                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-bhakti-accent" />
                  <p className="text-gray-300 leading-relaxed text-lg italic pl-4">
                    {selectedItem.description || "A divine contribution to the BhaktiSagar community."}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <CommentSection contentId={selectedItem.id} user={user} />
              </div>
            </div>
          )}
        </main>
        <ChatBot />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
              notification.type === 'error' ? "bg-red-500 text-white" : 
              notification.type === 'success' ? "bg-green-500 text-white" : "bg-bhakti-accent text-white"
            )}
          >
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-bhakti-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {showMobileSearch ? (
            <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <button 
                onClick={() => setShowMobileSearch(false)} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 relative flex items-center gap-2">
                <div className="flex-1 relative flex">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search BhaktiSagar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchContent(searchQuery, activeTab === 'admin' ? 'pending' : 'approved', false, activeTab === 'all' ? undefined : activeTab.slice(0, -1))}
                    className="w-full bg-bhakti-card border border-white/10 rounded-full py-2 px-6 focus:outline-none focus:border-bhakti-accent transition-all text-sm"
                  />
                  <button 
                    onClick={() => fetchContent(searchQuery, activeTab === 'admin' ? 'pending' : 'approved', false, activeTab === 'all' ? undefined : activeTab.slice(0, -1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <button 
                  onClick={startListening}
                  className={cn(
                    "p-2.5 rounded-full transition-all shrink-0",
                    isListening ? "bg-bhakti-accent animate-pulse" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <Mic className={cn("w-5 h-5", isListening ? "text-white" : "text-gray-400")} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedItem(null); setActiveTab('all'); }}>
                  <div className="w-10 h-10 rounded-full bg-bhakti-accent flex items-center justify-center shrink-0">
                    <span className="text-xl">🕉️</span>
                  </div>
                  <div className="hidden xs:block">
                    <h1 className="font-bold text-lg leading-tight">BhaktiSagar</h1>
                    <p className="text-[10px] text-bhakti-accent font-hindi">भक्ति का सागर</p>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-8">
                <div className="w-full relative flex items-center gap-2">
                  <div className="flex-1 relative flex">
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchContent(searchQuery, activeTab === 'admin' ? 'pending' : 'approved', false, activeTab === 'all' ? undefined : activeTab.slice(0, -1))}
                      className="w-full bg-bhakti-card border border-white/10 rounded-l-full py-2 px-6 focus:outline-none focus:border-bhakti-accent transition-all"
                    />
                    <button 
                      onClick={() => fetchContent(searchQuery, activeTab === 'admin' ? 'pending' : 'approved', false, activeTab === 'all' ? undefined : activeTab.slice(0, -1))}
                      className="px-6 bg-white/5 border border-l-0 border-white/10 rounded-r-full hover:bg-white/10 transition-colors"
                    >
                      <Search className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <button 
                    onClick={startListening}
                    className={cn(
                      "p-3 rounded-full transition-all",
                      isListening ? "bg-bhakti-accent animate-pulse" : "bg-white/5 hover:bg-white/10"
                    )}
                    title="Voice Search"
                  >
                    <Mic className={cn("w-5 h-5", isListening ? "text-white" : "text-gray-400")} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setShowMobileSearch(true)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Create</span>
                </button>
                
                {user ? (
                  <div className="flex items-center gap-3 bg-white/5 p-1 pr-3 rounded-full border border-white/10">
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="w-8 h-8 rounded-full bg-bhakti-accent flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user.name[0].toUpperCase()
                      )}
                    </button>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold leading-none">{user.name}</p>
                      <button onClick={handleLogout} className="text-[8px] text-gray-500 hover:text-white transition-colors">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-bhakti-accent rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-bhakti-accent/20"
                  >
                    <User className="w-4 h-4" /> <span className="hidden xs:inline">Sign In</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'all', icon: Home, label: 'Home' },
            { id: 'explore', icon: Compass, label: 'Explore' },
            { id: 'chat', icon: MessageSquare, label: 'Global' },
            { id: 'messages', icon: Send, label: 'Messages' },
            { id: 'reels', icon: Film, label: 'Reels' },
            { id: 'shorts', icon: Play, label: 'Shorts' },
            { id: 'subscriptions', icon: Grid, label: 'Subscriptions' },
            { id: 'library', icon: BookOpen, label: 'Library' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                activeTab === item.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          
          {user?.role === 'admin' && (
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-bhakti-accent hover:bg-bhakti-accent/10 transition-colors mt-4 border border-bhakti-accent/20"
            >
              <ShieldCheck className="w-5 h-5" />
              Admin Dashboard
            </button>
          )}
          <hr className="border-white/5 my-4" />
          <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
          {[
            { id: 'videos', label: 'Bhajans' },
            { id: 'reels', label: 'Reels' },
            { id: 'mantras', label: 'Mantras' },
            { id: 'stories', label: 'Stories' },
            { id: 'books', label: 'Books' },
            { id: 'photos', label: 'Photos' }
          ].map((cat, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "flex items-center gap-4 px-4 py-2 text-sm transition-colors",
                activeTab === cat.id ? "text-bhakti-accent font-bold" : "text-gray-400 hover:text-white"
              )}
            >
              <ChevronRight className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-12">
            {activeTab === 'chat' ? (
              <div className="h-[calc(100vh-120px)] animate-in fade-in duration-500">
                <ChatRoom user={user} />
              </div>
            ) : activeTab === 'library' ? (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-full bg-bhakti-accent/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-bhakti-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Your Library</h2>
                    <p className="text-gray-400 text-sm">History, Liked, and Watch Later</p>
                  </div>
                </div>

                {/* History Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" /> History
                    </h3>
                    <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-white transition-colors">Clear All</button>
                  </div>
                  {history.length === 0 ? (
                    <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-gray-500">No history yet. Start exploring!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {history.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className="group cursor-pointer space-y-2">
                          <div className="aspect-video rounded-xl overflow-hidden border border-white/5">
                            <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <h4 className="text-sm font-medium line-clamp-1">{item.title}</h4>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Liked Section */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-bhakti-accent" /> Liked Content
                  </h3>
                  {liked.length === 0 ? (
                    <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-gray-500">You haven't liked anything yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {liked.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className="group cursor-pointer space-y-2">
                          <div className="aspect-video rounded-xl overflow-hidden border border-white/5">
                            <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <h4 className="text-sm font-medium line-clamp-1">{item.title}</h4>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Watch Later Section */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" /> Watch Later
                  </h3>
                  {watchLater.length === 0 ? (
                    <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-gray-500">Your watch later list is empty.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {watchLater.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className="group cursor-pointer space-y-2">
                          <div className="aspect-video rounded-xl overflow-hidden border border-white/5">
                            <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <h4 className="text-sm font-medium line-clamp-1">{item.title}</h4>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {user && (
                  <>
                    {/* Friends Section */}
                    <section className="space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-bhakti-accent" /> Friends & Requests
                      </h3>
                      {friends.length === 0 ? (
                        <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                          <p className="text-gray-500">No friends yet. Explore and add some!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {friends.map(friend => (
                            <div key={friend.id} className="bg-bhakti-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-bhakti-accent/20 flex items-center justify-center overflow-hidden">
                                  {friend.avatar ? (
                                    <img src={friend.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <User className="w-6 h-6 text-bhakti-accent" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{friend.name}</p>
                                  <p className="text-xs text-gray-400">@{friend.username}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {friend.status === 'accepted' ? (
                                  <button 
                                    onClick={() => setActivePrivateChat(friend)}
                                    className="p-2 bg-bhakti-accent/10 text-bhakti-accent rounded-xl hover:bg-bhakti-accent/20 transition-all"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                  </button>
                                ) : friend.requester_id === user?.id ? (
                                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending</span>
                                ) : (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={async () => {
                                        await fetch('/api/friends/accept', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ targetId: friend.id }),
                                        });
                                        fetchFriends();
                                      }}
                                      className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-all"
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        await fetch('/api/friends/reject', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ targetId: friend.id }),
                                        });
                                        fetchFriends();
                                      }}
                                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                    >
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            ) : activeTab === 'admin' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-full bg-bhakti-accent/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-bhakti-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Content Approval</h2>
                    <p className="text-gray-400 text-sm">Review spiritual content before it goes live</p>
                  </div>
                </div>

                {content.length === 0 ? (
                  <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold">All caught up!</h3>
                    <p className="text-gray-500 mt-1">No pending content to review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.map((item) => (
                      <div key={item.id} className="bg-bhakti-card rounded-3xl overflow-hidden border border-white/10 flex flex-col">
                        <div className="aspect-video relative">
                          <img src={item.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {item.type}
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col gap-4">
                          <div>
                            <h3 className="text-xl font-bold line-clamp-1">{item.title}</h3>
                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                              <User className="w-3 h-3" /> {item.author}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 italic">
                            {item.description || "No description provided."}
                          </p>
                          <div className="mt-auto pt-4 flex gap-3">
                            <button 
                              onClick={() => handleApprove(item.id)}
                              className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5" /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-5 h-5" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'profile' ? (
              <div className="space-y-12 animate-in fade-in duration-500">
                {/* Profile Header */}
                <div className="bg-bhakti-card rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-bhakti-accent/20 to-orange-500/20" />
                  <div className="relative flex flex-col md:flex-row items-center gap-8 pt-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-bhakti-card bg-bhakti-accent/20 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-xl">
                        {user?.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user?.name[0].toUpperCase()
                        )}
                      </div>
                      <button 
                        onClick={() => setIsProfileEditOpen(true)}
                        className="absolute bottom-0 right-0 p-3 bg-bhakti-accent text-white rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-bhakti-card"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center md:text-left flex-1 space-y-2">
                      <h2 className="text-4xl font-bold">{user?.name}</h2>
                      <p className="text-bhakti-accent font-medium">@{user?.username}</p>
                      <p className="text-gray-400 max-w-xl">{user?.bio || "No bio yet. Add one to share your spiritual journey."}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setIsProfileEditOpen(true)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <User className="w-4 h-4" /> Edit Profile
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            handleLogout();
                            setIsLoginOpen(true);
                          }}
                          className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" /> Switch
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* My Content Section */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Upload className="w-6 h-6 text-bhakti-accent" /> Your Spiritual Contributions
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{userContent.length}</span> Uploads
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{userContent.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0)}</span> Views
                      </div>
                    </div>
                  </div>
                  
                  {userContent.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                      <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 mb-6">You haven't shared any divine content yet.</p>
                      <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="px-8 py-4 bg-bhakti-accent text-white font-bold rounded-2xl shadow-xl shadow-bhakti-accent/20 hover:opacity-90 transition-all"
                      >
                        Start Sharing
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {userContent.map(item => (
                        <motion.div 
                          key={item.id} 
                          whileHover={{ y: -8 }}
                          onClick={() => handleSelectItem(item)} 
                          className="bg-bhakti-card rounded-[32px] border border-white/10 overflow-hidden group cursor-pointer hover:border-bhakti-accent/50 transition-all shadow-2xl"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                            
                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                              {item.type}
                            </div>
                            
                            {item.status === 'pending' && (
                              <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500/80 backdrop-blur-md rounded-xl text-[10px] font-bold text-white uppercase tracking-widest border border-orange-400/20">
                                Pending Approval
                              </div>
                            )}

                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                  <Compass className="w-3.5 h-3.5 text-bhakti-accent" />
                                  <span className="text-xs font-bold">{item.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                  <span className="text-xs font-bold">{item.likes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-3">
                            <h4 className="font-bold text-lg line-clamp-1 group-hover:text-bhakti-accent transition-colors">{item.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.description || "No description provided."}</p>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">
                                {new Date(item.created_at as any).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-bhakti-accent/10 flex items-center justify-center">
                                <Play className="w-4 h-4 text-bhakti-accent fill-current" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : activeTab === 'explore' ? (
              <div className="animate-in fade-in duration-500">
                <ExploreView 
                  onSelectItem={handleSelectItem} 
                  onMessageUser={(targetUser) => {
                    if (!user) {
                      setIsLoginOpen(true);
                    } else {
                      setActivePrivateChat(targetUser);
                    }
                  }}
                  onFriendAction={fetchFriends}
                  currentUserId={user?.id}
                />
              </div>
            ) : activeTab === 'messages' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-full bg-bhakti-accent/20 flex items-center justify-center">
                    <Send className="w-6 h-6 text-bhakti-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Private Messages</h2>
                    <p className="text-gray-400 text-sm">One-to-one conversations with your spiritual friends</p>
                  </div>
                </div>

                {!user ? (
                  <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-gray-400 mb-4">Please login to see your messages</p>
                    <button onClick={() => setIsLoginOpen(true)} className="px-6 py-3 bg-bhakti-accent text-white font-bold rounded-2xl">Login Now</button>
                  </div>
                ) : friends.filter(f => f.status === 'accepted').length === 0 ? (
                  <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-gray-400 mb-4">You don't have any friends yet</p>
                    <button onClick={() => setActiveTab('explore')} className="px-6 py-3 bg-white/10 text-white font-bold rounded-2xl">Find Friends</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.filter(f => f.status === 'accepted').map(friend => (
                      <motion.div
                        key={friend.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setActivePrivateChat(friend)}
                        className="bg-bhakti-card p-6 rounded-3xl border border-white/10 flex items-center gap-4 cursor-pointer hover:border-bhakti-accent/50 transition-all shadow-xl"
                      >
                        <div className="w-16 h-16 rounded-full bg-bhakti-accent/20 flex items-center justify-center overflow-hidden border-2 border-bhakti-accent/20">
                          {friend.avatar ? (
                            <img src={friend.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-8 h-8 text-bhakti-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{friend.name}</h4>
                          <p className="text-sm text-gray-400">@{friend.username}</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-bhakti-accent/10 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-bhakti-accent" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Hero Section */}
            <section className="text-center space-y-6 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-bhakti-accent/10 flex items-center justify-center border border-bhakti-accent/20">
                  <span className="text-4xl">🪷</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold font-hindi tracking-tight">भक्ति का सागर</h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                  Discover bhajans, devotional photos, sacred stories, and spiritual books — all in one divine space.
                </p>
              </motion.div>
            </section>

        {/* Tabs & Content Grid */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id 
                    ? "bg-bhakti-accent text-white shadow-lg shadow-bhakti-accent/20" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-bhakti-accent" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectItem(item)}
                        className="group bg-bhakti-card rounded-2xl overflow-hidden border border-white/5 hover:border-bhakti-accent/30 transition-all cursor-pointer"
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-bhakti-accent flex items-center justify-center">
                              <Play className="w-6 h-6 fill-current" />
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] uppercase tracking-wider font-bold">
                            {item.type}
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" /> {item.author}
                            </span>
                            <span className="flex items-center gap-1.5">
                              ❤️ {item.likes}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div ref={lastElementRef} className="flex justify-center py-12">
                      {isFetchingMore && (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-bhakti-accent" />
                          <p className="text-xs text-gray-500 font-hindi">अधिक सामग्री लोड हो रही है...</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!hasMore && content.length > 0 && (
                    <div className="text-center py-12 border-t border-white/5">
                      <p className="text-gray-500 text-sm font-hindi">सागर की गहराई यहीं तक है। और खोजें!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-bhakti-card rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> Trending This Week
                  </h3>
                  <button className="text-xs text-bhakti-accent hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {[...content]
                    .sort((a, b) => Number(b.likes) - Number(a.likes))
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} onClick={() => handleSelectItem(item)} className="flex gap-4 group cursor-pointer">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 py-1">
                          <h4 className="text-sm font-medium line-clamp-1 group-hover:text-bhakti-accent transition-colors">{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.likes} likes</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-bhakti-card rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Compass className="w-5 h-5 text-bhakti-accent" /> Browse by Deity
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Krishna', 'Ram', 'Shiva', 'Hanuman', 'Durga', 'Ganesha'].map((deity) => (
                    <button key={deity} className="px-4 py-3 bg-white/5 rounded-xl text-sm font-medium hover:bg-bhakti-accent hover:text-white transition-all flex items-center justify-between group">
                      {deity}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>
            </div>
          </div>
        </>
      )}
    </div>
  </main>

        {/* Bottom Navigation for Mobile & Tablet */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bhakti-bg/95 backdrop-blur-lg border-t border-white/5 px-6 py-3 z-50 flex items-center justify-between">
      <button 
        onClick={() => setActiveTab('all')} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors", 
          activeTab === 'all' ? "text-bhakti-accent" : "text-gray-400"
        )}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px]">Home</span>
      </button>
      <button 
        onClick={() => setActiveTab('explore')} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors", 
          activeTab === 'explore' ? "text-bhakti-accent" : "text-gray-400"
        )}
      >
        <Compass className="w-6 h-6" />
        <span className="text-[10px]">Explore</span>
      </button>
      <button 
        onClick={() => setActiveTab('chat')} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors", 
          activeTab === 'chat' ? "text-bhakti-accent" : "text-gray-400"
        )}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-[10px]">Chat</span>
      </button>
      <button 
        onClick={() => setActiveTab('reels')} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors", 
          activeTab === 'reels' ? "text-bhakti-accent" : "text-gray-400"
        )}
      >
        <Film className="w-6 h-6" />
        <span className="text-[10px]">Reels</span>
      </button>
      <button 
        onClick={() => setActiveTab('library')} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors", 
          activeTab === 'library' ? "text-bhakti-accent" : "text-gray-400"
        )}
      >
        <BookOpen className="w-6 h-6" />
        <span className="text-[10px]">Library</span>
      </button>
      {user && (
        <button 
          onClick={() => setActiveTab('profile')} 
          className={cn(
            "flex flex-col items-center gap-1 transition-colors", 
            activeTab === 'profile' ? "text-bhakti-accent" : "text-gray-400"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px]">Profile</span>
        </button>
      )}
    </nav>
  </div>

      <footer className="border-t border-white/5 bg-bhakti-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">🕉️</div>
            <span className="font-bold">BhaktiSagar</span>
          </div>
          <p className="text-sm text-gray-500">© 2024 BhaktiSagar. All rights reserved. Made with devotion.</p>
        </div>
      </footer>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={() => {
          const type = activeTab === 'all' ? undefined : activeTab.slice(0, -1);
          fetchContent(undefined, activeTab === 'admin' ? 'pending' : 'approved', false, type);
          fetchUserContent();
        }} 
        user={user}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
      {user && (
        <ProfileEditModal
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          user={user}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
      <AnimatePresence>
        {activePrivateChat && (
          <PrivateChat
            currentUser={user}
            targetUser={activePrivateChat}
            onClose={() => setActivePrivateChat(null)}
          />
        )}
      </AnimatePresence>
      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <ChatBot />
    </div>
  );
}
