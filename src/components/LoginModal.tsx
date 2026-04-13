import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<{ 
    googleClientId: string | null, 
    isConfigured: boolean 
  } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/config');
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        console.error('Failed to fetch auth config:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onLogin(event.data.user);
        onClose();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin, onClose]);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Guest login failed');
      onLogin(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!config?.googleClientId) {
      setError('Google Login is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.');
      return;
    }
    setError('');
    const popup = window.open('about:blank', 'google_login', 'width=500,height=600');
    if (!popup) {
      setError('Popup blocked! Please allow popups for this site.');
      return;
    }

    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get Google auth URL');
      if (!data.url) throw new Error('No URL returned from server');
      
      // Use location.replace to avoid history issues
      popup.location.replace(data.url);
    } catch (err: any) {
      console.error('Failed to get Google auth URL:', err);
      setError(err.message || 'Failed to initialize Google login');
      popup.close();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, name, username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      onLogin(data);
      onClose();
    } catch (error: any) {
      setError(error.message);
      console.error('Auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-bhakti-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bhakti-accent/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-bhakti-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-gray-400 text-sm">{isLogin ? 'Continue your spiritual journey' : 'Join the divine community'}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <User className="w-4 h-4" /> Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-bhakti-accent transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <User className="w-4 h-4" /> Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                          <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="^[a-z0-9_]+$"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                            placeholder="username"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-9 pr-4 focus:outline-none focus:border-bhakti-accent transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 px-2">3-20 characters, lowercase, numbers and underscores only</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email or Username
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com or username"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-bhakti-accent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-bhakti-accent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-bhakti-accent rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-bhakti-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3 text-white shadow-xl"
                >
                  <Sparkles className="w-5 h-5 text-bhakti-accent" />
                  Quick Access (Guest)
                </button>
              </form>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  title="Google Login"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="text-center space-y-4">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-sm text-bhakti-accent hover:underline font-medium"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  BhaktiSagar • Divine Connection
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
