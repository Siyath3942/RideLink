import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { authConfig } from '../config';

export interface AuthenticatedUser {
  userId: string;
  accountId: string;
  role: 'DRIVER' | 'PASSENGER' | 'ADMIN' | 'SERVICE';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      isInternalService?: boolean;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens issued by Account Service.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing or malformed Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as any;
    req.user = {
      userId: decoded.userId || decoded.id || decoded.sub,
      accountId: decoded.accountId || decoded.userId || decoded.id,
      role: decoded.role || 'PASSENGER',
    };
    next();
  } catch (error) {
    throw new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN');
  }
}

/**
 * Middleware for Role-Based Access Control (RBAC).
 */
export function authorizeRoles(...allowedRoles: Array<'DRIVER' | 'PASSENGER' | 'ADMIN' | 'SERVICE'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication context missing.', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

/**
 * Middleware to protect microservice-to-microservice endpoints.
 * Accepts either a valid X-Internal-Service-Key header or a token with role 'SERVICE'.
 */
export function authenticateInternalService(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-internal-service-key'];

  if (serviceKey && serviceKey === authConfig.internalServiceKey) {
    req.isInternalService = true;
    req.user = {
      userId: 'system-internal-service',
      accountId: 'system-internal-service',
      role: 'SERVICE',
    };
    return next();
  }

  // Fallback to Bearer token authentication with SERVICE role
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as any;
      if (decoded.role === 'SERVICE' || decoded.role === 'ADMIN') {
        req.user = {
          userId: decoded.userId || decoded.id || decoded.sub,
          accountId: decoded.accountId || decoded.userId || decoded.id,
          role: decoded.role,
        };
        req.isInternalService = true;
        return next();
      }
    } catch {
      // ignore token error here and fail below
    }
  }

  throw new AppError('Unauthorized inter-service request. Invalid internal service key or credentials.', 401, 'UNAUTHORIZED_SERVICE');
}
