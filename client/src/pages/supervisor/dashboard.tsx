import { useState } from "react";
import { 
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import { 
  Event as EventIcon,
  Group as GroupIcon,
  MeetingRoom as MeetingRoomIcon,
  PendingActions as PendingActionsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Remove as RemoveIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CleaningServices as CleaningIcon,
  Build as BuildIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room, Booking, Shift, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, isToday, parseISO } from "date-fns";

export default function SupervisorDashboardPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });
  
  // Get all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  // Get all shifts
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts"],
  });
  
  // Mutations for booking approval/rejection
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PUT', `/api/bookings/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking updated",
        description: "Booking status has been updated successfully.",
      });
      handleCloseAllDialogs();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update booking status. Please try again.",
        variant: "destructive",
      });
      handleCloseAllDialogs();
    }
  });
  
  const handleCloseAllDialogs = () => {
    setApprovalDialogOpen(false);
    setRejectionDialogOpen(false);
    setConflictDialogOpen(false);
    setRejectionReason("");
  };
  
  const handleOpenApprovalDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setApprovalDialogOpen(true);
  };
  
  const handleOpenRejectionDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectionDialogOpen(true);
  };
  
  const handleOpenConflictDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setConflictDialogOpen(true);
  };
  
  const handleApproveBooking = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({ id: selectedBooking.id, status: 'approved' });
    }
  };
  
  const handleRejectBooking = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({ id: selectedBooking.id, status: 'rejected' });
    }
  };
  
  // Helper functions
  const getRoomName = (roomId: number) => {
    if (!rooms) return "Loading...";
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? room.name : "Unknown Room";
  };
  
  const getEmployeeName = (employeeId: number) => {
    if (!employees) return "Loading...";
    const employee = employees.find((e: User) => e.id === employeeId);
    return employee ? employee.fullName : "Unassigned";
  };
  
  // Data processing for dashboard
  const calculateStats = () => {
    if (!bookings || !shifts || !rooms) {
      return {
        todayBookings: 0,
        todayBookingsChange: 0,
        staffOnShift: 0,
        staffOnShiftChange: 0,
        roomUtilization: 0,
        roomUtilizationChange: 0,
        pendingApprovals: 0,
        pendingApprovalsChange: 0
      };
    }
    
    // Today's bookings
    const todayBookings = bookings.filter((booking: Booking) => 
      isToday(new Date(booking.startTime)) && 
      (booking.status === 'approved' || booking.status === 'completed')
    ).length;
    
    // Pending approvals
    const pendingApprovals = bookings.filter((booking: Booking) => 
      booking.status === 'pending'
    ).length;
    
    // Staff on shift
    const activeShifts = shifts.filter((shift: Shift) => 
      isToday(new Date(shift.date)) && shift.isActive
    );
    const staffOnShift = activeShifts.length;
    
    // Room utilization
    const activeRooms = new Set(activeShifts.map((shift: Shift) => shift.roomId));
    const roomUtilization = Math.round((activeRooms.size / rooms.length) * 100);
    
    return {
      todayBookings,
      todayBookingsChange: 12, // Mock data for demonstration
      staffOnShift,
      staffOnShiftChange: 0,
      roomUtilization,
      roomUtilizationChange: 5, // Mock data for demonstration
      pendingApprovals,
      pendingApprovalsChange: 8 // Mock data for demonstration
    };
  };
  
  const getActivitiesForRoom = (roomId: number) => {
    if (!bookings || !shifts) return [];
    
    // Get bookings for this room today
    const todayBookingsForRoom = bookings.filter((booking: Booking) => 
      booking.roomId === roomId && 
      isToday(new Date(booking.startTime)) &&
      (booking.status === 'approved' || booking.status === 'completed')
    );
    
    // Get shifts for this room today
    const todayShiftsForRoom = shifts.filter((shift: Shift) => 
      shift.roomId === roomId && 
      isToday(new Date(shift.date))
    );
    
    return {
      currentBooking: todayBookingsForRoom.find((booking: Booking) => {
        const now = new Date();
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);
        return now >= startTime && now < endTime;
      }),
      nextBooking: todayBookingsForRoom.find((booking: Booking) => {
        const now = new Date();
        const startTime = new Date(booking.startTime);
        return startTime > now;
      }),
      assignedStaff: todayShiftsForRoom.length > 0 ? todayShiftsForRoom[0].employeeId : null
    };
  };
  
  // Get room status
  const getRoomStatus = (roomId: number) => {
    const activities = getActivitiesForRoom(roomId);
    
    if (activities.currentBooking) {
      return "in-use";
    } else if (!activities.assignedStaff) {
      return "unassigned";
    } else if (activities.nextBooking) {
      const nextBookingTime = new Date(activities.nextBooking.startTime);
      const now = new Date();
      const timeDiff = Math.floor((nextBookingTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (timeDiff <= 30) {
        return "preparing";
      }
    }
    
    return "vacant";
  };
  
  // Format room status for display
  const getRoomStatusDisplay = (status: string) => {
    switch (status) {
      case "in-use":
        return { label: "In Use", color: "success" };
      case "vacant":
        return { label: "Vacant", color: "error" };
      case "preparing":
        return { label: "Preparing", color: "warning" };
      case "unassigned":
        return { label: "Unassigned", color: "default" };
      case "maintenance":
        return { label: "Maintenance", color: "info" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };
  
  // Filter pending bookings for approval section
  const getPendingBookings = () => {
    if (!bookings) return [];
    
    return bookings
      .filter((booking: Booking) => booking.status === 'pending')
      .slice(0, 5); // Limit to first 5 for dashboard
  };
  
  const stats = calculateStats();
  
  if (bookingsLoading || roomsLoading || employeesLoading || shiftsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Supervisor Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage bookings, shifts, and room utilization
          </Typography>
        </div>
        <Box>
          <Button 
            variant="outlined" 
            sx={{ mr: 2 }}
            href="/supervisor/shifts"
          >
            Assign Shifts
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            href="/supervisor/bookings"
          >
            View All Bookings
          </Button>
        </Box>
      </Box>
      
      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: '50%', color: 'primary.contrastText', mr: 2 }}>
                  <EventIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Today's Bookings</Typography>
                  <Typography variant="h4" component="div">{stats.todayBookings}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography 
                  variant="body2" 
                  color="success.main" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {stats.todayBookingsChange}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  from last week
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: '50%', color: 'success.contrastText', mr: 2 }}>
                  <GroupIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Staff on Shift</Typography>
                  <Typography variant="h4" component="div">{stats.staffOnShift}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <RemoveIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {stats.staffOnShiftChange}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  no change
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 1.5, bgcolor: 'error.light', borderRadius: '50%', color: 'error.contrastText', mr: 2 }}>
                  <MeetingRoomIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Room Utilization</Typography>
                  <Typography variant="h4" component="div">{stats.roomUtilization}%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography 
                  variant="body2" 
                  color="success.main" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {stats.roomUtilizationChange}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 1.5, bgcolor: 'warning.light', borderRadius: '50%', color: 'warning.contrastText', mr: 2 }}>
                  <PendingActionsIcon />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Approvals</Typography>
                  <Typography variant="h4" component="div">{stats.pendingApprovals}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography 
                  variant="body2" 
                  color="error.main" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {stats.pendingApprovalsChange}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  from yesterday
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Room Occupancy View */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Real-time Room Occupancy
        </Typography>
        
        <Grid container spacing={3}>
          {rooms.map((room: Room) => {
            const status = getRoomStatus(room.id);
            const statusDisplay = getRoomStatusDisplay(status);
            const activities = getActivitiesForRoom(room.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {room.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capacity: {room.capacity} players
                      </Typography>
                    </Box>
                    <Chip 
                      label={statusDisplay.label}
                      color={statusDisplay.color as any}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    {status === "in-use" && activities.currentBooking && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <ScheduleIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(parseISO(activities.currentBooking.startTime), 'h:mm a')} - {format(parseISO(activities.currentBooking.endTime), 'h:mm a')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Booking #{activities.currentBooking.id}
                          </Typography>
                        </Box>
                      </>
                    )}
                    
                    {status === "vacant" && activities.nextBooking && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <ScheduleIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Next booking: {format(parseISO(activities.nextBooking.startTime), 'h:mm a')}
                        </Typography>
                      </Box>
                    )}
                    
                    {status === "preparing" && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CleaningIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Status: Preparing for next booking
                        </Typography>
                      </Box>
                    )}
                    
                    {status === "maintenance" && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <BuildIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Under maintenance
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <BadgeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Staff: {activities.assignedStaff ? getEmployeeName(activities.assignedStaff) : "Unassigned"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      
      {/* Pending Approvals */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Booking Approvals
        </Typography>
        
        {getPendingBookings().length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">No pending bookings to approve</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPendingBookings().map((booking: Booking) => {
                  const hasConflict = false; // Implement conflict detection logic if needed
                  
                  return (
                    <TableRow key={booking.id} hover>
                      <TableCell>#{booking.id}</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>{getRoomName(booking.roomId)}</TableCell>
                      <TableCell>
                        {format(parseISO(booking.startTime), 'MMM d, yyyy')} • {format(parseISO(booking.startTime), 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={hasConflict ? "Conflict" : "Pending"}
                          color={hasConflict ? "error" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {hasConflict ? (
                          <Box>
                            <Button 
                              color="primary" 
                              size="small" 
                              onClick={() => handleOpenConflictDialog(booking)}
                              sx={{ mr: 1 }}
                            >
                              Resolve
                            </Button>
                            <Button 
                              color="error" 
                              size="small" 
                              onClick={() => handleOpenRejectionDialog(booking)}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <Button 
                              color="success" 
                              size="small" 
                              onClick={() => handleOpenApprovalDialog(booking)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button 
                              color="error" 
                              size="small" 
                              onClick={() => handleOpenRejectionDialog(booking)}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {getPendingBookings().length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="primary" href="/supervisor/bookings">
              View All Pending Bookings
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={handleCloseAllDialogs}>
        <DialogTitle>Approve Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve booking #{selectedBooking?.id} for {getRoomName(selectedBooking?.roomId || 0)} on {selectedBooking ? format(parseISO(selectedBooking.startTime), 'MMMM d, yyyy') : ''} at {selectedBooking ? format(parseISO(selectedBooking.startTime), 'h:mm a') : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllDialogs}>
            Cancel
          </Button>
          <Button 
            onClick={handleApproveBooking} 
            color="success"
            variant="contained"
            disabled={updateBookingStatusMutation.isPending}
          >
            {updateBookingStatusMutation.isPending ? "Processing..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={handleCloseAllDialogs}>
        <DialogTitle>Reject Booking</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reject booking #{selectedBooking?.id} for {getRoomName(selectedBooking?.roomId || 0)} on {selectedBooking ? format(parseISO(selectedBooking.startTime), 'MMMM d, yyyy') : ''} at {selectedBooking ? format(parseISO(selectedBooking.startTime), 'h:mm a') : ''}?
          </Typography>
          <TextField
            margin="dense"
            label="Reason for rejection (optional)"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllDialogs}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectBooking} 
            color="error"
            variant="contained"
            disabled={updateBookingStatusMutation.isPending}
          >
            {updateBookingStatusMutation.isPending ? "Processing..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictDialogOpen} onClose={handleCloseAllDialogs}>
        <DialogTitle>Resolve Booking Conflict</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This booking conflicts with an existing booking. How would you like to proceed?
          </Typography>
          {/* Additional conflict information can be added here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllDialogs}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectBooking} 
            color="error"
          >
            Reject New Booking
          </Button>
          <Button 
            color="primary"
            variant="contained"
          >
            Suggest Alternative
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
