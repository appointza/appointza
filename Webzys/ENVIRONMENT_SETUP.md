# Environment Variables Setup

This project uses Vite's environment variable system. All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your API base URL:
   ```
   VITE_API_BASE_URL=https://appointza.com
   ```

3. Restart your development server if it's running.

## Available Environment Variables

### Required Variables

- `VITE_API_BASE_URL` - The base URL for your API server (default: `https://appointza.com`)
- `VITE_BASE_URL` - The base URL for the application (default: `https://appointza.com`)

### Optional Variables

- `VITE_DOMAIN` - Application domain (default: `appointza.com`)
- `VITE_TEMPLATE_BASE_URL` - Template base URL (default: `${VITE_BASE_URL}/template`)
- `VITE_APP_TITLE` - Application title (default: `Webzys`)
- `VITE_APP_VERSION` - Application version (default: `1.0.0`)

### Feature Flags

- `VITE_ENABLE_DEBUG_LOGS` - Enable debug logging (default: `false`)
- `VITE_ENABLE_ANALYTICS` - Enable analytics (default: `false`)
- `VITE_ENABLE_ERROR_REPORTING` - Enable error reporting (default: `false`)

### Third-party API Keys

- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_RAZORPAY_KEY_ID` - Razorpay key ID
- `VITE_RAZORPAY_KEY_SECRET` - Razorpay key secret
- `VITE_RAZORPAY_TEST_MODE` - Razorpay test mode (default: `true`)

## Environment Files

- `.env` - Default environment variables (loaded in all environments)
- `.env.local` - Local overrides (gitignored, for secrets)
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

## Usage in Code

The environment variables are accessible globally through the `environment` object:

```typescript
import { environment, API_BASE_URL } from '@/utils/environment';

// Use the base URL
const apiUrl = environment.baseurl;
// Or use the direct export
const apiUrl = API_BASE_URL;
```

## Important Notes

1. **VITE_ Prefix Required**: All environment variables exposed to client code must be prefixed with `VITE_`
2. **Restart Required**: After changing environment variables, restart the development server
3. **Build Time**: Environment variables are embedded at build time, not runtime
4. **Security**: Never commit `.env.local` or `.env` files with secrets to version control

## Example Configuration

### Development
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_BASE_URL=http://localhost:8081
VITE_ENABLE_DEBUG_LOGS=true
```

### Production
```env
VITE_API_BASE_URL=https://appointza.com
VITE_BASE_URL=https://appointza.com
VITE_ENABLE_DEBUG_LOGS=false
```

