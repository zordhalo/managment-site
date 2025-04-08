import { useState } from "react";
import { 
  Typography,
  Box,
  Paper,
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
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, Room, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bookings-tabpanel-${index}`}
      aria-labelledby={`bookings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SupervisorBookingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [roomFilter, setRoomFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
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
  
  // Get all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/employees", {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) return null;
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });
  
  // Mutation for updating booking status
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
  
  const handleCompleteBooking = (booking: Booking) => {
    updateBookingStatusMutation.mutate({ id: booking.id, status: 'completed' });
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Helper functions
  const getRoomName = (roomId: number) => {
    if (!rooms) return "Loading...";
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? room.name : "Unknown Room";
  };
  
  const getUserName = (userId: number) => {
    if (!users) return "Loading...";
    const user = users.find((u: User) => u.id === userId);
    return user ? user.fullName : "Unknown User";
  };
  
  // Filter bookings based on current tab and filters
  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    let filtered = [...bookings];
    
    // Apply status filter based on tab
    switch (tabValue) {
      case 0: // All bookings
        break;
      case 1: // Pending
        filtered = filtered.filter(booking => booking.status === 'pending');
        break;
      case 2: // Approved
        filtered = filtered.filter(booking => booking.status === 'approved');
        break;
      case 3: // Completed
        filtered = filtered.filter(booking => booking.status === 'completed');
        break;
      case 4: // Rejected/Cancelled
        filtered = filtered.filter(booking => booking.status === 'rejected' || booking.status === 'cancelled');
        break;
    }
    
    // Apply additional filters
    if (roomFilter) {
      filtered = filtered.filter(booking => booking.roomId === roomFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };
  
  // Get status chip properties
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'warning' };
      case 'approved':
        return { label: 'Approved', color: 'success' };
      case 'rejected':
        return { label: 'Rejected', color: 'error' };
      case 'completed':
        return { label: 'Completed', color: 'info' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'default' };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'default' };
    }
  };
  
  if (bookingsLoading || roomsLoading || usersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const filteredBookings = getFilteredBookings();
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Manage Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, approve, and manage all room bookings
        </Typography>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="room-filter-label">Room</InputLabel>
              <Select
                labelId="room-filter-label"
                id="room-filter"
                value={roomFilter}
                label="Room"
                onChange={e => setRoomFilter(e.target.value as number | "")}
              >
                <MenuItem value="">All Rooms</MenuItem>
                {rooms.map((room: Room) => (
                  <MenuItem key={room.id} value={room.id}>{room.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={e => setStatusFilter(e.target.value)}
                disabled={tabValue !== 0} // Disable when tab already filters by status
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="date-filter"
              label="Date"
              type="date"
              size="small"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Booking Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Bookings" />
          <Tab label={`Pending (${bookings.filter(b => b.status === 'pending').length})`} />
          <Tab label={`Approved (${bookings.filter(b => b.status === 'approved').length})`} />
          <Tab label="Completed" />
          <Tab label="Rejected/Cancelled" />
        </Tabs>
        
        <TabPanel value={tabValue} index={tabValue}>
          {filteredBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No bookings found</Typography>
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
                  {filteredBookings.map((booking) => {
                    const statusChip = getStatusChip(booking.status);
                    
                    return (
                      <TableRow key={booking.id} hover>
                        <TableCell>#{booking.id}</TableCell>
                        <TableCell>{getUserName(booking.userId)}</TableCell>
                        <TableCell>{getRoomName(booking.roomId)}</TableCell>
                        <TableCell>
                          {format(parseISO(booking.startTime), 'MMM d, yyyy')} • {format(parseISO(booking.startTime), 'h:mm a')} - {format(parseISO(booking.endTime), 'h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={statusChip.label}
                            color={statusChip.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {booking.status === 'pending' && (
                            <>
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
                            </>
                          )}
                          
                          {booking.status === 'approved' && (
                            <Button 
                              color="info" 
                              size="small" 
                              onClick={() => handleCompleteBooking(booking)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
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
    </Box>
  );
}
