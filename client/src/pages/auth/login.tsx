import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, MonitorPlay } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <MonitorPlay className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <div className="mb-2 font-medium">Demo credentials:</div>
          <div>Player: username="player", password="password123"</div>
          <div>Employee: username="staff", password="password123"</div>
          <div>Supervisor: username="admin", password="password123"</div>
        </div>
      </div>
    </div>
  );
}
