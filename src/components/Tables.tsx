import React, { useEffect, useState } from 'react';
import { Plus, Table as TableIcon, Users, Trash2 } from 'lucide-react';
import { collection, onSnapshot, updateDoc, doc, writeBatch, getDocs, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Table as TableType, TableStatus, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { startOfDay, endOfDay } from 'date-fns';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';

const Tables = () => {
  const { profile } = useAuth();
  const [tables, setTables] = useState<TableType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: 2 });
  
  useEffect(() => {
    const unsubscribeTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableType)).sort((a, b) => parseInt(a.number) - parseInt(b.number)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tables'));

    // Listen to today's confirmed reservations
    const today = new Date();
    const q = query(
      collection(db, 'reservations'),
      where('status', '==', 'confirmed'),
      where('dateTime', '>=', startOfDay(today)),
      where('dateTime', '<=', endOfDay(today))
    );

    const unsubscribeReservations = onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reservations'));

    return () => {
      unsubscribeTables();
      unsubscribeReservations();
    };
  }, []);

  // Auto-update table status based on reservations
  useEffect(() => {
    if (tables.length === 0) return;

    const updateStatuses = async () => {
      const batch = writeBatch(db);
      let hasChanges = false;

      tables.forEach((table) => {
        // We only auto-manage 'available' and 'reserved' statuses. 
        // 'occupied' is managed by active orders.
        if (table.status === 'occupied') return;

        const isReservedToday = reservations.some(res => res.tableId === table.number);

        if (isReservedToday && table.status !== 'reserved') {
          batch.update(doc(db, 'tables', table.id), { status: 'reserved' });
          hasChanges = true;
        } else if (!isReservedToday && table.status === 'reserved') {
          batch.update(doc(db, 'tables', table.id), { status: 'available' });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        try {
          await batch.commit();
        } catch (error) {
          console.error("Error auto-updating table statuses:", error);
        }
      }
    };

    updateStatuses();
  }, [reservations, tables.length]); // We only trigger when reservations change or table list is first loaded

  const updateTableStatus = async (id: string, status: TableStatus) => {
    try {
      await updateDoc(doc(db, 'tables', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tables/${id}`);
    }
  };

  const handleAddTable = async () => {
    if (!newTable.number) return;
    try {
      await addDoc(collection(db, 'tables'), {
        ...newTable,
        status: 'available'
      });
      setIsDialogOpen(false);
      setNewTable({ number: '', capacity: 2 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tables');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Table Management</h2>
          <p className="text-stone-500 mt-1">Monitor table availability and seating capacity.</p>
        </div>
        
        {profile?.role === 'manager' && (
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 gap-2 shadow-lg shadow-orange-100"
                >
                  <Plus size={20} />
                  <span>Add Table</span>
                </Button>
              } />
              <DialogContent className="rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-stone-800">Add New Table</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-600">Table Number</label>
                    <Input 
                      placeholder="e.g. 16" 
                      value={newTable.number}
                      onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                      className="rounded-xl border-stone-200 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-600">Capacity (Seats)</label>
                    <Input 
                      type="number"
                      value={newTable.capacity}
                      onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                      className="rounded-xl border-stone-200 h-12"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleAddTable}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
                  >
                    Create Table
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {tables.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-100">
            <TableIcon size={48} className="text-stone-200 mb-4" />
            <p className="text-stone-500 font-medium">No tables found.</p>
          </div>
        ) : (
          tables.map((table) => (
            <Card 
              key={table.id} 
              className={`border-none shadow-sm shadow-stone-200 rounded-3xl overflow-hidden transition-all duration-300 group ${
                table.status === 'occupied' ? 'bg-orange-50' : 
                table.status === 'reserved' ? 'bg-blue-50' : 
                'bg-white'
              }`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                  table.status === 'occupied' ? 'bg-orange-600 text-white' : 
                  table.status === 'reserved' ? 'bg-blue-600 text-white' : 
                  'bg-stone-100 text-stone-400'
                }`}>
                  <TableIcon size={32} />
                </div>
                
                <h3 className="text-xl font-black text-stone-800 mb-1">Table {table.number}</h3>
                <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-4">
                  <Users size={14} />
                  <span className="font-medium">{table.capacity} Seats</span>
                </div>

                <Badge className={`rounded-full px-3 py-1 border-none text-[10px] font-bold uppercase tracking-wider mb-6 ${
                  table.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                  table.status === 'occupied' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {table.status}
                </Badge>

                <div className="w-full space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Select 
                    value={table.status} 
                    onValueChange={(val: TableStatus) => updateTableStatus(table.id, val)}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-stone-200 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Tables;
