import { useState, useEffect } from "react";
import { 
  Typography,
  Box,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Button,
  LinearProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton
} from "@mui/material";
import { 
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as MeetingRoomIcon,
  CheckCircle as CheckCircleIcon,
  PlaylistAdd as PlaylistAddIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CurrentTaskData, Task } from "@/lib/types";
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
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EmployeeTasksPage() {
  const [tabValue, setTabValue] = useState(0);
  const [activityLog, setActivityLog] = useState<Array<{action: string, time: Date}>>([]);
  const [newTask, setNewTask] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get current tasks (for today's active shift)
  const { data: currentTaskData, isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks/current"],
    onError: (error) => {
      toast({
        title: "Could not load tasks",
        description: error instanceof Error ? error.message : "No active shift found for today",
        variant: "destructive",
      });
    }
  });
  
  // Task completion mutation
  const taskCompletionMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: number, isCompleted: boolean }) => {
      const response = await apiRequest('POST', '/api/checklist', { taskId, isCompleted });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/current'] });
      // Add to activity log
      setActivityLog(prev => [
        { 
          action: data.isCompleted ? 
            `Completed task: ${data.name}` : 
            `Unchecked task: ${data.name}`, 
          time: new Date() 
        },
        ...prev
      ]);
      
      toast({
        title: data.isCompleted ? "Task completed" : "Task unchecked",
        description: data.name,
      });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Could not update task status",
        variant: "destructive",
      });
    }
  });
  
  // New task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { shiftId: number, name: string, category: string }) => {
      const response = await apiRequest('POST', '/api/tasks', taskData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/current'] });
      setNewTask("");
      setActivityLog(prev => [
        { action: `Added custom task: ${data.name}`, time: new Date() },
        ...prev
      ]);
      toast({
        title: "Task added",
        description: "Custom task was added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add task",
        description: error instanceof Error ? error.message : "Could not add custom task",
        variant: "destructive",
      });
    }
  });
  
  // Initial activity log entry when shift is loaded
  useEffect(() => {
    if (currentTaskData && !isLoading) {
      setActivityLog(prev => {
        // Only add the "Started shift" entry if it doesn't exist
        if (prev.length === 0) {
          return [{ action: "Started shift", time: new Date() }];
        }
        return prev;
      });
    }
  }, [currentTaskData, isLoading]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTaskToggle = (taskId: number, isCompleted: boolean) => {
    taskCompletionMutation.mutate({ taskId, isCompleted: !isCompleted });
  };
  
  const handleAddCustomTask = () => {
    if (!newTask.trim() || !currentTaskData?.shift) return;
    
    addTaskMutation.mutate({
      shiftId: currentTaskData.shift.id,
      name: newTask.trim(),
      category: getCategoryFromTabValue(tabValue)
    });
  };
  
  const handleRefreshTasks = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Tasks have been refreshed",
    });
  };
  
  // Helper functions
  const getCategoryFromTabValue = (value: number): string => {
    switch (value) {
      case 0: return "computer_organization";
      case 1: return "game_updates";
      case 2: return "equipment_checks";
      case 3: return "cleaning";
      default: return "computer_organization";
    }
  };
  
  const getTasksByCategoryFromTabValue = (value: number, tasks: Task[]): Task[] => {
    const category = getCategoryFromTabValue(value);
    return tasks.filter(task => task.category === category);
  };
  
  // Calculate completion progress for the current tab and overall
  const calculateProgress = (tasks: Task[], category?: string) => {
    if (!tasks || tasks.length === 0) return 0;
    
    let filteredTasks = tasks;
    if (category) {
      filteredTasks = tasks.filter(task => task.category === category);
    }
    
    const completedTasks = filteredTasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / filteredTasks.length) * 100);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If no active shift is found
  if (!currentTaskData) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            My Tasks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your shift tasks and track completion
          </Typography>
        </Box>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No active shift found for today</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You don't have any assigned shifts for today or your shift hasn't started yet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Check Again
          </Button>
        </Paper>
      </Box>
    );
  }
  
  const { shift, tasks } = currentTaskData;
  const currentCategoryTasks = getTasksByCategoryFromTabValue(tabValue, tasks);
  const overallProgress = calculateProgress(tasks);
  const categoryProgress = calculateProgress(tasks, getCategoryFromTabValue(tabValue));
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            My Tasks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your shift tasks and track completion
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefreshTasks}
        >
          Refresh Tasks
        </Button>
      </Box>
      
      {/* Shift Info Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', md: 'row'}, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Current Shift</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <TodayIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2">
                  {format(parseISO(shift.date), 'MMMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2">
                  {format(parseISO(shift.startTime), 'h:mm a')} - {format(parseISO(shift.endTime), 'h:mm a')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <MeetingRoomIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2">Room ID: {shift.roomId}</Typography>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ mt: {xs: 2, md: 0} }}>
            <Chip 
              label="Active"
              color="success"
              icon={<CheckCircleIcon />}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>
        
        {/* Overall Progress */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              Shift Completion
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {overallProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      </Paper>
      
      {/* Task Checklist */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
            Task Checklist
          </Typography>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="task categories tabs"
            sx={{ px: 3 }}
          >
            <Tab label="Computer Organization" />
            <Tab label="Game Updates" />
            <Tab label="Equipment Checks" />
            <Tab label="Cleaning" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={tabValue}>
          <Box sx={{ px: 3, pb: 3 }}>
            {/* Category Progress */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Section Progress:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentCategoryTasks.filter(task => task.isCompleted).length} of {currentCategoryTasks.length} tasks completed
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={categoryProgress} 
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
            
            {/* Task List */}
            <List>
              {currentCategoryTasks.map((task) => (
                <ListItem 
                  key={task.id}
                  disablePadding
                  sx={{ py: 0.5 }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={task.isCompleted} 
                        onChange={() => handleTaskToggle(task.id, task.isCompleted)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          textDecoration: task.isCompleted ? 'line-through' : 'none',
                          color: task.isCompleted ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {task.name}
                      </Typography>
                    }
                    sx={{ width: '100%' }}
                  />
                </ListItem>
              ))}
            </List>
            
            {/* Add Custom Task */}
            <Box sx={{ display: 'flex', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <input
                placeholder="Add custom task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTask()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <IconButton 
                color="primary"
                onClick={handleAddCustomTask}
                disabled={!newTask.trim()}
                sx={{ ml: 1 }}
              >
                <PlaylistAddIcon />
              </IconButton>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        
        {activityLog.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No activity logged yet
          </Typography>
        ) : (
          <List>
            {activityLog.map((log, index) => (
              <ListItem key={index} sx={{ position: 'relative', py: 2 }}>
                {index !== activityLog.length - 1 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 16, 
                    top: 36, 
                    bottom: 0, 
                    width: 2, 
                    bgcolor: 'divider' 
                  }} />
                )}
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: log.action.includes('Completed') ? 'success.light' : 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {log.action.includes('Completed') ? (
                      <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                    ) : (
                      <ScheduleIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={log.action}
                  secondary={format(log.time, 'h:mm a')}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption', align: 'right' }}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {activityLog.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="outlined" size="small">
              View Complete History
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
