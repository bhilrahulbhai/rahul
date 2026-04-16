import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Star,
  MessageSquare,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  MoreVertical,
  Ban,
  UserCheck,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminStats {
  users: number;
  content: number;
  views: number;
  pending: number;
  reports: number;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  username: string;
  avatar: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  created_at: string;
}

interface AdminContent {
  id: number;
  title: string;
  type: string;
  url: string;
  thumbnail: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: number;
  created_at: string;
}

interface AdminReport {
  id: number;
  reporter_id: number;
  reporter_name: string;
  target_type: string;
  target_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export const AdminDashboard = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'content' | 'reports' | 'settings'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [content, setContent] = useState<AdminContent[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await fetch('/api/admin/analytics');
        setStats(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        setUsers(await res.json());
      } else if (activeTab === 'content') {
        const res = await fetch('/api/admin/content');
        setContent(await res.json());
      } else if (activeTab === 'reports') {
        const res = await fetch('/api/admin/reports');
        setReports(await res.json());
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        setSettings(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, activeTab]);

  const handleUserStatus = async (userId: number, status: 'active' | 'banned') => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleContentStatus = async (contentId: number, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/content/${contentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeatured = async (contentId: number, isFeatured: boolean) => {
    try {
      await fetch(`/api/admin/content/${contentId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await fetch(`/api/admin/content/${contentId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bhakti-bg flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-bhakti-card border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-bhakti-accent rounded-xl flex items-center justify-center shadow-lg shadow-bhakti-accent/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Admin</h2>
            <p className="text-xs text-gray-500">Dashboard Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'reports', label: 'Reports', icon: AlertTriangle },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                activeTab === item.id 
                  ? "bg-bhakti-accent text-white shadow-lg shadow-bhakti-accent/20" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
          >
            <X className="w-5 h-5" />
            Exit Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-bhakti-card/50 backdrop-blur-md">
          <h1 className="text-xl font-bold capitalize">{activeTab}</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-bhakti-accent transition-all w-64"
              />
            </div>
            <button className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-bhakti-accent" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'analytics' && stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Users', value: stats.users, icon: Users, color: 'blue' },
                      { label: 'Total Content', value: stats.content, icon: FileText, color: 'purple' },
                      { label: 'Total Views', value: stats.views, icon: BarChart3, color: 'green' },
                      { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'orange' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-bhakti-card p-6 rounded-3xl border border-white/10 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("p-3 rounded-2xl", `bg-${stat.color}-500/10`)}>
                            <stat.icon className={cn("w-6 h-6", `text-${stat.color}-500`)} />
                          </div>
                          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">+12%</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="bg-bhakti-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Joined</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                <div>
                                  <p className="font-bold text-sm">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
                                user.role === 'admin' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                              )}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
                                user.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {user.status === 'active' ? (
                                  <button 
                                    onClick={() => handleUserStatus(user.id, 'banned')}
                                    className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                                    title="Ban User"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUserStatus(user.id, 'active')}
                                    className="p-2 hover:bg-green-500/10 text-gray-500 hover:text-green-500 rounded-xl transition-all"
                                    title="Unban User"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button className="p-2 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl transition-all">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {content.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                      <div key={item.id} className="bg-bhakti-card rounded-3xl border border-white/10 overflow-hidden shadow-xl group">
                        <div className="relative aspect-video">
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {item.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleContentStatus(item.id, 'approved')}
                                  className="p-3 bg-green-500 rounded-full text-white hover:scale-110 transition-transform"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleContentStatus(item.id, 'rejected')}
                                  className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleFeatured(item.id, !item.is_featured)}
                              className={cn(
                                "p-3 rounded-full hover:scale-110 transition-transform",
                                item.is_featured ? "bg-yellow-500 text-white" : "bg-white/20 text-white"
                              )}
                            >
                              <Star className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteContent(item.id)}
                              className="p-3 bg-red-600 rounded-full text-white hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest backdrop-blur-md",
                              item.status === 'approved' ? "bg-green-500/20 text-green-500" : 
                              item.status === 'pending' ? "bg-orange-500/20 text-orange-500" : "bg-red-500/20 text-red-500"
                            )}>
                              {item.status}
                            </span>
                            {item.is_featured === 1 && (
                              <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest backdrop-blur-md">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">by {item.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="bg-bhakti-card p-6 rounded-3xl border border-white/10 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">Reported {report.target_type}</h3>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
                                report.status === 'pending' ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                              )}>
                                {report.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">Reason: {report.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">Reported by {report.reporter_name} on {new Date(report.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleResolveReport(report.id, 'resolved')}
                                className="px-4 py-2 bg-green-500/10 text-green-500 text-sm font-bold rounded-xl hover:bg-green-500 hover:text-white transition-all"
                              >
                                Resolve
                              </button>
                              <button 
                                onClick={() => handleResolveReport(report.id, 'dismissed')}
                                className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="max-w-2xl bg-bhakti-card rounded-3xl border border-white/10 p-8 shadow-xl space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-bhakti-accent" />
                        General Settings
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">App Name</label>
                          <input 
                            type="text"
                            value={settings.appName || 'BhaktiSagar'}
                            onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Support Email</label>
                          <input 
                            type="email"
                            value={settings.supportEmail || 'support@bhaktisagar.com'}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-bhakti-accent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-bhakti-accent" />
                        Feature Toggles
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'enableChat', label: 'Global Chat Room' },
                          { key: 'enableUploads', label: 'User Uploads' },
                          { key: 'enableComments', label: 'Content Comments' },
                          { key: 'requireApproval', label: 'Require Approval for Uploads' },
                        ].map((toggle) => (
                          <div key={toggle.key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-sm font-medium">{toggle.label}</span>
                            <button 
                              onClick={() => setSettings({ ...settings, [toggle.key]: settings[toggle.key] === 'true' ? 'false' : 'true' })}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings[toggle.key] === 'true' ? "bg-bhakti-accent" : "bg-gray-700"
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                settings[toggle.key] === 'true' ? "left-7" : "left-1"
                              )} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleSaveSettings}
                        className="w-full bg-bhakti-accent py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-bhakti-accent/20"
                      >
                        Save All Settings
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};
