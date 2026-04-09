/**
 * Centralized Error Handler for API and UI errors
 * Ensures all errors are caught and handled gracefully
 */

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

export class ApiErrorHandler {
  static handle(error: any): ApiError {
    const timestamp = new Date().toISOString();

    // Network error
    if (!navigator.onLine) {
      return {
        status: 0,
        message: 'Network connection lost. Please check your internet.',
        timestamp,
      };
    }

    // Fetch error or no response
    if (!(error instanceof Response) && error?.name === 'TypeError') {
      console.error('[Network Error]', error);
      return {
        status: 0,
        message: 'Unable to reach server. Is the backend running?',
        timestamp,
      };
    }

    // HTTP error response
    if (error instanceof Response) {
      console.error(`[HTTP ${error.status}]`, error);
      return {
        status: error.status,
        message: `Server error: ${error.status} ${error.statusText}`,
        timestamp,
      };
    }

    // Generic error
    const message = error?.message || 'An unexpected error occurred';
    console.error('[Error]', error);

    return {
      status: 500,
      message,
      timestamp,
    };
  }

  static logError(context: string, error: any): void {
    console.error(`[${context}]`, {
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

export const useErrorHandler = () => {
  const handleError = (error: any, context: string = 'Unknown Error') => {
    ApiErrorHandler.logError(context, error);
    const apiError = ApiErrorHandler.handle(error);
    return apiError;
  };

  return { handleError, ApiErrorHandler };
};
