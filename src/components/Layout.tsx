import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Table as TableIcon, 
  CalendarDays, 
  Users, 
  BarChart3, 
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface Notification {
  id: string;
  tableId: string;
  orderId: string;
  message: string;
  read: boolean;
  createdAt: any;
}

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean 
}> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
        : 'text-stone-500 hover:bg-orange-50 hover:text-orange-600'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { profile, logout, loading } = useAuth();
  
  const menuItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['manager'] },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Orders', roles: ['manager', 'waiter', 'chef'] },
    { to: '/tables', icon: <TableIcon size={20} />, label: 'Tables', roles: ['manager'] },
    { to: '/menu', icon: <UtensilsCrossed size={20} />, label: 'Menu', roles: ['manager', 'waiter', 'chef'] },
    { to: '/reservations', icon: <CalendarDays size={20} />, label: 'Reservations', roles: ['manager', 'waiter'] },
    { to: '/staff', icon: <Users size={20} />, label: 'Staff', roles: ['manager'] },
    { to: '/reports', icon: <BarChart3 size={20} />, label: 'Reports', roles: ['manager'] },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  return (
    <aside className="w-64 bg-[#eeeeee] border-r border-stone-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
          <UtensilsCrossed size={24} />
        </div>
        <h1 className="text-xl font-bold text-stone-800 tracking-tight">Savory</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex flex-col gap-2 px-4 py-8 items-center justify-center text-stone-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
            <p className="text-xs">Loading profile...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-stone-400">
            <p className="text-xs">No access permissions found.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))
        )}
      </nav>

      <div className="p-4 border-t border-stone-100">
        <div className="bg-stone-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                {profile?.name?.charAt(0) || profile?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-800 truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-stone-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

// ── Toast component ────────────────────────────────────────────────────────────
const Toast = ({ notif, onClose }: { notif: Notification; onClose: () => void }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 5s
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  return (
    <div
      className={`transition-all duration-400 ease-in-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl shadow-stone-300 border border-stone-100 overflow-hidden w-80">
        <div className="flex items-start gap-3 p-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">
              Order Ready 🍽️
            </p>
            <p className="text-sm font-semibold text-stone-800 leading-snug">
              {notif.message}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {notif.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {/* Close */}
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
            className="text-stone-300 hover:text-stone-500 transition-colors mt-0.5 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        {/* Progress bar — shrinks over 5s */}
        <div className="h-1 bg-stone-100">
          <div
            className="h-full bg-emerald-500 origin-left"
            style={{
              animation: 'shrinkBar 5s linear forwards'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ── Layout ─────────────────────────────────────────────────────────────────────
const Layout = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  // Listen to unread notifications
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(fetched);

      // Find truly new ones (not seen before in this session)
      const newOnes = fetched.filter(n => !prevIdsRef.current.has(n.id));
      if (newOnes.length > 0) {
        setToasts(prev => [...prev, ...newOnes]);
        newOnes.forEach(n => prevIdsRef.current.add(n.id));
      }
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllRead = async () => {
    await Promise.all(notifications.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <div className="flex min-h-screen bg-[#eeeeee]">
      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#eeeeee] backdrop-blur-md border-b border-stone-100 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input 
                placeholder="Search anything..." 
                className="pl-10 bg-stone-50 border-none rounded-xl focus-visible:ring-orange-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4" ref={notifRef}>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-stone-500 hover:bg-stone-50 relative"
                onClick={() => setIsNotifOpen(prev => !prev)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 rounded-full border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Bell Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-stone-200 border border-stone-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-800 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge className="bg-orange-100 text-orange-600 border-none rounded-full text-[10px] px-2">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-orange-600 font-semibold hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-stone-400">
                        <Bell size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="flex items-start gap-3 px-5 py-4 border-b border-stone-50 hover:bg-stone-50 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800">{notif.message}</p>
                            <p className="text-xs text-stone-400 mt-0.5">
                              {notif.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button onClick={() => markAsRead(notif.id)} className="text-stone-300 hover:text-stone-500 transition-colors mt-0.5">
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* ── Toast Stack (bottom-right) ── */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 items-end">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            notif={toast}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Layout;
