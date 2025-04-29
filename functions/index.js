const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Cloud Function to send notifications when booking status changes
exports.onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const bookingId = context.params.bookingId;
    const oldData = change.before.data();
    const newData = change.after.data();
    
    // Check if status has changed
    if (newData.status !== oldData.status) {
      // Create notification for the user
      await db.collection('notifications').add({
        userId: newData.userId,
        message: `Your booking #${bookingId} has been ${newData.status}`,
        type: "booking",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // If booking is approved, notify employees assigned to the room
      if (newData.status === 'approved') {
        // Get room information
        const roomId = newData.roomId;
        
        // Get the shifts that cover this booking's time
        const startTime = new Date(newData.startTime);
        const bookingDate = startTime.toISOString().split('T')[0]; // Get just the date part
        
        const shiftsSnapshot = await db.collection('shifts')
          .where('roomId', '==', roomId)
          .where('date', '==', bookingDate)
          .get();
        
        // For each shift covering this booking, notify the employee
        for (const shiftDoc of shiftsSnapshot.docs) {
          const shift = shiftDoc.data();
          const shiftStartTime = new Date(shift.startTime);
          const shiftEndTime = new Date(shift.endTime);
          
          // Check if booking falls within shift time
          if (startTime >= shiftStartTime && startTime < shiftEndTime) {
            await db.collection('notifications').add({
              userId: shift.employeeId,
              message: `New booking approved for room ${roomId} during your shift on ${bookingDate}`,
              type: "shift",
              isRead: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    }
  });

// Cloud Function to generate tasks when a new shift is created
exports.onShiftCreate = functions.firestore
  .document('shifts/{shiftId}')
  .onCreate(async (snapshot, context) => {
    const shiftId = context.params.shiftId;
    const shiftData = snapshot.data();
    
    // Get default task templates
    const templatesSnapshot = await db.collection('taskTemplates')
      .where('isDefault', '==', true)
      .get();
    
    // Create tasks for this shift based on templates
    const taskPromises = templatesSnapshot.docs.map(templateDoc => {
      const template = templateDoc.data();
      return db.collection('tasks').add({
        shiftId: shiftId,
        name: template.name,
        category: template.category,
        isCompleted: false,
        completedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await Promise.all(taskPromises);
    
    // Create notification for the employee
    await db.collection('notifications').add({
      userId: shiftData.employeeId,
      message: `You have been assigned a new shift on ${new Date(shiftData.date).toLocaleDateString()}`,
      type: "shift",
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Cloud Function to handle task completion statistics
exports.onTaskUpdate = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const oldData = change.before.data();
    const newData = change.after.data();
    
    // If task was just marked as completed
    if (!oldData.isCompleted && newData.isCompleted) {
      const shiftId = newData.shiftId;
      
      // Get shift information
      const shiftDoc = await db.collection('shifts').doc(shiftId).get();
      
      if (shiftDoc.exists) {
        const shift = shiftDoc.data();
        
        // Notify supervisor that a task was completed
        const supervisorsSnapshot = await db.collection('users')
          .where('role', '==', 'supervisor')
          .get();
        
        for (const supervisorDoc of supervisorsSnapshot.docs) {
          await db.collection('notifications').add({
            userId: supervisorDoc.id,
            message: `Task "${newData.name}" completed for room ${shift.roomId}`,
            type: "system",
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
  });