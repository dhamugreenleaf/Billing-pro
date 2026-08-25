import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // If it's a Zod validation error (handled differently usually, but just in case)
  if (err.name === 'ZodError') {
    return sendError(res, 'Validation failed', err.errors, 422);
  }

  // Handle generic error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Do not leak stack traces to client
  sendError(res, message, [], statusCode);
};
