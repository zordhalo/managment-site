import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles enum
export const userRoleEnum = pgEnum('user_role', ['player', 'employee', 'supervisor']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("player"),
});

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  equipment: json("equipment").$type<string[]>().notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed, cancelled
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shifts table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Task categories enum
export const taskCategoryEnum = pgEnum('task_category', [
  'computer_organization', 
  'game_updates', 
  'equipment_checks', 
  'cleaning'
]);

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull().references(() => shifts.id),
  name: text("name").notNull(),
  category: taskCategoryEnum("category").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

// Task templates for predefined tasks
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: taskCategoryEnum("category").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull(), // booking, shift, system
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true 
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  isActive: true
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  qrCode: true,
  status: true
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  isActive: true
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  isCompleted: true,
  completedAt: true
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  isDefault: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
