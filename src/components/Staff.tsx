import React, { useEffect, useState } from 'react';
import { Plus, User, Mail, Shield, Trash2, Edit2, UserPlus, Hash, Loader2 } from 'lucide-react';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from './ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const Staff = () => {
  const { profile, registerStaff } = useAuth();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('waiter');
  
  // Create Staff State
  const [createData, setCreateData] = useState({
    employeeId: '',
    name: '',
    role: 'waiter' as UserRole
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, []);

  const handleCreateStaff = async () => {
    if (!createData.employeeId || !createData.name) return;
    setCreateLoading(true);
    try {
      await registerStaff(createData.employeeId, createData.name, createData.role);
      setIsCreateDialogOpen(false);
      setCreateData({ employeeId: '', name: '', role: 'waiter' });
    } catch (error: any) {
      alert('Failed to create staff: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingStaff) return;
    try {
      await updateDoc(doc(db, 'users', editingStaff.uid), { role: newRole });
      setIsDialogOpen(false);
      setEditingStaff(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editingStaff.uid}`);
    }
  };

  const handleDeleteStaff = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Staff Management</h2>
          <p className="text-stone-500 mt-1">Manage your team members and their access roles.</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-orange-100 gap-2"
        >
          <UserPlus size={18} />
          <span>Add New Staff</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.uid} className="border-none shadow-sm shadow-stone-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-14 w-14 border-2 border-stone-50 shadow-sm">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-lg">
                    {member.name?.charAt(0) || member.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-stone-800 truncate">{member.name || 'Staff Member'}</h3>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                      <Hash size={12} />
                      <span className="truncate">{member.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                      <Mail size={12} />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl mb-6">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-orange-600" />
                  <span className="text-sm font-bold text-stone-700 capitalize">{member.role}</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold border-stone-200 text-stone-400">
                  Active
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  className="flex-1 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    setEditingStaff(member);
                    setNewRole(member.role);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 size={16} className="mr-2" />
                  Change Role
                </Button>
                <Button 
                  variant="ghost"
                  className="rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDeleteStaff(member.uid)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-stone-800">Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input 
                id="create-name"
                placeholder="Enter staff name"
                className="rounded-xl border-stone-200 h-12"
                value={createData.name}
                onChange={(e) => setCreateData({...createData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-id">Employee ID</Label>
              <Input 
                id="create-id"
                placeholder="e.g. 2026WAT05"
                className="rounded-xl border-stone-200 h-12 uppercase"
                value={createData.employeeId}
                onChange={(e) => setCreateData({...createData, employeeId: e.target.value})}
              />
              <p className="text-[10px] text-stone-400">Password will be set to the Employee ID by default.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select value={createData.role} onValueChange={(val: UserRole) => setCreateData({...createData, role: val})}>
                <SelectTrigger className="rounded-xl border-stone-200 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateStaff}
              disabled={createLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
            >
              {createLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-stone-800">Update Staff Role</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                  {editingStaff?.name?.charAt(0) || editingStaff?.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-stone-800">{editingStaff?.name}</p>
                <p className="text-xs text-stone-500">{editingStaff?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Select New Role</label>
              <Select value={newRole} onValueChange={(val: UserRole) => setNewRole(val)}>
                <SelectTrigger className="rounded-xl border-stone-200 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-stone-100 shadow-xl">
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleUpdateRole}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
