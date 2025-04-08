import { useState } from "react";
import { Link } from "wouter";
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar, 
  Grid,
  InputAdornment,
  IconButton
} from "@mui/material";
import { 
  SportsEsports as SportsEsportsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading } = useAuth();
  const { toast } = useToast();
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: "", password: "" };
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(username, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <SportsEsportsIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in to GameRoomPro
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Link href="/register">
                  <Typography variant="body2" component="span" sx={{ cursor: 'pointer', color: 'primary.main' }}>
                    {"Don't have an account? Sign up"}
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Demo credentials:
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Player: username="player", password="password123"
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Employee: username="staff", password="password123"
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Supervisor: username="admin", password="password123"
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
