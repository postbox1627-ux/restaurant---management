import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Table as TableIcon, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  Search,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';

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
    <aside className="w-64 bg-white border-r border-stone-100 flex flex-col h-screen sticky top-0">
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

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-[#eeeeee]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input 
                placeholder="Search anything..." 
                className="pl-10 bg-stone-50 border-none rounded-xl focus-visible:ring-orange-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl text-stone-500 hover:bg-stone-50 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-white"></span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-stone-500 hover:bg-stone-50">
              <Settings size={20} />
            </Button>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
