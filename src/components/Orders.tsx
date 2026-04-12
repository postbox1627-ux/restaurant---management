import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Utensils,
  Trash2,
  Printer
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, MenuItem, Table as TableType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';

const Orders = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // New Order State
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [orderItems, setOrderItems] = useState<{menuItemId: string, quantity: number, notes: string}[]>([]);

  // Bill Generation State
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const menuUnsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    const tablesUnsubscribe = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableType)).sort((a, b) => parseInt(a.number) - parseInt(b.number)));
    });

    return () => {
      unsubscribe();
      menuUnsubscribe();
      tablesUnsubscribe();
    };
  }, []);

  const handleCreateOrder = async () => {
    if (!selectedTable || orderItems.length === 0 || !profile) return;

    const items = orderItems.map(oi => {
      const menu = menuItems.find(m => m.id === oi.menuItemId);
      return {
        menuItemId: oi.menuItemId,
        name: menu?.name || '',
        quantity: oi.quantity,
        price: menu?.price || 0,
        notes: oi.notes
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder = {
      tableId: selectedTable,
      items,
      status: 'pending' as OrderStatus,
      totalAmount,
      waiterId: profile.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      
      // Update table status to occupied
      const tableToUpdate = tables.find(t => t.number === selectedTable);
      if (tableToUpdate) {
        await updateDoc(doc(db, 'tables', tableToUpdate.id), { status: 'occupied' });
      }

      const createdOrder: Order = {
        id: docRef.id,
        ...newOrder
      };

      setIsNewOrderOpen(false);
      setSelectedTable('');
      setOrderItems([]);

      // Show bill dialog after confirming order
      setSelectedOrderForBill(createdOrder);
      setIsBillDialogOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updatedAt: Timestamp.now()
      };
      await updateDoc(doc(db, 'orders', orderId), updateData);

      // If completing order, release table
      if (newStatus === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const tableToUpdate = tables.find(t => t.number === order.tableId);
          if (tableToUpdate) {
            await updateDoc(doc(db, 'tables', tableToUpdate.id), { status: 'available' });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const orderToCancel = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      
      // Update table status back to available if it was occupied by this order
      if (orderToCancel) {
        const tableToUpdate = tables.find(t => t.number === orderToCancel.tableId);
        if (tableToUpdate) {
          await updateDoc(doc(db, 'tables', tableToUpdate.id), { status: 'available' });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const activeTableIds = orders
    .filter(order => order.status !== 'completed')
    .map(order => order.tableId);

  const availableTables = tables.filter(table => 
    table.status === 'available' && !activeTableIds.includes(table.number)
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.tableId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-stone-400" />;
      case 'preparing': return <ChefHat size={16} className="text-amber-500" />;
      case 'served': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'completed': return <CheckCircle2 size={16} className="text-stone-500" />;
      case 'cancelled': return <Trash2 size={16} className="text-rose-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Orders Management</h2>
          <p className="text-stone-500 mt-1">Track and manage customer orders in real-time.</p>
        </div>
        
        {profile?.role !== 'chef' && (
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 gap-2 shadow-lg shadow-orange-100">
                <Plus size={20} />
                <span>New Order</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-stone-800">Create New Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Select Table</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="rounded-xl border-stone-200 h-12">
                      <SelectValue placeholder="Choose a table" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                      {availableTables.map(table => (
                        <SelectItem key={table.id} value={table.number}>Table {table.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Add Items</label>
                  <div className="flex gap-2">
                    <Select onValueChange={(val) => {
                      const existing = orderItems.find(i => i.menuItemId === val);
                      if (existing) {
                        setOrderItems(orderItems.map(i => i.menuItemId === val ? {...i, quantity: i.quantity + 1} : i));
                      } else {
                        setOrderItems([...orderItems, {menuItemId: val, quantity: 1, notes: ''}]);
                      }
                    }}>
                      <SelectTrigger className="rounded-xl border-stone-200 h-12">
                        <SelectValue placeholder="Select menu item" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                        {menuItems.filter(m => m.isAvailable).map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name} - ₹{item.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ScrollArea className="h-[200px] rounded-xl border border-stone-100 p-4">
                  <div className="space-y-4">
                    {orderItems.map((item, idx) => {
                      const menu = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-4 bg-stone-50 p-3 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-stone-800">{menu?.name}</p>
                            <p className="text-xs text-stone-500">₹{menu?.price} each</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg"
                              onClick={() => setOrderItems(orderItems.map((oi, i) => i === idx ? {...oi, quantity: Math.max(1, oi.quantity - 1)} : oi))}
                            >
                              -
                            </Button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg"
                              onClick={() => setOrderItems(orderItems.map((oi, i) => i === idx ? {...oi, quantity: oi.quantity + 1} : oi))}
                            >
                              +
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600"
                              onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateOrder}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
                  disabled={!selectedTable || orderItems.length === 0}
                >
                  Confirm Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="Search by table number..." 
            className="pl-10 bg-white border-stone-200 rounded-xl h-12 focus-visible:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-stone-200 h-12 bg-white">
            <Filter className="mr-2 text-stone-400" size={18} />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-100 shadow-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="served">Served</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-none shadow-sm shadow-stone-200 rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg">
                  {order.tableId}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-stone-800">Order #{order.id.slice(-4)}</CardTitle>
                  <p className="text-xs text-stone-400">{order.createdAt.toDate().toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`rounded-full px-3 py-1 border-none flex items-center gap-1.5 ${
                  order.status === 'completed' ? 'bg-stone-100 text-stone-600' :
                  order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                  order.status === 'served' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                  'bg-stone-100 text-stone-400'
                }`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-stone-600 font-medium">
                        <span className="text-orange-600 font-bold mr-2">{item.quantity}x</span>
                        {item.name}
                      </span>
                      <span className="text-stone-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-stone-800">Total Amount</span>
                  <span className="text-lg font-black text-orange-600">₹{order.totalAmount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {order.status === 'pending' && profile?.role !== 'waiter' && (
                    <Button 
                      className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && profile?.role !== 'waiter' && (
                    <Button 
                      className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                      onClick={async () => {
                        await updateOrderStatus(order.id, 'completed');
                        await addDoc(collection(db, 'notifications'), {
                          tableId: order.tableId,
                          orderId: order.id,
                          message: `Order #${order.id.slice(-4)} for Table ${order.tableId} is ready to serve!`,
                          read: false,
                          createdAt: Timestamp.now()
                        });
                      }}
                    >
                      Order Ready
                    </Button>
                  )}
                  {profile?.role === 'manager' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <Button 
                      variant="ghost" 
                      className="col-span-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      onClick={() => cancelOrder(order.id)}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-stone-800 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Utensils size={24} />
            </div>
            <h2 className="text-xl font-bold">Savory Bill</h2>
            <p className="text-stone-400 text-xs">Table {selectedOrderForBill?.tableId} • Order #{selectedOrderForBill?.id.slice(-4)}</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              {selectedOrderForBill?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-stone-600">
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="font-medium text-stone-800">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-stone-200 space-y-2">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span>₹{selectedOrderForBill?.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Tax (0%)</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-stone-800">Total</span>
                <span className="text-2xl font-black text-orange-600">₹{selectedOrderForBill?.totalAmount}</span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Thank you for dining with us!</p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col gap-2">
            <Button 
              onClick={() => {
                window.print();
                setIsBillDialogOpen(false);
                setSelectedOrderForBill(null);
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-orange-100 gap-2"
            >
              <Printer size={18} />
              Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
