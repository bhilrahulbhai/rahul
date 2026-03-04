import React, { useState, useEffect, useRef } from 'react';
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
  Film,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { getChatResponse } from './services/gemini';
import { LoginModal } from './components/LoginModal';
import { BhaktiPlayer } from './components/BhaktiPlayer';

// --- Types ---
interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  favorite_deity?: string;
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
      
      const response = await getChatResponse(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Sorry, I could not process that.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to the spiritual realm. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96 h-[500px] bg-bhakti-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-bhakti-accent flex items-center justify-between">
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

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
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

            <div className="p-4 border-t border-white/10 flex gap-2">
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

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-bhakti-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

const CommentSection = ({ contentId }: { contentId: string | number }) => {
  const [comments, setComments] = useState<{ id: number, text: string, author: string, created_at: string }[]>([]);
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
        body: JSON.stringify({ text: newComment, author: 'User' })
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
        <div className="w-10 h-10 rounded-full bg-bhakti-accent/20 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-bhakti-accent" />
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
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-400" />
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

const UploadModal = ({ isOpen, onClose, onUpload }: { isOpen: boolean, onClose: () => void, onUpload: () => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'photo' | 'story' | 'book' | 'reel',
    url: '',
    thumbnail: '',
    author: 'User'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [thumbUploadMode, setThumbUploadMode] = useState<'url' | 'file'>('url');
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
          setFormData({ title: '', description: '', type: 'video', url: '', thumbnail: '', author: 'User' });
          setSelectedFile(null);
          setSelectedThumbFile(null);
          setUploadMode('url');
          setThumbUploadMode('url');
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
                <p className="text-sm text-gray-400 mt-1">Upload YouTube links or your own spiritual content</p>
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
                            {uploadMode === 'url' ? (formData.type === 'video' ? 'YouTube Link' : 'Content URL') : 'Upload File'}
                          </label>
                          <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => setUploadMode('url')}
                              className={cn(
                                "px-2 py-1 text-[10px] rounded-md transition-all",
                                uploadMode === 'url' ? "bg-bhakti-accent text-white" : "text-gray-500"
                              )}
                            >
                              URL
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadMode('file')}
                              className={cn(
                                "px-2 py-1 text-[10px] rounded-md transition-all",
                                uploadMode === 'file' ? "bg-bhakti-accent text-white" : "text-gray-500"
                              )}
                            >
                              FILE
                            </button>
                          </div>
                        </div>

                        {uploadMode === 'url' ? (
                          <input
                            required
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-colors"
                            placeholder={formData.type === 'video' || formData.type === 'reel' ? "Video URL (YouTube or Direct MP4)..." : "Content URL..."}
                          />
                        ) : (
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
                              <p className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Click to upload file'}</p>
                              <p className="text-xs text-gray-500 mt-1">Max size: 1GB</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thumbnail (Optional)</label>
                          <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => setThumbUploadMode('url')}
                              className={cn(
                                "px-2 py-1 text-[10px] rounded-md transition-all",
                                thumbUploadMode === 'url' ? "bg-bhakti-accent text-white" : "text-gray-500"
                              )}
                            >
                              URL
                            </button>
                            <button
                              type="button"
                              onClick={() => setThumbUploadMode('file')}
                              className={cn(
                                "px-2 py-1 text-[10px] rounded-md transition-all",
                                thumbUploadMode === 'file' ? "bg-bhakti-accent text-white" : "text-gray-500"
                              )}
                            >
                              FILE
                            </button>
                          </div>
                        </div>

                        {thumbUploadMode === 'url' ? (
                          <input
                            value={formData.thumbnail}
                            onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-colors"
                            placeholder="Link to a preview image..."
                          />
                        ) : (
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
                        )}
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
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [history, setHistory] = useState<ContentItem[]>([]);
  const [liked, setLiked] = useState<ContentItem[]>([]);
  const [watchLater, setWatchLater] = useState<ContentItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          fetchUserLibrary(userData.id);
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
    } catch (err) {
      console.error('Logout failed:', err);
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

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition.");
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
      fetchContent(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const fetchContent = async (query?: string, status?: string) => {
    try {
      setIsLoading(true);
      let url = '/api/content';
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (status) params.append('status', status);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
    } else {
      fetchContent();
    }
  }, [activeTab]);

  const filteredContent = content.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'videos') return item.type === 'video';
    if (activeTab === 'reels') return item.type === 'reel';
    if (activeTab === 'photos') return item.type === 'photo';
    if (activeTab === 'stories') return item.type === 'story';
    if (activeTab === 'books') return item.type === 'book';
    return true;
  });

  const TABS = [
    { id: 'all', label: 'All Content', icon: Grid },
    { id: 'videos', label: 'भजन Videos', icon: Play },
    { id: 'reels', label: 'Reels', icon: Film },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'stories', label: 'Stories', icon: FileText },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'library', label: 'Library', icon: Clock },
    ...(user?.email === 'bhilrahul976@gmail.com' ? [{ id: 'admin', label: 'Approval', icon: ShieldCheck }] : []),
  ];

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-bhakti-bg flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-4 gap-4">
          <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg truncate">{selectedItem.title}</h1>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={cn(
              "bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative",
              selectedItem.type === 'reel' ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video"
            )}>
              {selectedItem.type === 'video' || selectedItem.type === 'reel' ? (
                <BhaktiPlayer 
                  url={selectedItem.url} 
                  thumbnail={selectedItem.thumbnail} 
                  type={selectedItem.type} 
                />
              ) : (
                <img src={selectedItem.url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="text-gray-400 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                  {selectedItem.description}
                </p>
              )}
              <div className="flex items-center justify-between p-4 bg-bhakti-card rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bhakti-accent/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-bhakti-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedItem.author}</p>
                    <p className="text-xs text-gray-500">Creator</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => toggleLike(selectedItem)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                      liked.find(i => i.id === selectedItem.id) ? "bg-bhakti-accent text-white" : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked.find(i => i.id === selectedItem.id) && "fill-current")} /> 
                    {liked.find(i => i.id === selectedItem.id) ? "Liked" : "Like"}
                  </button>
                  <button 
                    onClick={() => toggleWatchLater(selectedItem)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                      watchLater.find(i => i.id === selectedItem.id) ? "bg-bhakti-accent text-white" : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <Clock className={cn("w-4 h-4", watchLater.find(i => i.id === selectedItem.id) && "fill-current")} /> 
                    {watchLater.find(i => i.id === selectedItem.id) ? "Saved" : "Watch Later"}
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedItem.title,
                          text: selectedItem.description,
                          url: window.location.href,
                        });
                      } else {
                        alert("Sharing not supported on this browser.");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
              <CommentSection contentId={selectedItem.id} />
            </div>
          </div>
          <aside className="space-y-6">
            <div className="bg-bhakti-card border border-white/10 rounded-3xl p-6 space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-bhakti-accent" />
                Suggested for you
              </h3>
              <div className="space-y-4">
                {content
                  .filter(i => i.id !== selectedItem.id && (i.type === 'video' || i.type === 'reel'))
                  .slice(0, 6)
                  .map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleSelectItem(item)} 
                      className="flex gap-4 group cursor-pointer p-2 -m-2 rounded-2xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative">
                        <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 py-0.5">
                        <h4 className="text-xs font-bold line-clamp-2 group-hover:text-bhakti-accent transition-colors leading-snug">{item.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-bhakti-accent" />
                          {item.author}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Spiritual Quote or Info */}
            <div className="bg-gradient-to-br from-bhakti-accent/20 to-transparent border border-bhakti-accent/20 rounded-3xl p-6">
              <p className="text-sm italic text-gray-300">"Devotion is not just a feeling, it is a state of being where the soul meets the divine."</p>
            </div>
          </aside>
        </main>
        <ChatBot />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
                    onKeyDown={(e) => e.key === 'Enter' && fetchContent(searchQuery)}
                    className="w-full bg-bhakti-card border border-white/10 rounded-full py-2 px-6 focus:outline-none focus:border-bhakti-accent transition-all text-sm"
                  />
                  <button 
                    onClick={() => fetchContent(searchQuery)}
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
                <button className="p-2 hover:bg-white/5 rounded-full lg:hidden">
                  <Grid className="w-6 h-6" />
                </button>
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
                      onKeyDown={(e) => e.key === 'Enter' && fetchContent(searchQuery)}
                      className="w-full bg-bhakti-card border border-white/10 rounded-l-full py-2 px-6 focus:outline-none focus:border-bhakti-accent transition-all"
                    />
                    <button 
                      onClick={() => fetchContent(searchQuery)}
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
                    <div className="w-8 h-8 rounded-full bg-bhakti-accent flex items-center justify-center text-sm font-bold shrink-0">
                      {user.name[0].toUpperCase()}
                    </div>
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
            {activeTab === 'library' ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredContent.map((item) => (
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
                  {content.slice(0, 3).map((item) => (
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
        onUpload={fetchContent} 
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
      <ChatBot />
    </div>
  );
}
