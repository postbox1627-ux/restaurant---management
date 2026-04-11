import { Timestamp } from 'firebase/firestore';

export type UserRole = 'manager' | 'waiter' | 'chef';

export interface UserProfile {
  uid: string;
  employeeId: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Timestamp;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  waiterId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MenuCategory = 'Starter' | 'Main Course' | 'Drinks' | 'Dessert';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  isAvailable: boolean;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableId?: string;
  dateTime: Timestamp;
  guestsCount: number;
  status: ReservationStatus;
}
