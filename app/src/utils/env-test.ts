// Utility to test environment variable configuration
export const testEnvironmentVariables = () => {
  console.log('Environment Variables Test:');
  console.log('VITE_API_BASE:', import.meta.env.VITE_API_BASE);
  console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME);
  
  // Test API client base URL
  console.log('API Client will use:', import.meta.env.VITE_API_BASE || process.env.API_BASE || 'http://localhost:3000/api/v1');
  
  return {
    apiBase: import.meta.env.VITE_API_BASE,
    appName: import.meta.env.VITE_APP_NAME
  };
};

// Export environment configuration
export const envConfig = {
  apiBase: import.meta.env.VITE_API_BASE || process.env.API_BASE || 'http://localhost:3000/api/v1',
  appName: import.meta.env.VITE_APP_NAME || 'Smart Todo Pro',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
};