/**
 * Custom API error with status code
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Format error messages for consistent error handling
 * @param error The error to format
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `Error (${error.statusCode}): ${error.message}`;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unexpected error occurred';
  }
}

/**
 * Handle API errors in a consistent way
 * @param fn Async function to execute
 * @returns Result or formatted error
 */
export async function handleApiError<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: formatErrorMessage(error)
    };
  }
} 