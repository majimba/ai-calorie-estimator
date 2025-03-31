/**
 * Debug logging utility for client-side debugging
 */
export const debug = {
  log: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  error: (message: string, error: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ ${message}`, error);
      
      if (error instanceof Error) {
        console.error('  Message:', error.message);
        console.error('  Stack:', error.stack);
      } else if (error && typeof error === 'object') {
        console.error('  Data:', error);
      }
    }
  },
  
  network: {
    request: (url: string, method: string, data?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Request: ${method} ${url}`);
        if (data) {
          console.log('  Data:', typeof data === 'string' ? `${data.substring(0, 50)}...` : data);
        }
      }
    },
    
    response: (url: string, status: number, data?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Response: ${status} ${url}`);
        if (data) {
          console.log('  Data:', data);
        }
      }
    },
    
    error: (url: string, error: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`🌐 Network Error: ${url}`);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('  Status:', error.response.status);
          console.error('  Data:', error.response.data);
          console.error('  Headers:', error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('  No response received');
          console.error('  Request:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('  Error message:', error.message);
        }
        console.error('  Error config:', error.config);
      }
    }
  }
}; 