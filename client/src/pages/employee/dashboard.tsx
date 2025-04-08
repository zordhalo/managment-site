import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Calendar, 
  CircleUser,
  Clock, 
  Monitor,
  RotateCw
} from "lucide-react";

import { MaintenanceChecklist } from "@/components/ui/maintenance-checklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shift, Room } from "@/lib/types";

// Extended version of Shift that includes optional Room details
interface ShiftWithRoomDetails extends Shift {
  room?: Room;
}

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: shiftsData, isLoading, refetch } = useQuery<ShiftWithRoomDetails[]>({
    queryKey: ["/api/shifts"]
  });

  const currentDate = new Date();
  const todayShift = shiftsData?.find(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate.toDateString() === currentDate.toDateString();
  });

  const upcomingShifts = shiftsData?.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate > currentDate;
  }).slice(0, 3);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data refreshed",
      description: "Latest shift data has been loaded",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your shifts, tasks, and view room status
        </p>
      </div>

      <div className="flex justify-between">
        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="shifts">Shifts</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Shift
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {todayShift ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Monitor className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-sm font-medium">
                          {todayShift.room?.name || `Room #${todayShift.roomId}`}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(todayShift.startTime), "h:mm a")} - {format(new Date(todayShift.endTime), "h:mm a")}
                        </p>
                        <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          Active
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[72px] flex flex-col justify-center items-center">
                      <p className="text-sm text-muted-foreground text-center">
                        No shift scheduled for today
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-2">
                  {todayShift && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/employee/tasks">
                        View Tasks
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Upcoming Shifts
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {upcomingShifts && upcomingShifts.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingShifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Monitor className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {shift.room?.name || `Room #${shift.roomId}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(shift.date), "MMM d")}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(shift.startTime), "h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[72px] flex flex-col justify-center items-center">
                      <p className="text-sm text-muted-foreground text-center">
                        No upcoming shifts scheduled
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/employee/shifts">
                      View All Shifts
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Maintenance Status
                  </CardTitle>
                  <CircleUser className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Daily Tasks</p>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: '70%' }}></div>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <p>7/10 tasks completed</p>
                        <p>70%</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Weekly Tasks</p>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: '30%' }}></div>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <p>3/10 tasks completed</p>
                        <p>30%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab("maintenance")}
                  >
                    View Maintenance Tasks
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0 divide-y">
                    {[
                      { action: "Completed shift", time: "2 hours ago", type: "shift" },
                      { action: "Task completed", time: "4 hours ago", type: "task" },
                      { action: "Room cleaned", time: "5 hours ago", type: "maintenance" },
                      { action: "Started shift", time: "8 hours ago", type: "shift" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {activity.type === "shift" && <Clock className="h-4 w-4 text-primary" />}
                            {activity.type === "task" && <Monitor className="h-4 w-4 text-primary" />}
                            {activity.type === "maintenance" && <RotateCw className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">Daily Maintenance Checklist</h3>
              <MaintenanceChecklist />
            </div>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4 mt-4">
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">My Shift Schedule</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Shifts</CardTitle>
                  <CardDescription>
                    Your scheduled shifts for the next two weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {shiftsData && shiftsData.length > 0 ? (
                    <div className="space-y-4">
                      {shiftsData.slice(0, 5).map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center space-x-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {shift.room?.name || `Room #${shift.roomId}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(shift.date), "EEEE, MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {format(new Date(shift.startTime), "h:mm a")} - {format(new Date(shift.endTime), "h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000)} hours
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No upcoming shifts found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/employee/shifts">View All Shifts</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/employee/tasks">View Tasks</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}