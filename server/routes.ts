import express, { Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertRoomSchema,
  insertBookingSchema,
  insertShiftSchema,
  insertTaskSchema,
  insertTaskTemplateSchema,
  insertNotificationSchema
} from "@shared/schema";
import { authenticate, authorize, register, login, hashPassword } from "./auth";
import QRCode from "qrcode";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const user = await register(userData);
      res.status(201).json({ 
        message: "User registered successfully",
        userId: user.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const { user, token } = await login(username, password);
      
      res.status(200).json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getRooms();
      res.status(200).json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rooms", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/rooms/:id", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const updatedRoom = await storage.updateRoom(roomId, req.body);
      res.status(200).json(updatedRoom);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Booking routes
  app.post("/api/bookings", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      
      // Check if requested time is available
      const existingBookings = await storage.getBookingsByRoom(bookingData.roomId);
      const requestedStart = new Date(bookingData.startTime);
      const requestedEnd = new Date(bookingData.endTime);
      
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        
        // Check for time overlap
        return (
          (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
          (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
          (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
        ) && booking.status !== "rejected" && booking.status !== "cancelled";
      });
      
      if (hasConflict) {
        return res.status(400).json({ message: "Selected time slot is not available" });
      }
      
      const booking = await storage.createBooking(bookingData);
      
      // Generate QR code for the booking
      const qrData = JSON.stringify({
        bookingId: booking.id,
        room: booking.roomId,
        time: booking.startTime
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      // Update booking with QR code
      const updatedBooking = await storage.updateBooking(booking.id, { qrCode });
      
      // Create notification for supervisors
      const supervisors = (await storage.getUsers()).filter(u => u.role === "supervisor");
      
      for (const supervisor of supervisors) {
        await storage.createNotification({
          userId: supervisor.id,
          message: `New booking #${booking.id} requires approval`,
          type: "booking"
        });
      }
      
      // Create notification for user
      await storage.createNotification({
        userId: bookingData.userId,
        message: `Your booking #${booking.id} has been created and is pending approval`,
        type: "booking"
      });
      
      res.status(201).json(updatedBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookings", authenticate, async (req: Request, res: Response) => {
    try {
      let bookings;
      
      // Players can only see their own bookings
      if (req.user?.role === "player") {
        bookings = await storage.getBookingsByUser(req.user.id);
      } 
      // Employees should see bookings for their assigned rooms
      else if (req.user?.role === "employee") {
        const shifts = await storage.getShiftsByEmployee(req.user.id);
        const roomIds = [...new Set(shifts.map(shift => shift.roomId))];
        
        bookings = [];
        for (const roomId of roomIds) {
          const roomBookings = await storage.getBookingsByRoom(roomId);
          bookings.push(...roomBookings);
        }
      } 
      // Supervisors can see all bookings
      else {
        bookings = await storage.getBookings();
      }
      
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookings/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Players can only see their own bookings
      if (req.user?.role === "player" && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "You do not have permission to view this booking" });
      }
      
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/bookings/:id/status", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const updatedBooking = await storage.updateBooking(bookingId, { status });
      
      // Create notification for the booking owner
      await storage.createNotification({
        userId: booking.userId,
        message: `Your booking #${booking.id} has been ${status}`,
        type: "booking"
      });
      
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shift routes
  app.post("/api/shifts", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      
      // Validate employee is actually an employee
      const user = await storage.getUser(shiftData.employeeId);
      
      if (!user || user.role !== "employee") {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const shift = await storage.createShift(shiftData);
      
      // Create tasks from templates for this shift
      const defaultTemplates = await storage.getTaskTemplates();
      
      for (const template of defaultTemplates) {
        if (template.isDefault) {
          await storage.createTask({
            shiftId: shift.id,
            name: template.name,
            category: template.category
          });
        }
      }
      
      // Create notification for the employee
      await storage.createNotification({
        userId: shiftData.employeeId,
        message: `You have been assigned a new shift on ${new Date(shift.date).toLocaleDateString()}`,
        type: "shift"
      });
      
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/shifts", authenticate, async (req: Request, res: Response) => {
    try {
      let shifts;
      
      // Employees can only see their own shifts
      if (req.user?.role === "employee") {
        shifts = await storage.getShiftsByEmployee(req.user.id);
      } 
      // Supervisors can see all shifts
      else if (req.user?.role === "supervisor") {
        shifts = await storage.getShifts();
      } 
      // Players should not have access to shifts
      else {
        return res.status(403).json({ message: "You do not have permission to view shifts" });
      }
      
      res.status(200).json(shifts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/shifts/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const shiftId = parseInt(req.params.id);
      const shift = await storage.getShift(shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Employees can only see their own shifts
      if (req.user?.role === "employee" && shift.employeeId !== req.user.id) {
        return res.status(403).json({ message: "You do not have permission to view this shift" });
      }
      
      res.status(200).json(shift);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/shifts/:id", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const shiftId = parseInt(req.params.id);
      const shift = await storage.getShift(shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      const updatedShift = await storage.updateShift(shiftId, req.body);
      
      // If employee has changed, send notification
      if (req.body.employeeId && req.body.employeeId !== shift.employeeId) {
        await storage.createNotification({
          userId: req.body.employeeId,
          message: `You have been assigned a shift on ${new Date(shift.date).toLocaleDateString()}`,
          type: "shift"
        });
      }
      
      res.status(200).json(updatedShift);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Task routes
  app.get("/api/tasks/current", authenticate, authorize(["employee"]), async (req: Request, res: Response) => {
    try {
      // Get the employee's active shifts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const shifts = await storage.getShiftsByEmployee(req.user!.id);
      const activeShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === today.getTime() && shift.isActive;
      });
      
      if (activeShifts.length === 0) {
        return res.status(404).json({ message: "No active shifts found for today" });
      }
      
      // Get tasks for the active shift (taking the first one if multiple exist)
      const activeShift = activeShifts[0];
      const tasks = await storage.getTasksByShift(activeShift.id);
      
      res.status(200).json({
        shift: activeShift,
        tasks
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/shifts/:id/tasks", authenticate, async (req: Request, res: Response) => {
    try {
      const shiftId = parseInt(req.params.id);
      const shift = await storage.getShift(shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Employees can only see their own tasks
      if (req.user?.role === "employee" && shift.employeeId !== req.user.id) {
        return res.status(403).json({ message: "You do not have permission to view these tasks" });
      }
      
      const tasks = await storage.getTasksByShift(shiftId);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checklist", authenticate, authorize(["employee"]), async (req: Request, res: Response) => {
    try {
      const { taskId, isCompleted } = req.body;
      
      if (taskId === undefined || isCompleted === undefined) {
        return res.status(400).json({ message: "Task ID and completion status are required" });
      }
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify this task belongs to the employee's shift
      const shift = await storage.getShift(task.shiftId);
      
      if (!shift || shift.employeeId !== req.user!.id) {
        return res.status(403).json({ message: "You do not have permission to update this task" });
      }
      
      const updatedTask = await storage.updateTask(taskId, { 
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      });
      
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tasks", authenticate, authorize(["supervisor", "employee"]), async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      
      // Verify the shift exists
      const shift = await storage.getShift(taskData.shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Employees can only add tasks to their own shifts
      if (req.user?.role === "employee" && shift.employeeId !== req.user.id) {
        return res.status(403).json({ message: "You do not have permission to add tasks to this shift" });
      }
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Task template routes
  app.get("/api/task-templates", authenticate, async (req: Request, res: Response) => {
    try {
      let templates;
      
      if (req.query.category) {
        templates = await storage.getTaskTemplatesByCategory(req.query.category as string);
      } else {
        templates = await storage.getTaskTemplates();
      }
      
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/task-templates", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const templateData = insertTaskTemplateSchema.parse(req.body);
      const template = await storage.createTaskTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticate, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticate, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.updateNotification(notificationId, { isRead: true });
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/employees", authenticate, authorize(["supervisor"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      const employees = users.filter(user => user.role === "employee");
      
      // Don't send password
      const sanitizedEmployees = employees.map(employee => {
        const { password, ...sanitized } = employee;
        return sanitized;
      });
      
      res.status(200).json(sanitizedEmployees);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/current-user", authenticate, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password
      const { password, ...sanitizedUser } = user;
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // For development - add a test user for each role
  if (process.env.NODE_ENV !== "production") {
    const createTestUsersIfNeeded = async () => {
      // Check if users already exist
      const users = await storage.getUsers();
      if (users.length > 0) return;
      
      const hashedPassword = await hashPassword("password123");
      
      // Create test supervisor
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@test.com",
        fullName: "Admin User",
        role: "supervisor",
        phone: "555-1234"
      });
      
      // Create test employee
      await storage.createUser({
        username: "staff",
        password: hashedPassword,
        email: "staff@test.com",
        fullName: "Staff User",
        role: "employee",
        phone: "555-5678"
      });
      
      // Create test player
      await storage.createUser({
        username: "player",
        password: hashedPassword,
        email: "player@test.com",
        fullName: "Player User",
        role: "player",
        phone: "555-9012"
      });
      
      // Create sample room
      await storage.createRoom({
        name: "VR Arena 1",
        capacity: 6,
        equipment: ["HTC Vive", "Valve Index"],
        hourlyRate: 45,
        description: "Our premium VR room with the latest equipment"
      });
      
      await storage.createRoom({
        name: "Racing Sim Room",
        capacity: 4,
        equipment: ["Racing Simulator", "4K Displays"],
        hourlyRate: 50,
        description: "Professional racing simulator experience"
      });
      
      await storage.createRoom({
        name: "PC Gaming Arena",
        capacity: 10,
        equipment: ["RTX 3080", "144Hz Monitors"],
        hourlyRate: 35,
        description: "Group gaming room with high-end PCs"
      });
    };
    
    createTestUsersIfNeeded();
  }

  return httpServer;
}
