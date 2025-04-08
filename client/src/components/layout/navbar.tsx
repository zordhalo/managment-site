import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { 
  Menu, 
  Bell,
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  MonitorPlay,
  CheckSquare,
  Clock
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Get notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  
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
          { path: "/player/booking", label: "Book a Room", icon: <MonitorPlay className="h-4 w-4 mr-2" /> },
          { path: "/player/mybookings", label: "My Bookings", icon: <Calendar className="h-4 w-4 mr-2" /> },
        ];
      case "employee":
        return [
          { path: "/employee/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
          { path: "/employee/myshifts", label: "My Shifts", icon: <Clock className="h-4 w-4 mr-2" /> },
          { path: "/employee/tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
        ];
      case "supervisor":
        return [
          { path: "/supervisor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
          { path: "/supervisor/bookings", label: "Bookings", icon: <Calendar className="h-4 w-4 mr-2" /> },
          { path: "/supervisor/shifts", label: "Shifts", icon: <Clock className="h-4 w-4 mr-2" /> },
          { path: "/supervisor/rooms", label: "Rooms", icon: <MonitorPlay className="h-4 w-4 mr-2" /> },
        ];
      default:
        return [];
    }
  };
  
  const navLinks = getNavigationLinks();
  const isMobile = useIsMobile();
  
  if (!user) return null;
  
  return (
    <>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <MonitorPlay className="h-6 w-6" />
              <span className="font-bold text-xl">GameRoomPro</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  href={link.path}
                  className={`flex items-center transition-colors hover:text-primary ${location === link.path ? 'text-primary' : 'text-foreground/60'}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-1 items-center justify-between md:justify-end space-x-2">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="pr-0">
                    <Link href="/" className="flex items-center space-x-2">
                      <MonitorPlay className="h-6 w-6" />
                      <span className="font-bold">GameRoomPro</span>
                    </Link>
                    <Separator className="my-4" />
                    <div className="grid gap-2 py-4">
                      {navLinks.map((link) => (
                        <Link 
                          key={link.path} 
                          href={link.path}
                          className={`flex w-full items-center py-2 text-sm font-medium ${location === link.path ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {link.icon}
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
