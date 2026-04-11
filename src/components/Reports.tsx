import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from './ui/button';

const salesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const popularDishes = [
  { name: 'Grilled Salmon', value: 400 },
  { name: 'Beef Steak', value: 300 },
  { name: 'Pasta Carbonara', value: 300 },
  { name: 'Caesar Salad', value: 200 },
];

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74'];

const Reports = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-stone-500 mt-1">Detailed insights into your restaurant's performance.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-stone-200 h-11 gap-2 text-stone-600">
            <Calendar size={18} />
            <span>Last 7 Days</span>
          </Button>
          <Button className="bg-stone-800 hover:bg-stone-900 text-white rounded-xl h-11 gap-2 shadow-lg shadow-stone-100">
            <Download size={18} />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm shadow-stone-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#fdfbf7'}}
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-stone-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800">Popular Dishes</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={popularDishes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {popularDishes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-4">
              {popularDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                    <span className="text-sm font-medium text-stone-600">{dish.name}</span>
                  </div>
                  <span className="text-sm font-bold text-stone-800">{dish.value} orders</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg. Order Value', value: '₹4,250', change: '+5.2%' },
          { label: 'Table Turnover', value: '1.2h', change: '-2.1%' },
          { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.3%' },
          { label: 'Food Waste', value: '3.4%', change: '-1.2%' },
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm shadow-stone-200 rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-stone-500 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold text-stone-800">{stat.value}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
