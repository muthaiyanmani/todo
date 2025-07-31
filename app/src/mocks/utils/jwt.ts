import { v4 as uuidv4 } from 'uuid';

// Simple JWT implementation for MSW (not for production use)
const JWT_SECRET = 'mock-jwt-secret-for-development-only';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function generateJWT(payload: { userId: string; email: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60); // 1 hour expiration
  
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp,
  };

  // Simple base64 encoding for mock JWT
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(jwtPayload));
  const signature = btoa(`${header}.${body}.${JWT_SECRET}`);
  
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    
    // Verify signature (simple check for mock)
    const expectedSignature = btoa(`${header}.${body}.${JWT_SECRET}`);
    if (signature !== expectedSignature) return null;
    
    // Decode payload
    const payload: JWTPayload = JSON.parse(atob(body));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    return null;
  }
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function extractUserFromToken(authHeader: string | null): { userId: string; email: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return verifyJWT(token);
}