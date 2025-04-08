import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Avatar, 
  Badge, 
  Menu, 
  MenuItem, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Box, 
  Divider,
  Container
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon,
  SportsEsports as SportsEsportsIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Room as RoomIcon,
  Task as TaskIcon,
  Schedule as ScheduleIcon
} from "@mui/icons-material";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Get notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };
  
  // Navigation links based on user role
  const getNavigationLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case "player":
        return [
          { path: "/player/booking", label: "Book a Room", icon: <RoomIcon /> },
          { path: "/player/mybookings", label: "My Bookings", icon: <EventIcon /> },
        ];
      case "employee":
        return [
          { path: "/employee/myshifts", label: "My Shifts", icon: <ScheduleIcon /> },
          { path: "/employee/tasks", label: "Tasks", icon: <TaskIcon /> },
        ];
      case "supervisor":
        return [
          { path: "/supervisor/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
          { path: "/supervisor/bookings", label: "Bookings", icon: <EventIcon /> },
          { path: "/supervisor/shifts", label: "Shifts", icon: <ScheduleIcon /> },
          { path: "/supervisor/rooms", label: "Rooms", icon: <RoomIcon /> },
        ];
      default:
        return [];
    }
  };
  
  const navLinks = getNavigationLinks();
  
  const drawer = (
    <div>
      <Toolbar>
        <SportsEsportsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" noWrap>
          GameRoomPro
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navLinks.map((link) => (
          <ListItem 
            button 
            key={link.path} 
            component={Link} 
            href={link.path}
            selected={location === link.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>
              {link.icon}
            </ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItem>
        ))}
      </List>
    </div>
  );
  
  if (!user) return null;
  
  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Container maxWidth="xl">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <SportsEsportsIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              GameRoomPro
            </Typography>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  component={Link}
                  href={link.path}
                  color="inherit"
                  sx={{ 
                    mx: 1,
                    borderBottom: location === link.path ? 2 : 0,
                    borderRadius: 0,
                    pb: 0.5
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
            
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="large" color="inherit">
                <Badge badgeContent={unreadNotifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <Box
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  ml: 2 
                }}
                onClick={handleProfileMenuOpen}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.fullName.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                  {user.fullName}
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={Link} href="/profile" onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Add Toolbar to push content below app bar */}
      <Toolbar />
    </>
  );
}
