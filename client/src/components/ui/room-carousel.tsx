import { useState, useRef } from "react";
import { Room } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock,
  Gamepad2
} from "lucide-react";

interface RoomCarouselProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
}

export default function RoomCarousel({ rooms, onSelectRoom }: RoomCarouselProps) {
  // Only show the Esports Room
  const esportsRoom = rooms[0];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Esports Room</h2>
      </div>
      
      <div className="grid md:grid-cols-1 gap-4">
        <Card className="overflow-hidden border-2 hover:border-primary transition-all">
          <div className="h-[200px] bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="h-20 w-20 text-primary/40" />
          </div>
          
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">Esports Room</h3>
                <p className="text-muted-foreground mb-4">
                  Professional gaming space with high-end equipment and tournament-ready setup
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                Free for Coaches
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>Up to {esportsRoom.capacity} players</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>1-hour sessions</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {esportsRoom.equipment.map((item, index) => (
                <Badge key={index} variant={index % 2 === 0 ? "secondary" : "outline"}>
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/20 px-6 py-4">
            <Button 
              className="w-full"
              onClick={() => onSelectRoom(esportsRoom)}
            >
              Select Room
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
