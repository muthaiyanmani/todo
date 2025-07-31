# Environment Configuration

This document describes the environment variables used in the Smart Todo Pro application.

## Environment Variables

### API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE` | API base URL for all API requests | `http://localhost:3000/api/v1` | No |

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_APP_NAME` | Application display name | `Smart Todo Pro` | No |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notifications | - | Yes (for push notifications) |

## Setup Instructions

### Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your development setup:
   ```env
   VITE_API_BASE=http://localhost:3000/api/v1
   VITE_APP_NAME=Smart Todo Pro
   VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here
   ```

### Production

Set the following environment variables in your production environment:

```env
VITE_API_BASE=https://your-production-api.com/api/v1
VITE_APP_NAME=Smart Todo Pro
VITE_VAPID_PUBLIC_KEY=your-production-vapid-public-key
```

## API Client Configuration

The application uses two API clients:

1. **Primary API Client** (`src/lib/api-client.ts`)
   - Uses `VITE_API_BASE` or falls back to `process.env.API_BASE`
   - Includes JWT authentication, retry logic, and standardized error handling
   - Used for all API integrations

2. **Secondary API Client** (`src/api/client.ts`)
   - Uses `VITE_API_BASE` with same fallback pattern
   - Simpler axios instance for basic API calls

## Environment Variable Priority

The API clients use environment variables in the following priority order:

1. `import.meta.env.VITE_API_BASE` (Vite environment variable)
2. `process.env.API_BASE` (Node.js environment variable)
3. Hardcoded default: `http://localhost:3000/api/v1`

## Development vs Production

### Development
- Uses `.env` file in the project root
- MSW (Mock Service Worker) intercepts API calls for development
- Console logging enabled for API client initialization

### Production
- Environment variables set in deployment platform
- Real API endpoints used
- Console logging minimized

## Troubleshooting

### Common Issues

1. **API calls not working**: Check that `VITE_API_BASE` is set correctly
2. **Environment variables not loading**: Ensure variables start with `VITE_` prefix
3. **CORS issues**: Verify API server CORS configuration matches the base URL

### Debugging

To debug environment variable loading, check the browser console for:
```
API Client initialized with baseURL: http://your-api-url
```

You can also use the environment test utility:
```typescript
import { testEnvironmentVariables } from './src/utils/env-test';
testEnvironmentVariables();
```