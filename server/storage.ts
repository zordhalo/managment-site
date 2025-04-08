import { 
  users, User, InsertUser, 
  rooms, Room, InsertRoom,
  bookings, Booking, InsertBooking,
  shifts, Shift, InsertShift,
  tasks, Task, InsertTask,
  taskTemplates, TaskTemplate, InsertTaskTemplate,
  notifications, Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  updateRoom(id: number, room: Partial<Room>): Promise<Room | undefined>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(): Promise<Booking[]>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBookingsByRoom(roomId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  
  // Shift operations
  createShift(shift: InsertShift): Promise<Shift>;
  getShifts(): Promise<Shift[]>;
  getShiftsByEmployee(employeeId: number): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  updateShift(id: number, shift: Partial<Shift>): Promise<Shift | undefined>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(): Promise<Task[]>;
  getTasksByShift(shiftId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Task template operations
  createTaskTemplate(taskTemplate: InsertTaskTemplate): Promise<TaskTemplate>;
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplatesByCategory(category: string): Promise<TaskTemplate[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private bookings: Map<number, Booking>;
  private shifts: Map<number, Shift>;
  private tasks: Map<number, Task>;
  private taskTemplates: Map<number, TaskTemplate>;
  private notifications: Map<number, Notification>;
  
  private userId: number;
  private roomId: number;
  private bookingId: number;
  private shiftId: number;
  private taskId: number;
  private taskTemplateId: number;
  private notificationId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.bookings = new Map();
    this.shifts = new Map();
    this.tasks = new Map();
    this.taskTemplates = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.roomId = 1;
    this.bookingId = 1;
    this.shiftId = 1;
    this.taskId = 1;
    this.taskTemplateId = 1;
    this.notificationId = 1;
    
    // Add sample task templates
    this.seedTaskTemplates();
  }

  // Seeds default task templates for each category
  private seedTaskTemplates() {
    const templates = [
      { name: "Restart all computers and clear temporary files", category: "computer_organization", isDefault: true },
      { name: "Update desktop icons and shortcuts", category: "computer_organization", isDefault: true },
      { name: "Verify all computers connect to network", category: "computer_organization", isDefault: true },
      { name: "Test audio on all headsets", category: "computer_organization", isDefault: true },
      { name: "Check disk space on all machines", category: "computer_organization", isDefault: true },
      
      { name: "Update game clients (Steam, Epic, etc.)", category: "game_updates", isDefault: true },
      { name: "Verify game patches are installed", category: "game_updates", isDefault: true },
      { name: "Test launch of popular games", category: "game_updates", isDefault: true },
      { name: "Update game server configurations", category: "game_updates", isDefault: true },
      
      { name: "Inspect VR headset straps", category: "equipment_checks", isDefault: true },
      { name: "Check controller batteries", category: "equipment_checks", isDefault: true },
      { name: "Test VR tracking accuracy", category: "equipment_checks", isDefault: true },
      { name: "Inspect gaming chairs for damage", category: "equipment_checks", isDefault: true },
      { name: "Verify all peripherals are functioning", category: "equipment_checks", isDefault: true },
      
      { name: "Wipe down all surfaces", category: "cleaning", isDefault: true },
      { name: "Clean VR headsets with sanitizing wipes", category: "cleaning", isDefault: true },
      { name: "Vacuum carpeted areas", category: "cleaning", isDefault: true },
      { name: "Empty trash bins", category: "cleaning", isDefault: true },
      { name: "Clean monitors and screens", category: "cleaning", isDefault: true }
    ];
    
    templates.forEach(template => {
      const id = this.taskTemplateId++;
      this.taskTemplates.set(id, { ...template, id });
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Room Methods
  async createRoom(room: InsertRoom): Promise<Room> {
    const id = this.roomId++;
    const newRoom: Room = { ...room, id, isActive: true };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom: Room = { ...room, ...roomData };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  // Booking Methods
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.bookingId++;
    const newBooking: Booking = { 
      ...booking, 
      id, 
      status: "pending", 
      qrCode: this.generateQRCode(id),
      createdAt: new Date()
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getBookingsByRoom(roomId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.roomId === roomId);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = { ...booking, ...bookingData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  // Shift Methods
  async createShift(shift: InsertShift): Promise<Shift> {
    const id = this.shiftId++;
    const newShift: Shift = { ...shift, id, isActive: true };
    this.shifts.set(id, newShift);
    return newShift;
  }

  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async getShiftsByEmployee(employeeId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => shift.employeeId === employeeId);
  }

  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;
    
    const updatedShift: Shift = { ...shift, ...shiftData };
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }
  
  // Task Methods
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const newTask: Task = { 
      ...task, 
      id, 
      isCompleted: false,
      completedAt: null
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByShift(shiftId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.shiftId === shiftId);
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    // If we're marking the task complete, set the completedAt timestamp
    const updatedTask: Task = { 
      ...task, 
      ...taskData,
      completedAt: taskData.isCompleted ? new Date() : task.completedAt
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Task Template Methods
  async createTaskTemplate(taskTemplate: InsertTaskTemplate): Promise<TaskTemplate> {
    const id = this.taskTemplateId++;
    const newTaskTemplate: TaskTemplate = { ...taskTemplate, id, isDefault: false };
    this.taskTemplates.set(id, newTaskTemplate);
    return newTaskTemplate;
  }

  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values());
  }

  async getTaskTemplatesByCategory(category: string): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values()).filter(
      template => template.category === category
    );
  }
  
  // Notification Methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const newNotification: Notification = { 
      ...notification, 
      id, 
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = { ...notification, ...notificationData };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Helper methods
  private generateQRCode(bookingId: number): string {
    // This would be replaced with actual QR code generation logic
    return `booking-qr-${bookingId}`;
  }
}

export const storage = new MemStorage();
