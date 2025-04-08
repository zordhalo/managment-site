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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Stack
} from "@mui/material";
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shift, Room, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, addDays, startOfWeek } from "date-fns";

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

export default function SupervisorShiftsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [newShiftDialogOpen, setNewShiftDialogOpen] = useState(false);
  const [editShiftDialogOpen, setEditShiftDialogOpen] = useState(false);
  const [deleteShiftDialogOpen, setDeleteShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  const [formData, setFormData] = useState({
    employeeId: "",
    roomId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00"
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all shifts
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts"],
  });
  
  // Get all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const response = await apiRequest('POST', '/api/shifts', shiftData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Shift created",
        description: "Shift has been successfully created.",
      });
      handleCloseNewShiftDialog();
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Could not create shift. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/shifts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Shift updated",
        description: "Shift has been successfully updated.",
      });
      handleCloseEditShiftDialog();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update shift. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      // Update the shift to be inactive instead of deleting
      const response = await apiRequest('PUT', `/api/shifts/${id}`, { isActive: false });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Shift deleted",
        description: "Shift has been successfully removed.",
      });
      handleCloseDeleteShiftDialog();
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Could not delete shift. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Dialog handlers
  const handleOpenNewShiftDialog = () => {
    // Reset form data
    setFormData({
      employeeId: "",
      roomId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00"
    });
    setNewShiftDialogOpen(true);
  };
  
  const handleCloseNewShiftDialog = () => {
    setNewShiftDialogOpen(false);
  };
  
  const handleOpenEditShiftDialog = (shift: Shift) => {
    setSelectedShift(shift);
    const shiftDate = new Date(shift.date);
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    
    setFormData({
      employeeId: shift.employeeId.toString(),
      roomId: shift.roomId.toString(),
      date: format(shiftDate, "yyyy-MM-dd"),
      startTime: format(startTime, "HH:mm"),
      endTime: format(endTime, "HH:mm")
    });
    
    setEditShiftDialogOpen(true);
  };
  
  const handleCloseEditShiftDialog = () => {
    setEditShiftDialogOpen(false);
    setSelectedShift(null);
  };
  
  const handleOpenDeleteShiftDialog = (shift: Shift) => {
    setSelectedShift(shift);
    setDeleteShiftDialogOpen(true);
  };
  
  const handleCloseDeleteShiftDialog = () => {
    setDeleteShiftDialogOpen(false);
    setSelectedShift(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const handleCreateShift = () => {
    const dateObj = new Date(formData.date);
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
    
    const startTime = new Date(dateObj);
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date(dateObj);
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    createShiftMutation.mutate({
      employeeId: parseInt(formData.employeeId),
      roomId: parseInt(formData.roomId),
      date: dateObj.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });
  };
  
  const handleUpdateShift = () => {
    if (!selectedShift) return;
    
    const dateObj = new Date(formData.date);
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
    
    const startTime = new Date(dateObj);
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date(dateObj);
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    updateShiftMutation.mutate({
      id: selectedShift.id,
      data: {
        employeeId: parseInt(formData.employeeId),
        roomId: parseInt(formData.roomId),
        date: dateObj.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }
    });
  };
  
  const handleDeleteShift = () => {
    if (selectedShift) {
      deleteShiftMutation.mutate(selectedShift.id);
    }
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
  
  const getEmployeeName = (employeeId: number) => {
    if (!employees) return "Loading...";
    const employee = employees.find((e: User) => e.id === employeeId);
    return employee ? employee.fullName : "Unknown Employee";
  };
  
  // Filter shifts based on current tab
  const getFilteredShifts = () => {
    if (!shifts) return [];
    
    // Only show active shifts
    let filtered = shifts.filter(shift => shift.isActive);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfCurrentWeek = startOfWeek(today);
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
    
    switch (tabValue) {
      case 0: // All shifts
        break;
      case 1: // Today
        filtered = filtered.filter(shift => {
          const shiftDate = new Date(shift.date);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate.getTime() === today.getTime();
        });
        break;
      case 2: // Tomorrow
        filtered = filtered.filter(shift => {
          const shiftDate = new Date(shift.date);
          shiftDate.setHours(0, 0, 0, 0);
          return shiftDate.getTime() === tomorrow.getTime();
        });
        break;
      case 3: // This week
        filtered = filtered.filter(shift => {
          const shiftDate = new Date(shift.date);
          return shiftDate >= startOfCurrentWeek && shiftDate <= endOfCurrentWeek;
        });
        break;
    }
    
    // Sort by date
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  if (shiftsLoading || roomsLoading || employeesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const filteredShifts = getFilteredShifts();
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Manage Shifts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and assign shifts to employees
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewShiftDialog}
        >
          Create New Shift
        </Button>
      </Box>
      
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
          <Tab label="Tomorrow" />
          <Tab label="This Week" />
        </Tabs>
        
        <TabPanel value={tabValue} index={tabValue}>
          {filteredShifts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No shifts found</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenNewShiftDialog}
                sx={{ mt: 2 }}
              >
                Create New Shift
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredShifts.map((shift) => {
                    const shiftDate = new Date(shift.date);
                    const startTime = new Date(shift.startTime);
                    const endTime = new Date(shift.endTime);
                    const isToday = new Date().toDateString() === shiftDate.toDateString();
                    
                    return (
                      <TableRow key={shift.id} hover>
                        <TableCell>{format(shiftDate, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</TableCell>
                        <TableCell>{getEmployeeName(shift.employeeId)}</TableCell>
                        <TableCell>{getRoomName(shift.roomId)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={isToday ? "Active" : "Scheduled"} 
                            color={isToday ? "success" : "primary"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditShiftDialog(shift)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteShiftDialog(shift)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
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
      
      {/* New Shift Dialog */}
      <Dialog open={newShiftDialogOpen} onClose={handleCloseNewShiftDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="employee-label">Employee</InputLabel>
                <Select
                  labelId="employee-label"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleFormChange}
                  label="Employee"
                >
                  {employees.map((employee: User) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="room-label">Room</InputLabel>
                <Select
                  labelId="room-label"
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleFormChange}
                  label="Room"
                >
                  {rooms.map((room: Room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                id="date"
                name="date"
                label="Shift Date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="startTime"
                name="startTime"
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="endTime"
                name="endTime"
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewShiftDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateShift} 
            variant="contained" 
            color="primary"
            disabled={!formData.employeeId || !formData.roomId || !formData.date || !formData.startTime || !formData.endTime || createShiftMutation.isPending}
          >
            {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Shift Dialog */}
      <Dialog open={editShiftDialogOpen} onClose={handleCloseEditShiftDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="edit-employee-label">Employee</InputLabel>
                <Select
                  labelId="edit-employee-label"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleFormChange}
                  label="Employee"
                >
                  {employees.map((employee: User) => (
                    <MenuItem key={employee.id} value={employee.id.toString()}>
                      {employee.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="edit-room-label">Room</InputLabel>
                <Select
                  labelId="edit-room-label"
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleFormChange}
                  label="Room"
                >
                  {rooms.map((room: Room) => (
                    <MenuItem key={room.id} value={room.id.toString()}>
                      {room.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                id="date"
                name="date"
                label="Shift Date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="startTime"
                name="startTime"
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="endTime"
                name="endTime"
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditShiftDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateShift} 
            variant="contained" 
            color="primary"
            disabled={!formData.employeeId || !formData.roomId || !formData.date || !formData.startTime || !formData.endTime || updateShiftMutation.isPending}
          >
            {updateShiftMutation.isPending ? "Updating..." : "Update Shift"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Shift Dialog */}
      <Dialog open={deleteShiftDialogOpen} onClose={handleCloseDeleteShiftDialog}>
        <DialogTitle>Delete Shift</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shift for {selectedShift ? getEmployeeName(selectedShift.employeeId) : ""} at {selectedShift ? getRoomName(selectedShift.roomId) : ""} on {selectedShift ? format(parseISO(selectedShift.date), "MMMM d, yyyy") : ""}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteShiftDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteShift} 
            color="error"
            variant="contained"
            disabled={deleteShiftMutation.isPending}
          >
            {deleteShiftMutation.isPending ? "Deleting..." : "Delete Shift"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
