import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  styled,
  ButtonBase
} from "@mui/material";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addDays } from "date-fns";
import { TimeSlot, Room, Booking } from "@/lib/types";

interface BookingCalendarProps {
  selectedRoom: Room;
  existingBookings: Booking[];
  onTimeSlotSelect: (startTime: Date, endTime: Date) => void;
}

const CalendarDay = styled(ButtonBase)(({ theme }) => ({
  width: '100%',
  aspectRatio: '1/1',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '&.today': {
    border: `1px solid ${theme.palette.primary.main}`,
  },
  '&.outside': {
    color: theme.palette.text.disabled,
    pointerEvents: 'none',
  },
}));

const TimeSlotButton = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
    opacity: 0.9,
  },
  '&.booked': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
    pointerEvents: 'none',
  },
}));

export default function BookingCalendar({ selectedRoom, existingBookings, onTimeSlotSelect }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Navigate through months
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  // Generate days for the calendar
  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };
  
  // Generate time slots for the selected day
  useEffect(() => {
    // Create time slots from 9 AM to 9 PM in 1 hour increments
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 21; // 9 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(selectedDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      
      // Check if this time slot is already booked
      const isBooked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        
        return (
          (startTime >= bookingStart && startTime < bookingEnd) ||
          (endTime > bookingStart && endTime <= bookingEnd) ||
          (startTime <= bookingStart && endTime >= bookingEnd)
        ) && booking.status !== "rejected" && booking.status !== "cancelled";
      });
      
      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isAvailable: !isBooked,
        price: selectedRoom.hourlyRate
      });
    }
    
    setTimeSlots(slots);
    setSelectedTimeSlot(null);
  }, [selectedDate, selectedRoom, existingBookings]);
  
  // Handle day selection
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  // Handle time slot selection
  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    setSelectedTimeSlot(slot);
    
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    onTimeSlotSelect(startTime, endTime);
  };
  
  // Format time as 12-hour with AM/PM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  // Generate days
  const days = getDaysInMonth();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Select Date & Time
      </Typography>
      
      <Grid container spacing={3}>
        {/* Calendar View */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <Box>
              <Button onClick={previousMonth} size="small">&lt;</Button>
              <Button onClick={nextMonth} size="small">&gt;</Button>
            </Box>
          </Box>
          
          <Grid container spacing={1}>
            {/* Day names header */}
            {dayNames.map((day) => (
              <Grid item xs={12/7} key={day}>
                <Typography align="center" variant="caption" sx={{ fontWeight: 'medium' }}>
                  {day}
                </Typography>
              </Grid>
            ))}
            
            {/* Fill in empty days from previous month */}
            {Array.from({ length: new Date(days[0]).getDay() }).map((_, index) => (
              <Grid item xs={12/7} key={`empty-start-${index}`}>
                <Box />
              </Grid>
            ))}
            
            {/* Calendar days */}
            {days.map((day) => (
              <Grid item xs={12/7} key={day.toString()}>
                <CalendarDay
                  onClick={() => handleDayClick(day)}
                  className={`
                    ${isToday(day) ? 'today' : ''}
                    ${isSameDay(day, selectedDate) ? 'selected' : ''}
                    ${!isSameMonth(day, currentDate) ? 'outside' : ''}
                  `}
                >
                  {format(day, 'd')}
                </CalendarDay>
              </Grid>
            ))}
            
            {/* Fill in empty days from next month */}
            {Array.from({ length: (7 - ((days.length + new Date(days[0]).getDay()) % 7)) % 7 }).map((_, index) => (
              <Grid item xs={12/7} key={`empty-end-${index}`}>
                <Box />
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Time Slots */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Available Times for {format(selectedDate, 'MMMM d, yyyy')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {timeSlots.map((slot, index) => (
              <TimeSlotButton
                key={index}
                elevation={0}
                variant="outlined"
                onClick={() => handleTimeSlotClick(slot)}
                className={`
                  ${selectedTimeSlot && slot.startTime === selectedTimeSlot.startTime ? 'selected' : ''}
                  ${!slot.isAvailable ? 'booked' : ''}
                `}
              >
                <Typography variant="body2" fontWeight="medium">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {slot.isAvailable ? `$${slot.price}` : 'Booked'}
                </Typography>
              </TimeSlotButton>
            ))}
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary"
          disabled={!selectedTimeSlot}
          onClick={() => {
            if (selectedTimeSlot) {
              const startTime = new Date(selectedTimeSlot.startTime);
              const endTime = new Date(selectedTimeSlot.endTime);
              onTimeSlotSelect(startTime, endTime);
            }
          }}
        >
          Continue to Booking
        </Button>
      </Box>
    </Box>
  );
}
