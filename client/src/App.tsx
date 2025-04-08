import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";

// Auth pages
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";

// Player pages
import PlayerBookingPage from "@/pages/player/booking";
import PlayerMyBookingsPage from "@/pages/player/mybookings";

// Employee pages
import EmployeeDashboardPage from "@/pages/employee/dashboard";
import EmployeeMyShiftsPage from "@/pages/employee/myshifts";
import EmployeeTasksPage from "@/pages/employee/tasks";

// Supervisor pages
import SupervisorDashboardPage from "@/pages/supervisor/dashboard";
import SupervisorBookingsPage from "@/pages/supervisor/bookings";
import SupervisorShiftsPage from "@/pages/supervisor/shifts";
import SupervisorRoomsPage from "@/pages/supervisor/rooms";

// Private Route Component
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Theme is now managed through theme.json and tailwind

// Private Route Component
const PrivateRoute = ({ component: Component, roles = [], ...rest }: any) => {
  const { user, checkAuth } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const isAuthenticated = checkAuth();
    
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    
    if (roles.length > 0 && user && !roles.includes(user.role)) {
      // Redirect based on user role
      if (user.role === "player") {
        setLocation("/player/booking");
      } else if (user.role === "employee") {
        setLocation("/employee/dashboard");
      } else if (user.role === "supervisor") {
        setLocation("/supervisor/dashboard");
      }
    }
  }, [checkAuth, roles, user, setLocation]);
  
  if (!user) return null;
  
  return <Component {...rest} />;
};

// Route configuration
const routes = [
  // Public routes
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  
  // Player routes
  { path: "/player/booking", component: PlayerBookingPage, roles: ["player"] },
  { path: "/player/mybookings", component: PlayerMyBookingsPage, roles: ["player"] },
  
  // Employee routes
  { path: "/employee/dashboard", component: EmployeeDashboardPage, roles: ["employee"] },
  { path: "/employee/myshifts", component: EmployeeMyShiftsPage, roles: ["employee"] },
  { path: "/employee/tasks", component: EmployeeTasksPage, roles: ["employee"] },
  
  // Supervisor routes
  { path: "/supervisor/dashboard", component: SupervisorDashboardPage, roles: ["supervisor"] },
  { path: "/supervisor/bookings", component: SupervisorBookingsPage, roles: ["supervisor"] },
  { path: "/supervisor/shifts", component: SupervisorShiftsPage, roles: ["supervisor"] },
  { path: "/supervisor/rooms", component: SupervisorRoomsPage, roles: ["supervisor"] },
];

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Redirect to appropriate page based on role when accessing root
  useEffect(() => {
    if (location === "/" && user) {
      if (user.role === "player") {
        window.location.href = "/player/booking";
      } else if (user.role === "employee") {
        window.location.href = "/employee/dashboard";
      } else if (user.role === "supervisor") {
        window.location.href = "/supervisor/dashboard";
      }
    } else if (location === "/" && !user) {
      window.location.href = "/login";
    }
  }, [location, user]);
  
  return (
    <Switch>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          component={
            route.roles
              ? (props: any) => (
                  <PrivateRoute component={route.component} roles={route.roles} {...props} />
                )
              : route.component
          }
        />
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
