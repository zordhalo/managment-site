import { 
  addDoc, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp,
  orderBy,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  User, 
  Room, 
  Booking, 
  Shift, 
  Task, 
  TaskTemplate,
  Notification 
} from "./types";
import { generateQRCode } from "./utils";

// Helper to convert Firestore timestamp to string
const timestampToString = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to convert Firestore document to typed object
const convertDoc = <T>(doc: any): T => {
  const data = doc.data();
  
  // Convert all timestamp fields to strings
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = timestampToString(data[key]);
    }
  });
  
  return {
    id: doc.id,
    ...data
  } as T;
};

// ==================== User Operations ==================== //

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;
    return convertDoc<User>(userDoc);
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    return convertDoc<User>(querySnapshot.docs[0]);
  } catch (error) {
    console.error("Error fetching user by username:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => convertDoc<User>(doc));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getEmployees = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<User>(doc));
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// ==================== Room Operations ==================== //

export const createRoom = async (roomData: Omit<Room, "id" | "createdAt">): Promise<Room> => {
  try {
    const docRef = await addDoc(collection(db, "rooms"), {
      ...roomData,
      createdAt: serverTimestamp()
    });
    
    const roomDoc = await getDoc(docRef);
    return convertDoc<Room>(roomDoc);
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const getRooms = async (): Promise<Room[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "rooms"));
    return querySnapshot.docs.map(doc => convertDoc<Room>(doc));
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomDoc = await getDoc(doc(db, "rooms", roomId));
    if (!roomDoc.exists()) return null;
    return convertDoc<Room>(roomDoc);
  } catch (error) {
    console.error("Error fetching room:", error);
    throw error;
  }
};

export const updateRoom = async (roomId: string, roomData: Partial<Room>): Promise<Room> => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, roomData);
    
    const updatedDoc = await getDoc(roomRef);
    return convertDoc<Room>(updatedDoc);
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
};

// ==================== Booking Operations ==================== //

export const createBooking = async (
  bookingData: Omit<Booking, "id" | "createdAt" | "status" | "qrCode">
): Promise<Booking> => {
  try {
    // Check for booking conflicts
    const conflicts = await checkBookingConflicts(
      bookingData.roomId,
      bookingData.startTime,
      bookingData.endTime
    );
    
    if (conflicts) {
      throw new Error("Selected time slot is not available");
    }
    
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      status: "pending",
      createdAt: serverTimestamp()
    });
    
    // Generate QR Code
    const qrCodeData = JSON.stringify({
      bookingId: docRef.id,
      room: bookingData.roomId,
      time: bookingData.startTime
    });
    
    const qrCode = await generateQRCode(qrCodeData);
    
    // Update booking with QR code
    await updateDoc(docRef, { qrCode });
    
    // Create notification for supervisors
    const supervisorsQuery = query(
      collection(db, "users"),
      where("role", "==", "supervisor")
    );
    
    const supervisorDocs = await getDocs(supervisorsQuery);
    
    supervisorDocs.forEach(async (supervisorDoc) => {
      await addDoc(collection(db, "notifications"), {
        userId: supervisorDoc.id,
        message: `New booking #${docRef.id} requires approval`,
        type: "booking",
        isRead: false,
        createdAt: serverTimestamp()
      });
    });
    
    // Create notification for user
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.userId,
      message: `Your booking has been created and is pending approval`,
      type: "booking",
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    const bookingDoc = await getDoc(docRef);
    return convertDoc<Booking>(bookingDoc);
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

const checkBookingConflicts = async (
  roomId: string, 
  startTime: string, 
  endTime: string
): Promise<boolean> => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const q = query(
    collection(db, "bookings"),
    where("roomId", "==", roomId),
    where("status", "in", ["pending", "approved"])
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.some(doc => {
    const booking = doc.data();
    const bookingStart = booking.startTime instanceof Timestamp 
      ? booking.startTime.toDate() 
      : new Date(booking.startTime);
      
    const bookingEnd = booking.endTime instanceof Timestamp 
      ? booking.endTime.toDate() 
      : new Date(booking.endTime);
    
    return (
      (start >= bookingStart && start < bookingEnd) ||
      (end > bookingStart && end <= bookingEnd) ||
      (start <= bookingStart && end >= bookingEnd)
    );
  });
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "bookings"), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
  } catch (error) {
    console.error("Error fetching bookings by user:", error);
    throw error;
  }
};

export const getBookingsByRoom = async (roomId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("roomId", "==", roomId),
      orderBy("startTime")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Booking>(doc));
  } catch (error) {
    console.error("Error fetching bookings by room:", error);
    throw error;
  }
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingDoc.exists()) return null;
    return convertDoc<Booking>(bookingDoc);
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

