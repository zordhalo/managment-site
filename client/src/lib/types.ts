export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "player" | "employee" | "supervisor";
  phone?: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  equipment: string[];
  hourlyRate: number;
  description?: string;
  isActive: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  qrCode?: string;
  createdAt: string;
}

export interface Shift {
  id: number;
  employeeId: number;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Task {
  id: number;
  shiftId: number;
  name: string;
  category: "computer_organization" | "game_updates" | "equipment_checks" | "cleaning";
  isCompleted: boolean;
  completedAt: string | null;
}

export interface TaskTemplate {
  id: number;
  name: string;
  category: "computer_organization" | "game_updates" | "equipment_checks" | "cleaning";
  isDefault: boolean;
}

export interface Notification {
  id: number;
  userId: number;
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

export interface AuthResponse {
  token: string;
  user: User;
}

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
