import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body, query, params } = req;

  // Log the incoming request
  logger.info('Incoming request', {
    method,
    url,
    query,
    params,
    body: method === 'GET' ? undefined : body, // Don't log body for GET requests
  });

  // Store the original send function
  const originalSend = res.send;

  // Override the send function to log the response
  res.send = function (body) {
    const responseTime = Date.now() - start;
    
    // Log the response
    logger.info('Response sent', {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      url,
      method,
      // Only log response body for errors in production, or all responses in development
      ...(process.env.NODE_ENV === 'development' || res.statusCode >= 400 
        ? { response: JSON.parse(JSON.stringify(body)) } 
        : {}
      ),
    });

    // Call the original send function
    return originalSend.call(this, body);
  };

  next();
};

export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  });

  next(err);
};