export const updateBookingStatus = async (
  bookingId: string, 
  status: Booking["status"]
): Promise<Booking> => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error("Booking not found");
    }
    
    await updateDoc(bookingRef, { status });
    
    // Create notification for the user
    const bookingData = bookingDoc.data();
    
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.userId,
      message: `Your booking has been ${status}`,
      type: "booking",
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(bookingRef);
    return convertDoc<Booking>(updatedDoc);
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

// ==================== Shift Operations ==================== //

export const createShift = async (
  shiftData: Omit<Shift, "id" | "createdAt" | "isActive">
): Promise<Shift> => {
  try {
    const docRef = await addDoc(collection(db, "shifts"), {
      ...shiftData,
      isActive: true,
      createdAt: serverTimestamp()
    });
    
    // Create default tasks for this shift
    const templateQuery = query(
      collection(db, "taskTemplates"),
      where("isDefault", "==", true)
    );
    
    const templateSnapshot = await getDocs(templateQuery);
    
    templateSnapshot.forEach(async (templateDoc) => {
      const template = templateDoc.data();
      
      await addDoc(collection(db, "tasks"), {
        shiftId: docRef.id,
        name: template.name,
        category: template.category,
        isCompleted: false,
        completedAt: null,
        createdAt: serverTimestamp()
      });
    });
    
    // Create notification for the employee
    await addDoc(collection(db, "notifications"), {
      userId: shiftData.employeeId,
      message: `You have been assigned a new shift on ${new Date(shiftData.date).toLocaleDateString()}`,
      type: "shift",
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    const shiftDoc = await getDoc(docRef);
    return convertDoc<Shift>(shiftDoc);
  } catch (error) {
    console.error("Error creating shift:", error);
    throw error;
  }
};

export const getShifts = async (): Promise<Shift[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "shifts"), orderBy("date"))
    );
    return querySnapshot.docs.map(doc => convertDoc<Shift>(doc));
  } catch (error) {
    console.error("Error fetching shifts:", error);
    throw error;
  }
};

export const getShiftsByEmployee = async (employeeId: string): Promise<Shift[]> => {
  try {
    const q = query(
      collection(db, "shifts"),
      where("employeeId", "==", employeeId),
      orderBy("date")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Shift>(doc));
  } catch (error) {
    console.error("Error fetching shifts by employee:", error);
    throw error;
  }
};

export const getShift = async (shiftId: string): Promise<Shift | null> => {
  try {
    const shiftDoc = await getDoc(doc(db, "shifts", shiftId));
    if (!shiftDoc.exists()) return null;
    return convertDoc<Shift>(shiftDoc);
  } catch (error) {
    console.error("Error fetching shift:", error);
    throw error;
  }
};

export const updateShift = async (shiftId: string, shiftData: Partial<Shift>): Promise<Shift> => {
  try {
    const shiftRef = doc(db, "shifts", shiftId);
    const shiftDoc = await getDoc(shiftRef);
    
    if (!shiftDoc.exists()) {
      throw new Error("Shift not found");
    }
    
    await updateDoc(shiftRef, shiftData);
    
    // If employee has changed, send notification
    if (shiftData.employeeId && shiftData.employeeId !== shiftDoc.data().employeeId) {
      await addDoc(collection(db, "notifications"), {
        userId: shiftData.employeeId,
        message: `You have been assigned a shift on ${shiftData.date ? 
          new Date(shiftData.date).toLocaleDateString() : 
          new Date(shiftDoc.data().date).toLocaleDateString()}`,
        type: "shift",
        isRead: false,
        createdAt: serverTimestamp()
      });
    }
    
    const updatedDoc = await getDoc(shiftRef);
    return convertDoc<Shift>(updatedDoc);
  } catch (error) {
    console.error("Error updating shift:", error);
    throw error;
  }
};

// ==================== Task Operations ==================== //

export const createTask = async (
  taskData: Omit<Task, "id" | "createdAt" | "isCompleted" | "completedAt">
): Promise<Task> => {
  try {
    const docRef = await addDoc(collection(db, "tasks"), {
      ...taskData,
      isCompleted: false,
      completedAt: null,
      createdAt: serverTimestamp()
    });
    
    const taskDoc = await getDoc(docRef);
    return convertDoc<Task>(taskDoc);
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "tasks"));
    return querySnapshot.docs.map(doc => convertDoc<Task>(doc));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const getTasksByShift = async (shiftId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, "tasks"),
      where("shiftId", "==", shiftId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Task>(doc));
  } catch (error) {
    console.error("Error fetching tasks by shift:", error);
    throw error;
  }
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const taskDoc = await getDoc(doc(db, "tasks", taskId));
    if (!taskDoc.exists()) return null;
    return convertDoc<Task>(taskDoc);
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
};

