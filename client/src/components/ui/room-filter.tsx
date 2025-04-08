import { useState } from "react";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Grid,
  SelectChangeEvent
} from "@mui/material";
import { RoomFilterOptions } from "@/lib/types";

interface RoomFilterProps {
  onFilter: (filters: RoomFilterOptions) => void;
  equipmentOptions: string[];
}

export default function RoomFilter({ onFilter, equipmentOptions }: RoomFilterProps) {
  const [filters, setFilters] = useState<RoomFilterOptions>({
    equipment: null,
    capacity: null,
    priceRange: null
  });
  
  const handleChange = (event: SelectChangeEvent<string | null>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyFilters = () => {
    onFilter(filters);
  };
  
  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, mb: 3 }}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="equipment-filter-label">Equipment</InputLabel>
            <Select
              labelId="equipment-filter-label"
              id="equipment-filter"
              name="equipment"
              value={filters.equipment || ''}
              label="Equipment"
              onChange={handleChange}
            >
              <MenuItem value="">All Equipment</MenuItem>
              {equipmentOptions.map((equipment) => (
                <MenuItem key={equipment} value={equipment}>
                  {equipment}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="capacity-filter-label">Capacity</InputLabel>
            <Select
              labelId="capacity-filter-label"
              id="capacity-filter"
              name="capacity"
              value={filters.capacity || ''}
              label="Capacity"
              onChange={handleChange}
            >
              <MenuItem value="">Any Size</MenuItem>
              <MenuItem value="1-2">1-2 Players</MenuItem>
              <MenuItem value="3-4">3-4 Players</MenuItem>
              <MenuItem value="5+">5+ Players</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="price-filter-label">Price Range</InputLabel>
            <Select
              labelId="price-filter-label"
              id="price-filter"
              name="priceRange"
              value={filters.priceRange || ''}
              label="Price Range"
              onChange={handleChange}
            >
              <MenuItem value="">Any Price</MenuItem>
              <MenuItem value="25-35">$25-$35/hr</MenuItem>
              <MenuItem value="36-45">$36-$45/hr</MenuItem>
              <MenuItem value="46-60">$46-$60/hr</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Button 
            variant="contained" 
            color="primary"
            fullWidth
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
