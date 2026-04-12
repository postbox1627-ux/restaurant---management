import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Utensils
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Order, Table, MenuItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';

const data = [
  { name: 'Mon', revenue: 4000, orders: 24 },
  { name: 'Tue', revenue: 3000, orders: 18 },
  { name: 'Wed', revenue: 2000, orders: 15 },
  { name: 'Thu', revenue: 2780, orders: 20 },
  { name: 'Fri', revenue: 1890, orders: 12 },
  { name: 'Sat', revenue: 2390, orders: 25 },
  { name: 'Sun', revenue: 3490, orders: 30 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <Card className="border-none shadow-sm shadow-stone-200 rounded-2xl overflow-hidden">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {trendValue}%
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-stone-800">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { profile } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeTables, setActiveTables] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);

  const seedData = async () => {
    const batch = writeBatch(db);
    
    // Clear existing menu and tables to ensure clean state
    const menuSnapshot = await getDocs(collection(db, 'menu'));
    menuSnapshot.docs.forEach(d => batch.delete(d.ref));

    const tablesSnapshot = await getDocs(collection(db, 'tables'));
    tablesSnapshot.docs.forEach(d => batch.delete(d.ref));

    // Add some menu items
    const menuItems = [
      { name: 'Grilled Salmon', price: 1200, category: 'Main Course', isAvailable: true, description: 'Fresh Atlantic salmon with herbs' },
      { name: 'Caesar Salad', price: 450, category: 'Starter', isAvailable: true, description: 'Classic romaine with parmesan' },
      { name: 'Red Wine', price: 800, category: 'Drinks', isAvailable: true, description: 'House special cabernet' },
      { name: 'Chocolate Lava Cake', price: 350, category: 'Dessert', isAvailable: true, description: 'Warm cake with molten center' }
    ];

    menuItems.forEach(item => {
      const newDoc = doc(collection(db, 'menu'));
      batch.set(newDoc, item);
    });

    // Add some tables: 10 with 2 seats, 5 with 4 seats
    for (let i = 1; i <= 15; i++) {
      const newDoc = doc(collection(db, 'tables'));
      batch.set(newDoc, { 
        number: i.toString().padStart(2, '0'), 
        capacity: i <= 10 ? 2 : 4, 
        status: 'available' 
      });
    }

    try {
      await batch.commit();
    } catch (error: any) {
      console.error("Error seeding data:", error);
      handleFirestoreError(error, OperationType.CREATE, 'menu');
    }
  };

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const tablesQuery = query(collection(db, 'tables'), where('status', '==', 'occupied'));
    const unsubscribeTables = onSnapshot(tablesQuery, (snapshot) => {
      setActiveTables(snapshot.size);
    });

    const pendingQuery = query(collection(db, 'orders'), where('status', 'in', ['pending', 'preparing']));
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      setPendingOrders(snapshot.size);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
      unsubscribePending();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Dashboard Overview</h2>
          <p className="text-stone-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        {profile?.role === 'manager' && (
          
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="₹1,28,450" 
          icon={DollarSign} 
          trend="up" 
          trendValue="12.5" 
          color="bg-orange-600"
        />
        <StatCard 
          title="Total Orders" 
          value="156" 
          icon={ShoppingBag} 
          trend="up" 
          trendValue="8.2" 
          color="bg-blue-600"
        />
        <StatCard 
          title="Active Tables" 
          value={activeTables} 
          icon={Utensils} 
          trend="down" 
          trendValue="3.1" 
          color="bg-emerald-600"
        />
        <StatCard 
          title="Pending Orders" 
          value={pendingOrders} 
          icon={Clock} 
          trend="up" 
          trendValue="5.4" 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm shadow-stone-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-stone-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.length === 0 ? (
                <p className="text-center text-stone-400 py-8">No recent orders found.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                        {order.tableId.slice(-2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-800">Table {order.tableId}</p>
                        <p className="text-xs text-stone-500">{order.items.length} items • ₹{order.totalAmount}</p>
                      </div>
                    </div>
                    <Badge className={`rounded-full px-3 py-1 border-none ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
