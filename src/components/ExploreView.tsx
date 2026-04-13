import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, User, Play, Film, ImageIcon, FileText, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UserResult {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  friendship_status?: 'pending' | 'accepted' | null;
  requester_id?: number;
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  type: string;
  url: string;
  thumbnail: string;
  author: string;
  likes: number;
  views?: number;
  created_at: string;
}

interface ExploreViewProps {
  onSelectItem: (item: any) => void;
  onMessageUser: (user: any) => void;
  onFriendAction?: () => void;
  currentUserId?: number;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onSelectItem, onMessageUser, onFriendAction, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleFriendAction = async (targetId: number, action: 'request' | 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/friends/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      if (res.ok) {
        if (onFriendAction) onFriendAction();
        // Refresh search results
        const updatedResults = userResults.map(u => {
          if (u.id === targetId) {
            if (action === 'request') return { ...u, friendship_status: 'pending', requester_id: currentUserId };
            if (action === 'accept') return { ...u, friendship_status: 'accepted' };
            if (action === 'reject') return { ...u, friendship_status: null };
          }
          return u;
        });
        setUserResults(updatedResults as UserResult[]);
      }
    } catch (err) {
      console.error('Friend action failed:', err);
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/content/trending');
        const data = await res.json();
        setTrendingContent(data);
      } catch (err) {
        console.error('Failed to fetch trending content:', err);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUserResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setUserResults(data);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'reel': return Film;
      case 'photo': return ImageIcon;
      case 'story': return FileText;
      case 'book': return BookOpen;
      default: return Play;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 pb-24">
      {/* Search Section */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-bhakti-accent transition-all text-lg"
          />
        </div>

        <AnimatePresence>
          {searchQuery.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-bhakti-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              {isSearching ? (
                <div className="p-8 text-center text-gray-400">Searching...</div>
              ) : userResults.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {userResults.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onMessageUser(user)}>
                        <div className="w-12 h-12 rounded-full bg-bhakti-accent/20 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-6 h-6 text-bhakti-accent" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentUserId && (
                          <>
                            {user.friendship_status === 'accepted' ? (
                              <button 
                                onClick={() => onMessageUser(user)}
                                className="px-4 py-2 bg-bhakti-accent text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                              >
                                Message
                              </button>
                            ) : user.friendship_status === 'pending' ? (
                              user.requester_id === currentUserId ? (
                                <button className="px-4 py-2 bg-white/10 text-gray-400 text-xs font-bold rounded-xl cursor-default">
                                  Requested
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleFriendAction(user.id, 'accept')}
                                    className="px-4 py-2 bg-bhakti-accent text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleFriendAction(user.id, 'reject')}
                                    className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )
                            ) : (
                              <button 
                                onClick={() => handleFriendAction(user.id, 'request')}
                                className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all"
                              >
                                Add Friend
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">No users found matching "{searchQuery}"</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trending Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trending Now</h2>
              <p className="text-gray-400 text-sm">Most popular divine content this week</p>
            </div>
          </div>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {trendingContent.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectItem(item)}
                className="break-inside-avoid group relative bg-bhakti-card rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-xl mb-4"
              >
                <div className={cn(
                  "relative overflow-hidden",
                  item.type === 'reel' ? "aspect-[9/16]" : "aspect-square"
                )}>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <TrendingUp className="w-3 h-3" /> Trending
                    </div>
                    <div className="bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10">
                      <Icon className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-2 group-hover:text-bhakti-accent transition-colors">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          {item.author[0]}
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium">{item.author}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-bhakti-accent font-bold bg-bhakti-accent/10 px-2 py-1 rounded-full">
                          ❤️ {item.likes}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-300 font-bold bg-white/5 px-2 py-1 rounded-full">
                          👁️ {item.views || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
