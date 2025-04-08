import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { User, InsertUser } from '@shared/schema';

// Environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'booking-system-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper to generate JWT token
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper to hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Helper to compare password
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // Add user to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    next();
  };
};

// User registration
export const register = async (userData: InsertUser): Promise<User> => {
  // Check if username or email already exists
  const existingUsername = await storage.getUserByUsername(userData.username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  const existingEmail = await storage.getUserByEmail(userData.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);
  
  // Create user with hashed password
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  });

  return user;
};

// User login
export const login = async (
  username: string,
  password: string
): Promise<{ user: User; token: string }> => {
  // Find user by username
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = generateToken(user);

  return { user, token };
};

// Extend the Express Request type to include our user property
declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}
