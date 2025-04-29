export interface User {
  id: string; // Changed to string for Firebase UIDs
  username: string;
  fullName: string;
  email: string;
  role: "player" | "employee" | "supervisor";
  phone?: string;
  createdAt?: string;
}

export interface Room {
  id: string; // Changed to string for Firestore document IDs
  name: string;
  capacity: number;
  equipment: string[];
  hourlyRate: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Booking {
  id: string; // Changed to string for Firestore document IDs
  userId: string; // Changed to string for Firebase UIDs
  roomId: string; // Changed to string for Firestore document IDs
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  qrCode?: string;
  createdAt: string;
  specialRequests?: string;
}

export interface Shift {
  id: string; // Changed to string for Firestore document IDs
  employeeId: string; // Changed to string for Firebase UIDs
  roomId: string; // Changed to string for Firestore document IDs
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Task {
  id: string; // Changed to string for Firestore document IDs
  shiftId: string; // Changed to string for Firestore document IDs
  name: string;
  category: "computer_organization" | "game_updates" | "equipment_checks" | "cleaning";
  isCompleted: boolean;
  completedAt: string | null;
  createdAt?: string;
}

export interface TaskTemplate {
  id: string; // Changed to string for Firestore document IDs
  name: string;
  category: "computer_organization" | "game_updates" | "equipment_checks" | "cleaning";
  isDefault: boolean;
}

export interface Notification {
  id: string; // Changed to string for Firestore document IDs
  userId: string; // Changed to string for Firebase UIDs
  message: string;
  type: "booking" | "shift" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price: number;
}

export interface RoomFilterOptions {
  equipment: string | null;
  capacity: string | null;
  priceRange: string | null;
}

// Removed AuthResponse interface as it's no longer needed with Firebase Auth

export interface TaskProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface CurrentTaskData {
  shift: Shift;
  tasks: Task[];
}

export interface BookingWithRoomDetails extends Booking {
  room?: Room;
}

export interface ShiftWithRoomDetails extends Shift {
  room?: Room;
  employee?: User;
}
