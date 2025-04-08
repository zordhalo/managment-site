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
  Grid
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function PlayerMyBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });
  
  // Get all rooms to display room details
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Mutation for cancelling a booking
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest('PUT', `/api/bookings/${bookingId}/status`, { status: 'cancelled' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      setCancelDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Cancellation failed",
        description: error instanceof Error ? error.message : "Could not cancel booking. Please try again.",
        variant: "destructive",
      });
      setCancelDialogOpen(false);
    }
  });
  
  const handleOpenQrCode = (booking: Booking) => {
    setSelectedBooking(booking);
    setQrCodeDialogOpen(true);
  };
  
  const handleCloseQrCode = () => {
    setQrCodeDialogOpen(false);
  };
  
  const handleOpenCancelDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };
  
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  };
  
  const handleCancelBooking = () => {
    if (selectedBooking) {
      cancelBookingMutation.mutate(selectedBooking.id);
    }
  };
  
  // Helper to get room name by ID
  const getRoomName = (roomId: number) => {
    if (!rooms) return "Loading...";
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? room.name : "Unknown Room";
  };
  
  // Helper for status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };
  
  if (bookingsLoading || roomsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const sortedBookings = [...bookings].sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          My Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your room bookings
        </Typography>
      </Box>
      
      {sortedBookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No bookings found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You haven't made any bookings yet. Start by booking a gaming room!
          </Typography>
          <Button variant="contained" color="primary" href="/player/booking">
            Book a Room
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>Booking ID</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBookings.map((booking: Booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>#{booking.id}</TableCell>
                  <TableCell>{getRoomName(booking.roomId)}</TableCell>
                  <TableCell>{format(new Date(booking.startTime), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)} 
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {booking.status === 'approved' && (
                      <Button 
                        size="small" 
                        onClick={() => handleOpenQrCode(booking)}
                        sx={{ mr: 1 }}
                      >
                        View QR
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenCancelDialog(booking)}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onClose={handleCloseQrCode}>
        <DialogTitle>Booking QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {selectedBooking?.qrCode ? (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Present this QR code when you arrive at the gaming center
                </Typography>
                <Box sx={{ my: 3 }}>
                  <img 
                    src={selectedBooking.qrCode} 
                    alt="Booking QR Code" 
                    style={{ maxWidth: '200px' }} 
                  />
                </Box>
                <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Booking ID
                    </Typography>
                    <Typography variant="body2">
                      #{selectedBooking.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Room
                    </Typography>
                    <Typography variant="body2">
                      {getRoomName(selectedBooking.roomId)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedBooking.startTime), 'MMM d, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedBooking.startTime), 'h:mm a')} - {format(new Date(selectedBooking.endTime), 'h:mm a')}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography>QR code not available</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrCode}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your booking for {getRoomName(selectedBooking?.roomId || 0)} on {selectedBooking ? format(new Date(selectedBooking.startTime), 'MMMM d, yyyy') : ''} at {selectedBooking ? format(new Date(selectedBooking.startTime), 'h:mm a') : ''}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>
            No, Keep Booking
          </Button>
          <Button 
            onClick={handleCancelBooking} 
            color="error"
            disabled={cancelBookingMutation.isPending}
          >
            {cancelBookingMutation.isPending ? "Cancelling..." : "Yes, Cancel Booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