export const updateTask = async (
  taskId: string, 
  taskData: Partial<Task>
): Promise<Task> => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error("Task not found");
    }
    
    const updateData = { ...taskData };
    
    // If we're marking the task complete, set the completedAt timestamp
    if (taskData.isCompleted === true && !taskData.completedAt) {
      updateData.completedAt = new Date().toISOString();
    }
    
    await updateDoc(taskRef, updateData);
    
    const updatedDoc = await getDoc(taskRef);
    return convertDoc<Task>(updatedDoc);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// ==================== Task Template Operations ==================== //

export const createTaskTemplate = async (
  templateData: Omit<TaskTemplate, "id">
): Promise<TaskTemplate> => {
  try {
    const docRef = await addDoc(collection(db, "taskTemplates"), templateData);
    const templateDoc = await getDoc(docRef);
    return convertDoc<TaskTemplate>(templateDoc);
  } catch (error) {
    console.error("Error creating task template:", error);
    throw error;
  }
};

export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "taskTemplates"));
    return querySnapshot.docs.map(doc => convertDoc<TaskTemplate>(doc));
  } catch (error) {
    console.error("Error fetching task templates:", error);
    throw error;
  }
};

export const getTaskTemplatesByCategory = async (
  category: string
): Promise<TaskTemplate[]> => {
  try {
    const q = query(
      collection(db, "taskTemplates"),
      where("category", "==", category)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<TaskTemplate>(doc));
  } catch (error) {
    console.error("Error fetching task templates by category:", error);
    throw error;
  }
};

// ==================== Notification Operations ==================== //

export const createNotification = async (
  notificationData: Omit<Notification, "id" | "createdAt" | "isRead">
): Promise<Notification> => {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    const notificationDoc = await getDoc(docRef);
    return convertDoc<Notification>(notificationDoc);
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const getNotificationsByUser = async (
  userId: string
): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Notification>(doc));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const updateNotification = async (
  notificationId: string,
  notificationData: Partial<Notification>
): Promise<Notification> => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, notificationData);
    
    const updatedDoc = await getDoc(notificationRef);
    return convertDoc<Notification>(updatedDoc);
  } catch (error) {
    console.error("Error updating notification:", error);
    throw error;
  }
};

// ==================== Helper Functions ==================== //

export const seedDefaultData = async (): Promise<void> => {
  try {
    // Check if data already exists
    const roomsSnapshot = await getDocs(collection(db, "rooms"));
    if (!roomsSnapshot.empty) return;
    
    // Seed task templates
    const templates = [
      { name: "Restart all computers", category: "computer_organization", isDefault: true },
      { name: "Update desktop icons", category: "computer_organization", isDefault: true },
      { name: "Verify network connections", category: "computer_organization", isDefault: true },
      { name: "Test audio on headsets", category: "computer_organization", isDefault: true },
      { name: "Check disk space", category: "computer_organization", isDefault: true },
      
      { name: "Update game clients", category: "game_updates", isDefault: true },
      { name: "Verify game patches", category: "game_updates", isDefault: true },
      { name: "Test launch popular games", category: "game_updates", isDefault: true },
      { name: "Update server configs", category: "game_updates", isDefault: true },
      
      { name: "Inspect VR headset straps", category: "equipment_checks", isDefault: true },
      { name: "Check controller batteries", category: "equipment_checks", isDefault: true },
      { name: "Test VR tracking", category: "equipment_checks", isDefault: true },
      { name: "Inspect gaming chairs", category: "equipment_checks", isDefault: true },
      { name: "Verify peripherals functioning", category: "equipment_checks", isDefault: true },
      
      { name: "Wipe down surfaces", category: "cleaning", isDefault: true },
      { name: "Sanitize VR headsets", category: "cleaning", isDefault: true },
      { name: "Vacuum carpet", category: "cleaning", isDefault: true },
      { name: "Empty trash bins", category: "cleaning", isDefault: true },
      { name: "Clean monitors", category: "cleaning", isDefault: true }
    ];
    
    for (const template of templates) {
      await addDoc(collection(db, "taskTemplates"), template);
    }
    
    console.log("Default task templates seeded");
    
    // Add sample rooms if needed
    const rooms = [
      {
        name: "VR Arena 1",
        capacity: 6,
        equipment: ["HTC Vive", "Valve Index"],
        hourlyRate: 45,
        description: "Our premium VR room with the latest equipment",
        isActive: true
      },
      {
        name: "Racing Sim Room",
        capacity: 4,
        equipment: ["Racing Simulator", "4K Displays"],
        hourlyRate: 50,
        description: "Professional racing simulator experience",
        isActive: true
      },
      {
        name: "PC Gaming Arena",
        capacity: 10,
        equipment: ["RTX 3080", "144Hz Monitors"],
        hourlyRate: 20,
        description: "High-end PC gaming stations",
        isActive: true
      }
    ];
    
    for (const room of rooms) {
      await addDoc(collection(db, "rooms"), {
        ...room,
        createdAt: serverTimestamp()
      });
    }
    
    console.log("Sample rooms seeded");
  } catch (error) {
    console.error("Error seeding default data:", error);
    throw error;
  }
};