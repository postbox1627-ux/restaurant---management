import React, { useEffect, useState } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Phone, User, Clock, Trash2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, Timestamp, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Reservation, ReservationStatus, Table as TableType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

const Reservations = () => {
  const { profile } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    dateTime: new Date(),
    reservationTime: '12:00',
    reservationAmPm: 'AM' as 'AM' | 'PM',
    tableId: '',
    guestsCount: '2',
    status: 'confirmed' as ReservationStatus
  });

  useEffect(() => {
    const q = query(collection(db, 'reservations'), orderBy('dateTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reservations'));

    const tablesUnsubscribe = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableType)).sort((a, b) => parseInt(a.number) - parseInt(b.number)));
    });

    return () => {
      unsubscribe();
      tablesUnsubscribe();
    };
  }, []);

  const handleSave = async () => {
    let [hours, minutes] = formData.reservationTime.split(':').map(Number);
    const ampm = formData.reservationAmPm;
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const reservationDate = new Date(formData.dateTime);
    reservationDate.setHours(hours, minutes, 0, 0);

    const data = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      dateTime: Timestamp.fromDate(reservationDate),
      tableId: formData.tableId,
      guestsCount: parseInt(formData.guestsCount),
      status: formData.status
    };

    try {
      await addDoc(collection(db, 'reservations'), data);
      
      const tableToUpdate = tables.find(t => t.number === formData.tableId);
      if (tableToUpdate) {
        await updateDoc(doc(db, 'tables', tableToUpdate.id), { status: 'reserved' });
      }

      setIsDialogOpen(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        dateTime: new Date(),
        reservationTime: '12:00',
        reservationAmPm: 'AM' as 'AM' | 'PM',
        tableId: '',
        guestsCount: '2',
        status: 'confirmed' as ReservationStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reservations');
    }
  };

  const updateStatus = async (id: string, status: ReservationStatus) => {
    try {
      const resToUpdate = reservations.find(r => r.id === id);
      await updateDoc(doc(db, 'reservations', id), { status });
      
      if (resToUpdate && resToUpdate.tableId) {
        const tableToUpdate = tables.find(t => t.number === resToUpdate.tableId);
        if (tableToUpdate) {
          let newTableStatus: any = 'available';
          if (status === 'confirmed') newTableStatus = 'reserved';
          if (status === 'completed') newTableStatus = 'occupied';
          await updateDoc(doc(db, 'tables', tableToUpdate.id), { status: newTableStatus });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reservations/${id}`);
    }
  };

  const handleClearAll = async () => {
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'reservations'));
      snapshot.docs.forEach(d => batch.delete(d.ref));
      const reservedTables = tables.filter(t => t.status === 'reserved');
      reservedTables.forEach(t => {
        batch.update(doc(db, 'tables', t.id), { status: 'available' });
      });
      await batch.commit();
    } catch (error: any) {
      console.error("Clear all reservations error:", error);
      handleFirestoreError(error, OperationType.DELETE, 'reservations');
    }
  };

  const filteredReservations = reservations.filter(res => 
    res.customerName.toLowerCase().includes(search.toLowerCase()) ||
    res.customerPhone?.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Reservations</h2>
          <p className="text-stone-500 mt-1">Manage table bookings and customer schedules.</p>
        </div>
        
        <div className="flex gap-2">
          {profile?.role === 'manager' && (
            <Button 
              onClick={handleClearAll}
              variant="outline"
              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-12 px-6 gap-2"
            >
              <Trash2 size={20} />
              <span>Clear All</span>
            </Button>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 gap-2 shadow-lg shadow-orange-100">
                <Plus size={20} />
                <span>New Booking</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-stone-800">New Reservation</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Customer Name</label>
                    <Input 
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="John Doe"
                      className="rounded-xl border-stone-200 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Phone Number</label>
                    <Input 
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="+1 234 567 890"
                      className="rounded-xl border-stone-200 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Guests Count</label>
                    <Input 
                      type="number"
                      value={formData.guestsCount}
                      onChange={(e) => setFormData({...formData, guestsCount: e.target.value})}
                      className="rounded-xl border-stone-200 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Reservation Time</label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.reservationTime.split(':')[0]}
                        onValueChange={(h) => {
                          const mins = formData.reservationTime.split(':')[1] || '00';
                          setFormData({...formData, reservationTime: `${h}:${mins}`});
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-stone-200 h-11 flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-stone-100 shadow-xl max-h-48">
                          {['12','01','02','03','04','05','06','07','08','09','10','11'].map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={formData.reservationTime.split(':')[1] || '00'}
                        onValueChange={(m) => {
                          const hrs = formData.reservationTime.split(':')[0] || '12';
                          setFormData({...formData, reservationTime: `${hrs}:${m}`});
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-stone-200 h-11 w-20">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-stone-100 shadow-xl max-h-48">
                          {['00','15','30','45'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={formData.reservationAmPm}
                        onValueChange={(val: 'AM' | 'PM') => setFormData({...formData, reservationAmPm: val})}
                      >
                        <SelectTrigger className="rounded-xl border-stone-200 h-11 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Select Table</label>
                    <Select value={formData.tableId} onValueChange={(val) => setFormData({...formData, tableId: val})}>
                      <SelectTrigger className="rounded-xl border-stone-200 h-11">
                        <SelectValue placeholder="Choose a table" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                        {tables.map(table => (
                          <SelectItem key={table.id} value={table.number}>Table {table.number} ({table.capacity} seats)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.dateTime}
                    onSelect={(date) => date && setFormData({...formData, dateTime: date})}
                    className="rounded-xl border border-stone-100 p-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSave}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
                  disabled={!formData.customerName}
                >
                  Confirm Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <Input 
          placeholder="Search by name or phone..." 
          className="pl-10 bg-white border-stone-200 rounded-xl h-12 focus-visible:ring-orange-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReservations.map((res) => (
          <Card key={res.id} className="border-none shadow-sm shadow-stone-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-800">{res.customerName}</h3>
                    <div className="flex items-center gap-2 text-stone-400 text-xs mt-1">
                      <CalendarIcon size={12} />
                      <span>{format(res.dateTime.toDate(), 'PPP')}</span>
                      <Clock size={12} className="ml-1" />
                      <span>{format(res.dateTime.toDate(), 'p')}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`rounded-full px-3 py-1 border-none text-[10px] font-bold uppercase tracking-wider ${
                  res.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  res.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {res.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-stone-50 p-3 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Guests</p>
                  <p className="text-sm font-bold text-stone-800">{res.guestsCount} Persons</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Table</p>
                  <p className="text-sm font-bold text-stone-800">{res.tableId ? `Table ${res.tableId}` : 'N/A'}</p>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Contact</p>
                  <div className="flex items-center gap-3 text-sm font-bold text-stone-800">
                    <Phone size={14} className="text-stone-400" />
                    <span>{res.customerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {res.status === 'confirmed' && (
                  <>
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
                      onClick={() => updateStatus(res.id, 'completed')}
                    >
                      Check-in
                    </Button>
                    <Button 
                      variant="ghost"
                      className="flex-1 text-rose-500 hover:bg-rose-50 rounded-xl h-10"
                      onClick={() => updateStatus(res.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {res.status !== 'confirmed' && (
                  <Button 
                    variant="ghost"
                    className="w-full text-stone-400 hover:bg-stone-50 rounded-xl h-10"
                    disabled
                  >
                    Booking {res.status}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reservations;
