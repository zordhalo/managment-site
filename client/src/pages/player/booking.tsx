import { useState, useEffect } from "react";
import { 
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room, Booking, RoomFilterOptions, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RoomFilter from "@/components/ui/room-filter";
import RoomCarousel from "@/components/ui/room-carousel";
import BookingCalendar from "@/components/ui/booking-calendar";
import { format } from "date-fns";

export default function PlayerBookingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [specialRequests, setSpecialRequests] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [newBookingId, setNewBookingId] = useState<number | null>(null);
  
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [filters, setFilters] = useState<RoomFilterOptions>({
    equipment: null,
    capacity: null,
    priceRange: null
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Get all existing bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });
  
  // Filter rooms based on user filters
  useEffect(() => {
    if (!rooms) return;
    
    let filtered = [...rooms];
    
    if (filters.equipment) {
      filtered = filtered.filter(room => 
        room.equipment.includes(filters.equipment as string)
      );
    }
    
    if (filters.capacity) {
      const [min, max] = filters.capacity.split('-');
      if (max) {
        filtered = filtered.filter(room => 
          room.capacity >= parseInt(min) && room.capacity <= parseInt(max)
        );
      } else if (filters.capacity === '5+') {
        filtered = filtered.filter(room => room.capacity >= 5);
      }
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      filtered = filtered.filter(room => 
        room.hourlyRate >= parseInt(min) && room.hourlyRate <= parseInt(max)
      );
    }
    
    setFilteredRooms(filtered);
  }, [rooms, filters]);
  
  // Get unique equipment options for filter
  const equipmentOptions = rooms 
    ? [...new Set(rooms.flatMap(room => room.equipment))]
    : [];
  
  // Get bookings for the selected room
  const roomBookings = selectedRoom && bookings
    ? bookings.filter((booking: Booking) => booking.roomId === selectedRoom.id)
    : [];
  
  // Mutation for creating a booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: { roomId: number, startTime: string, endTime: string, specialRequests?: string }) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: (data: Booking) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setQrCode(data.qrCode || null);
      setNewBookingId(data.id);
      handleCloseConfirmDialog();
      setSuccessDialogOpen(true);
      setSpecialRequests("");
      setActiveStep(0);
      setSelectedRoom(null);
      setStartTime(null);
      setEndTime(null);
    },
    onError: (error) => {
      handleCloseConfirmDialog();
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Could not create booking. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleFilter = (newFilters: RoomFilterOptions) => {
    setFilters(newFilters);
  };
  
  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setActiveStep(1);
  };
  
  const handleTimeSelect = (start: Date, end: Date) => {
    setStartTime(start);
    setEndTime(end);
    setActiveStep(2);
  };
  
  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
  };
  
  const handleConfirmBooking = () => {
    if (selectedRoom && startTime && endTime) {
      createBookingMutation.mutate({
        roomId: selectedRoom.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        specialRequests: specialRequests.trim() || undefined
      });
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => Math.max(0, prevStep - 1));
  };
  
  const steps = ['Select Room', 'Select Date & Time', 'Review & Confirm'];
  
  if (roomsLoading || bookingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Book a Gaming Room
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a room, date, and time to make your booking
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === 0 && (
        <>
          <RoomFilter 
            onFilter={handleFilter} 
            equipmentOptions={equipmentOptions}
          />
          
          {filteredRooms.length > 0 ? (
            <RoomCarousel 
              rooms={filteredRooms} 
              onSelectRoom={handleRoomSelect}
            />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No rooms match your filter criteria. Please try different filters.</Typography>
            </Paper>
          )}
        </>
      )}
      
      {activeStep === 1 && selectedRoom && (
        <BookingCalendar 
          selectedRoom={selectedRoom}
          existingBookings={roomBookings}
          onTimeSlotSelect={handleTimeSelect}
        />
      )}
      
      {activeStep === 2 && selectedRoom && startTime && endTime && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Review Your Booking
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Room Details:
              </Typography>
              <Typography>
                {selectedRoom.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capacity: {selectedRoom.capacity} players
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Equipment: {selectedRoom.equipment.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rate: ${selectedRoom.hourlyRate}/hour
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Booking Time:
              </Typography>
              <Typography>
                {format(startTime, 'MMMM d, yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duration: 1 hour
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                Total: ${selectedRoom.hourlyRate}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Special Requests (Optional)"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleBack}>
              Back
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleOpenConfirmDialog}
            >
              Confirm Booking
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Your Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to book {selectedRoom?.name} on {startTime && format(startTime, 'MMMM d, yyyy')} from {startTime && format(startTime, 'h:mm a')} to {endTime && format(endTime, 'h:mm a')}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            variant="contained" 
            color="primary"
            disabled={createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleCloseSuccessDialog}>
        <DialogTitle>Booking Successful!</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your booking (#{newBookingId}) has been submitted and is pending approval.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You will receive a notification once your booking is approved.
            </Typography>
            
            {qrCode && (
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Your Booking QR Code:
                </Typography>
                <img src={qrCode} alt="Booking QR Code" style={{ maxWidth: '200px' }} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
