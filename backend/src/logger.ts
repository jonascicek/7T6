// Simple structured logger for JSON logging
export const logger = {
  info: (message: string, data?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    }))
  },

  warn: (message: string, data?: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    }))
  },

  error: (message: string, error?: Error | Record<string, any>) => {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message }
      : error
    
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      ...(errorData && { error: errorData }),
    }))
  },

  debug: (message: string, data?: Record<string, any>) => {
    if (process.env.DEBUG === 'true') {
      console.log(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...(data && { data }),
      }))
    }
  },
}
