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
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Divider
} from "@mui/material";
import { 
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as MeetingRoomIcon,
  Group as GroupIcon
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { Shift, Room, Booking } from "@/lib/types";
import { format, parseISO, isToday, isThisWeek, isFuture } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

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
      id={`shifts-tabpanel-${index}`}
      aria-labelledby={`shifts-tab-${index}`}
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

export default function EmployeeMyShiftsPage() {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  
  // Get employee's shifts
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts"],
  });
  
  // Get all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Get all bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Helper functions
  const getRoomName = (roomId: number) => {
    if (!rooms) return "Loading...";
    const room = rooms.find((r: Room) => r.id === roomId);
    return room ? room.name : "Unknown Room";
  };
  
  const getRoom = (roomId: number) => {
    if (!rooms) return null;
    return rooms.find((r: Room) => r.id === roomId);
  };
  
  // Get bookings for a specific room on a specific date
  const getBookingsForShift = (roomId: number, shiftDate: Date) => {
    if (!bookings) return [];
    
    return bookings.filter((booking: Booking) => {
      const bookingDate = new Date(booking.startTime);
      return (
        booking.roomId === roomId && 
        bookingDate.toDateString() === shiftDate.toDateString() &&
        (booking.status === 'approved' || booking.status === 'completed')
      );
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };
  
  // Filter shifts based on current tab
  const getFilteredShifts = () => {
    if (!shifts || !user) return [];
    
    // Only show this employee's active shifts
    let filtered = shifts.filter(shift => 
      shift.employeeId === user.id && shift.isActive
    );
    
    switch (tabValue) {
      case 0: // All shifts
        break;
      case 1: // Today
        filtered = filtered.filter(shift => isToday(new Date(shift.date)));
        break;
      case 2: // This week
        filtered = filtered.filter(shift => isThisWeek(new Date(shift.date)));
        break;
      case 3: // Upcoming
        filtered = filtered.filter(shift => isFuture(new Date(shift.date)) && !isToday(new Date(shift.date)));
        break;
    }
    
    // Sort by date (nearest first)
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Check if a shift is today
  const isShiftToday = (shift: Shift) => {
    return isToday(new Date(shift.date));
  };
  
  if (shiftsLoading || roomsLoading || bookingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const filteredShifts = getFilteredShifts();
  const todayShift = filteredShifts.find(shift => isShiftToday(shift));
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          My Shifts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your upcoming and past shifts
        </Typography>
      </Box>
      
      {/* Today's Shift Card (if any) */}
      {todayShift && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TodayIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Today's Shift</Typography>
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Time:
                  </Typography>
                </Box>
                <Typography>
                  {format(parseISO(todayShift.startTime), 'h:mm a')} - {format(parseISO(todayShift.endTime), 'h:mm a')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MeetingRoomIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Room:
                  </Typography>
                </Box>
                <Typography>
                  {getRoomName(todayShift.roomId)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Bookings:
                  </Typography>
                </Box>
                <Typography>
                  {getBookingsForShift(todayShift.roomId, new Date(todayShift.date)).length} bookings today
                </Typography>
              </Grid>
            </Grid>
            
            {getBookingsForShift(todayShift.roomId, new Date(todayShift.date)).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Today's Schedule:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getBookingsForShift(todayShift.roomId, new Date(todayShift.date)).map((booking: Booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {format(parseISO(booking.startTime), 'h:mm a')} - {format(parseISO(booking.endTime), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hour(s)
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)} 
                              color={booking.status === 'approved' ? 'primary' : 'success'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Shift Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Shifts" />
          <Tab label="Today" />
          <Tab label="This Week" />
          <Tab label="Upcoming" />
        </Tabs>
        
        <TabPanel value={tabValue} index={tabValue}>
          {filteredShifts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No shifts found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredShifts.map((shift) => {
                    const shiftDate = new Date(shift.date);
                    const isActive = isShiftToday(shift);
                    const room = getRoom(shift.roomId);
                    const shiftBookings = getBookingsForShift(shift.roomId, shiftDate).length;
                    
                    return (
                      <TableRow key={shift.id} hover>
                        <TableCell>{format(shiftDate, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(shift.startTime), 'h:mm a')} - {format(parseISO(shift.endTime), 'h:mm a')}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getRoomName(shift.roomId)}
                            {room && (
                              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                (Capacity: {room.capacity})
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{shiftBookings} booking(s)</TableCell>
                        <TableCell>
                          <Chip 
                            label={isActive ? "Active" : "Scheduled"} 
                            color={isActive ? "success" : "primary"}
                            size="small"
                          />
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
    </Box>
  );
}
