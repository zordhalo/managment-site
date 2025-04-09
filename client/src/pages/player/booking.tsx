import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room, Booking, RoomFilterOptions } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RoomCarousel from "@/components/ui/room-carousel";
import BookingCalendar from "@/components/ui/booking-calendar";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CalendarCheck, Clock, Monitor, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Book the Esports Room</h1>
        <p className="text-muted-foreground">
          Select a date and time for your booking
        </p>
      </div>
      
      <div className="relative">
        <div className="mb-8">
          <div className="relative">
            <div className="absolute top-0 left-0 w-full flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col items-center`}
                  style={{ width: `${100 / steps.length}%` }}
                >
                  <div className={`
                    z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${index <= activeStep ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-muted-foreground/20 text-muted-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <span className={`mt-2 text-xs ${index <= activeStep ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 w-full bg-muted mt-4">
              <div 
                className="h-1 bg-primary transition-all" 
                style={{ width: `${((activeStep) / (steps.length - 1)) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {activeStep === 0 && (
        <>
          {/* No filter needed, only showing one room */}
          {rooms && rooms.length > 0 ? (
            <RoomCarousel 
              rooms={rooms} 
              onSelectRoom={handleRoomSelect}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p>No rooms available for booking.</p>
              </CardContent>
            </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Review Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center text-primary">
                    <Monitor className="mr-2 h-4 w-4" />
                    Room Details
                  </h3>
                  <div className="rounded-md bg-muted p-4 space-y-2">
                    <h4 className="font-bold">{selectedRoom.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>Capacity: Up to {selectedRoom.capacity} players</p>
                      <p>Equipment: {selectedRoom.equipment.join(', ')}</p>
                      <div className="mt-2 flex items-center">
                        <Badge variant="outline" className="bg-primary/10 border-0 text-primary font-medium">
                          Free for Coaches
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center text-primary">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Booking Time
                  </h3>
                  <div className="rounded-md bg-muted p-4 space-y-2">
                    <h4 className="font-bold">{format(startTime, 'MMMM d, yyyy')}</h4>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                      </div>
                      <p>Duration: 1 hour</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center">
                <Info className="mr-2 h-4 w-4" />
                Special Requests (Optional)
              </h3>
              <Textarea
                placeholder="Any special equipment needs or setup instructions?"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleOpenConfirmDialog}>
              Confirm Booking
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Booking</DialogTitle>
            <DialogDescription>
              Please review your booking details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">
              Are you sure you want to book <span className="font-semibold">{selectedRoom?.name}</span> on:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><span className="font-medium">Date:</span> {startTime && format(startTime, 'MMMM d, yyyy')}</li>
              <li><span className="font-medium">Time:</span> {startTime && format(startTime, 'h:mm a')} to {endTime && format(endTime, 'h:mm a')}</li>
              <li><span className="font-medium">Fee:</span> <Badge className="ml-1">Free for Coaches</Badge></li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseConfirmDialog} className="sm:mt-0 mt-2">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleCloseSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Booking Successful!</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
            
            <p className="text-center mb-4 font-medium">
              Your booking (#{newBookingId}) has been submitted and is pending approval.
            </p>
            
            <p className="text-sm text-muted-foreground text-center mb-4">
              You will receive a notification once your booking is approved.
            </p>
            
            {qrCode && (
              <div className="my-4 flex flex-col items-center">
                <h4 className="font-medium mb-2">Your Booking QR Code:</h4>
                <div className="border p-2 rounded-md bg-white">
                  <img src={qrCode} alt="Booking QR Code" className="max-w-[200px]" />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={handleCloseSuccessDialog} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
