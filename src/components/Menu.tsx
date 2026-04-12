import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Image as ImageIcon } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { MenuItem, MenuCategory } from '../types';
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

const Menu = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // New/Edit Item State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Main Course' as MenuCategory,
    isAvailable: true
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'menu'));

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price)
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'menu', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'menu'), data);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', imageUrl: '', category: 'Main Course', isAvailable: true });
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'menu');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
    }
  };

  const handleClearAll = async () => {
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'menu'));
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error: any) {
      console.error("Clear all error:", error);
      handleFirestoreError(error, OperationType.DELETE, 'menu');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Menu Management</h2>
          <p className="text-stone-500 mt-1">Manage your restaurant's food and drink offerings.</p>
        </div>
        
        {profile?.role === 'manager' && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleClearAll}
              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-12 px-6"
            >
              <Trash2 size={20} className="mr-2" />
              Clear All
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={
                <Button 
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({ name: '', description: '', price: '', imageUrl: '', category: 'Main Course', isAvailable: true });
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 gap-2 shadow-lg shadow-orange-100"
                >
                  <Plus size={20} />
                  <span>Add Item</span>
                </Button>
              } />
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-stone-800">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Item Name</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Grilled Salmon"
                    className="rounded-xl border-stone-200 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Description</label>
                  <Input 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the dish"
                    className="rounded-xl border-stone-200 h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Price (₹)</label>
                    <Input 
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      className="rounded-xl border-stone-200 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Category</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val: MenuCategory) => setFormData({...formData, category: val})}
                    >
                      <SelectTrigger className="rounded-xl border-stone-200 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Main Course">Main Course</SelectItem>
                        <SelectItem value="Drinks">Drinks</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Image URL</label>
                  <Input 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="rounded-xl border-stone-200 h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSave}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
                  disabled={!formData.name || !formData.price}
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="Search menu items..." 
            className="pl-10 bg-white border-stone-200 rounded-xl h-12 focus-visible:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-stone-200 h-12 bg-white">
            <Filter className="mr-2 text-stone-400" size={18} />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-100 shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Starter">Starters</SelectItem>
            <SelectItem value="Main Course">Main Course</SelectItem>
            <SelectItem value="Drinks">Drinks</SelectItem>
            <SelectItem value="Dessert">Dessert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="border-none shadow-sm shadow-stone-200 rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300 bg-white">
            <div className="aspect-video bg-stone-100 relative overflow-hidden">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge className="bg-white/90 backdrop-blur-md text-stone-800 border-none rounded-full px-3 py-1 font-bold shadow-sm">
                  ₹{item.price}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-stone-200 text-stone-500 rounded-full">
                  {item.category}
                </Badge>
                {!item.isAvailable && (
                  <Badge className="bg-rose-100 text-rose-600 border-none text-[10px] font-bold uppercase rounded-full">
                    Sold Out
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">{item.name}</h3>
              <p className="text-sm text-stone-500 line-clamp-2 mb-4 h-10">{item.description || 'No description provided.'}</p>
              
              {profile?.role === 'manager' && (
                <div className="flex gap-2 pt-2 border-t border-stone-50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setEditingItem(item);
                      setFormData({
                        name: item.name,
                        description: item.description || '',
                        price: item.price.toString(),
                        imageUrl: item.imageUrl || '',
                        category: item.category,
                        isAvailable: item.isAvailable
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Menu;
