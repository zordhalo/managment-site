import { useState, useRef } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Chip, 
  IconButton,
  Stack,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  Group as GroupIcon, 
  AttachMoney as AttachMoneyIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon 
} from "@mui/icons-material";
import { Room } from "@/lib/types";

interface RoomCarouselProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
}

export default function RoomCarousel({ rooms, onSelectRoom }: RoomCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleScroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 0;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    // Calculate new scroll position
    const newPosition = scrollPosition + scrollAmount;
    
    // Scroll the container
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    // Update scroll position
    setScrollPosition(newPosition);
  };
  
  const getPlaceholderImage = (roomName: string) => {
    // Generate consistent images based on room name
    const roomTypes = {
      'VR': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'Racing': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'PC': 'https://images.unsplash.com/photo-1604854863807-23c55ba596bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    };
    
    if (roomName.includes('VR')) return roomTypes.VR;
    if (roomName.includes('Racing')) return roomTypes.Racing;
    return roomTypes.PC;
  };
  
  return (
    <Box sx={{ position: 'relative', mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" fontWeight="medium">
          Available Rooms
        </Typography>
        
        {!isMobile && (
          <Box>
            <IconButton 
              onClick={() => handleScroll('left')}
              sx={{ mr: 1 }}
              disabled={scrollPosition <= 0}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton 
              onClick={() => handleScroll('right')}
              disabled={carouselRef.current && scrollPosition >= carouselRef.current.scrollWidth - carouselRef.current.clientWidth}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Box
        ref={carouselRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          gap: 2,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}
      >
        {rooms.map((room) => (
          <Card 
            key={room.id} 
            sx={{ 
              minWidth: 280, 
              maxWidth: 280, 
              flexShrink: 0,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3
              }
            }}
          >
            <CardMedia
              component="img"
              height="160"
              image={getPlaceholderImage(room.name)}
              alt={room.name}
            />
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" component="h3">
                {room.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <GroupIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Up to {room.capacity} players
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <AttachMoneyIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  ${room.hourlyRate}/hour
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 1.5, gap: 0.5 }}>
                {room.equipment.slice(0, 2).map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    size="small"
                    sx={{
                      bgcolor: index === 0 ? 'primary.light' : 'secondary.light',
                      color: index === 0 ? 'primary.contrastText' : 'secondary.contrastText',
                    }}
                  />
                ))}
              </Stack>
            </CardContent>
            
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={() => onSelectRoom(room)}
              >
                Select Room
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      
      {!isMobile && (
        <>
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: -20,
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={() => handleScroll('left')}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              right: -20,
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={() => handleScroll('right')}
            disabled={carouselRef.current && scrollPosition >= carouselRef.current.scrollWidth - carouselRef.current.clientWidth}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
}
