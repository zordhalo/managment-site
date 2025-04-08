import { useState } from "react";
import { 
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  IconButton,
  Stack
} from "@mui/material";
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SupervisorRoomsPage() {
  const [newRoomDialogOpen, setNewRoomDialogOpen] = useState(false);
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [equipmentInput, setEquipmentInput] = useState("");
  
  const initialFormState = {
    name: "",
    capacity: 0,
    equipment: [] as string[],
    hourlyRate: 0,
    description: "",
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialFormState);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest('POST', '/api/rooms', roomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: "Room created",
        description: "Room has been successfully created.",
      });
      handleCloseNewRoomDialog();
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Could not create room. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/rooms/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: "Room updated",
        description: "Room has been successfully updated.",
      });
      handleCloseEditRoomDialog();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update room. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      // Set room to inactive instead of deleting
      const response = await apiRequest('PUT', `/api/rooms/${id}`, { isActive: false });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: "Room deactivated",
        description: "Room has been successfully deactivated.",
      });
      handleCloseDeleteRoomDialog();
    },
    onError: (error) => {
      toast({
        title: "Deactivation failed",
        description: error instanceof Error ? error.message : "Could not deactivate room. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Dialog handlers
  const handleOpenNewRoomDialog = () => {
    setFormData(initialFormState);
    setEquipmentInput("");
    setNewRoomDialogOpen(true);
  };
  
  const handleCloseNewRoomDialog = () => {
    setNewRoomDialogOpen(false);
  };
  
  const handleOpenEditRoomDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      equipment: [...room.equipment],
      hourlyRate: room.hourlyRate,
      description: room.description || "",
      isActive: room.isActive
    });
    setEquipmentInput("");
    setEditRoomDialogOpen(true);
  };
  
  const handleCloseEditRoomDialog = () => {
    setEditRoomDialogOpen(false);
    setSelectedRoom(null);
  };
  
  const handleOpenDeleteRoomDialog = (room: Room) => {
    setSelectedRoom(room);
    setDeleteRoomDialogOpen(true);
  };
  
  const handleCloseDeleteRoomDialog = () => {
    setDeleteRoomDialogOpen(false);
    setSelectedRoom(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? 0 : parseInt(value)
    }));
  };
  
  const handleAddEquipment = () => {
    if (equipmentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipmentInput.trim()]
      }));
      setEquipmentInput("");
    }
  };
  
  const handleRemoveEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };
  
  const handleCreateRoom = () => {
    createRoomMutation.mutate(formData);
  };
  
  const handleUpdateRoom = () => {
    if (!selectedRoom) return;
    
    updateRoomMutation.mutate({
      id: selectedRoom.id,
      data: formData
    });
  };
  
  const handleDeleteRoom = () => {
    if (selectedRoom) {
      deleteRoomMutation.mutate(selectedRoom.id);
    }
  };
  
  // Helper function to get a placeholder image based on room name
  const getRoomImage = (roomName: string) => {
    if (roomName.toLowerCase().includes('vr')) {
      return 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    } else if (roomName.toLowerCase().includes('racing')) {
      return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    } else {
      return 'https://images.unsplash.com/photo-1604854863807-23c55ba596bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    }
  };
  
  if (roomsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Only show active rooms
  const activeRooms = rooms.filter((room: Room) => room.isActive);
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Manage Rooms
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, edit, and manage gaming rooms
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewRoomDialog}
        >
          Add New Room
        </Button>
      </Box>
      
      {/* Room Grid */}
      <Grid container spacing={3}>
        {activeRooms.map((room: Room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}>
              <CardMedia
                component="img"
                height="140"
                image={getRoomImage(room.name)}
                alt={room.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {room.name}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {room.capacity} players
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${room.hourlyRate}/hour
                  </Typography>
                </Box>
                
                {room.description && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {room.description}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  {room.equipment.map((item, index) => (
                    <Chip
                      key={index}
                      label={item}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: index % 3 === 0 ? 'primary.light' : index % 3 === 1 ? 'secondary.light' : 'info.light',
                        color: index % 3 === 0 ? 'primary.contrastText' : index % 3 === 1 ? 'secondary.contrastText' : 'info.contrastText',
                      }}
                    />
                  ))}
                </Stack>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenEditRoomDialog(room)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleOpenDeleteRoomDialog(room)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {activeRooms.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No rooms found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by adding your first gaming room.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenNewRoomDialog}
          >
            Add New Room
          </Button>
        </Paper>
      )}
      
      {/* New Room Dialog */}
      <Dialog open={newRoomDialogOpen} onClose={handleCloseNewRoomDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                id="name"
                name="name"
                label="Room Name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="capacity"
                name="capacity"
                label="Capacity (players)"
                type="number"
                value={formData.capacity === 0 ? "" : formData.capacity}
                onChange={handleNumberChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="hourly-rate">Hourly Rate</InputLabel>
                <OutlinedInput
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate === 0 ? "" : formData.hourlyRate}
                  onChange={handleNumberChange}
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  label="Hourly Rate"
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description (optional)"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Equipment
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  id="equipment-input"
                  placeholder="Add equipment item"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddEquipment}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, minHeight: '100px' }}>
                {formData.equipment.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No equipment added yet
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formData.equipment.map((item, index) => (
                      <Chip
                        key={index}
                        label={item}
                        onDelete={() => handleRemoveEquipment(index)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewRoomDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || formData.capacity <= 0 || formData.hourlyRate <= 0 || formData.equipment.length === 0 || createRoomMutation.isPending}
          >
            {createRoomMutation.isPending ? "Creating..." : "Create Room"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Room Dialog */}
      <Dialog open={editRoomDialogOpen} onClose={handleCloseEditRoomDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                id="name"
                name="name"
                label="Room Name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                id="capacity"
                name="capacity"
                label="Capacity (players)"
                type="number"
                value={formData.capacity}
                onChange={handleNumberChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="hourly-rate">Hourly Rate</InputLabel>
                <OutlinedInput
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleNumberChange}
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  label="Hourly Rate"
                  type="number"
                  inputProps={{ min: 1 }}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description (optional)"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Equipment
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  id="equipment-input"
                  placeholder="Add equipment item"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEquipment()}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddEquipment}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, minHeight: '100px' }}>
                {formData.equipment.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No equipment added yet
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formData.equipment.map((item, index) => (
                      <Chip
                        key={index}
                        label={item}
                        onDelete={() => handleRemoveEquipment(index)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="isActive"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditRoomDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateRoom} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || formData.capacity <= 0 || formData.hourlyRate <= 0 || formData.equipment.length === 0 || updateRoomMutation.isPending}
          >
            {updateRoomMutation.isPending ? "Updating..." : "Update Room"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Room Dialog */}
      <Dialog open={deleteRoomDialogOpen} onClose={handleCloseDeleteRoomDialog}>
        <DialogTitle>Deactivate Room</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate {selectedRoom?.name}? This room will no longer be available for bookings.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Note: Any existing bookings for this room will need to be rescheduled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteRoomDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteRoom} 
            color="error"
            variant="contained"
            disabled={deleteRoomMutation.isPending}
          >
            {deleteRoomMutation.isPending ? "Deactivating..." : "Deactivate Room"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
