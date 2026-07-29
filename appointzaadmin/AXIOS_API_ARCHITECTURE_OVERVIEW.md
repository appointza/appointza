# Axios & API Call Architecture - Complete Overview

This document provides a comprehensive overview of how axios and API calls are structured in this React Native project. Use this as a reference for implementing similar patterns in other projects.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Axios Configuration](#axios-configuration)
4. [Helper Utility Class](#helper-utility-class)
5. [Service Layer Pattern](#service-layer-pattern)
6. [Request/Response Models](#requestresponse-models)
7. [Usage in Components](#usage-in-components)
8. [Environment Configuration](#environment-configuration)
9. [Error Handling](#error-handling)
10. [Authentication Flow](#authentication-flow)

---

## 🏗️ Architecture Overview

The project uses a **layered architecture** for API calls:

```
Components/Screens
    ↓
Service Classes (e.g., UsersService, OrganisationService)
    ↓
AxiosHelperUtils (Wrapper around axios)
    ↓
Axios Interceptor (Global configuration)
    ↓
Backend API
```

**Key Features:**
- Centralized axios configuration with interceptors
- Automatic token injection from Redux store
- Global error handling (401 auto-logout)
- Request/response logging
- Type-safe API calls with TypeScript generics
- Standardized request/response wrapper pattern

---

## 📁 Project Structure

```
src/
├── utils/
│   ├── axiosinterceptor.util.tsx    # Axios instance with interceptors
│   ├── axioshelper.utils.tsx        # Helper class for API calls
│   └── environment.ts                # Environment configuration
├── services/
│   ├── users.service.ts             # Example service class
│   ├── organisation.service.ts      # Example service class
│   └── ...                          # Other service classes
├── models/
│   ├── actionreq.model.ts           # Request wrapper model
│   ├── actionres.model.ts           # Response wrapper model
│   └── ...                          # Domain models
└── redux/
    └── usercontext.redux.ts         # Redux store for auth token
```

---

## ⚙️ Axios Configuration

**File:** `src/utils/axiosinterceptor.util.tsx`

### Base URL Setup
```typescript
import axios, {AxiosResponse} from 'axios';
import {environment} from './environment';

// Set the base URL for all axios requests
axios.defaults.baseURL = environment.baseurl;
```

### Request Interceptor
Logs all outgoing requests for debugging:
```typescript
axios.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);
```

### Response Interceptor
- Logs successful responses
- Handles errors globally
- **Auto-logout on 401 Unauthorized**

```typescript
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Success:', response.config.method?.toUpperCase(), 
                response.config.url, response.status);
    return response;
  },
  (error: any) => {
    // Detailed error logging
    console.error('❌ API Error Details:');
    console.error('Method:', error.config?.method?.toUpperCase());
    console.error('URL:', error.config?.url);
    console.error('Status:', error?.response?.status);
    console.error('Status Text:', error?.response?.statusText);
    console.error('Message:', error?.message);
    console.error('Response Data:', error?.response?.data);
    console.error('Full Error Object:', error);

    // Auto-logout on 401
    let statuscode = error?.response?.status;
    if (statuscode == 401) {
      console.log('🔐 Unauthorized access, logging out user');
      var usersservice = new UsersService();
      usersservice.applogout();
    }
    return Promise.reject(error);
  }
);

export {axios};
```

---

## 🔧 Helper Utility Class

**File:** `src/utils/axioshelper.utils.tsx`

This class wraps axios and provides:
- Automatic authorization header injection
- Type-safe methods (GET, POST, PUT, DELETE)
- Consistent header management

### Class Structure
```typescript
import {RawAxiosRequestHeaders, AxiosHeaders} from 'axios';
import {store} from '../redux/store.redux';
import {axios} from './axiosinterceptor.util';

export class AxiosHelperUtils {
  constructor() {}
  
  // Creates authorization header from Redux store
  createAuthorizationHeader(headers: any, skipAuthorization: boolean = false) {
    if (!skipAuthorization) {
      var root_state = store.getState().usercontext;
      var token = root_state.value.accesstoken;
      headers['Authorization'] = token;
    }
    headers['Accept'] = headers?.Accept || 'application/json';
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE';
    return headers;
  }
  
  // GET request
  async get<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.get<T>(url, {
      headers: headers,
    });
    return response.data; // Returns only data, not full response
  }
  
  // DELETE request
  async delete<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.delete<T>(url, {
      headers: headers,
    });
    return response.data;
  }
  
  // POST request
  async post<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.post<T>(url, data, {
      headers,
    });
    return response.data;
  }

  // PUT request (Note: uses POST method in this implementation)
  async put<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.post<T>(url, data, {
      headers: headers,
    });
    return response.data;
  }
}
```

### Key Features:
- **Automatic Token Injection**: Gets token from Redux store automatically
- **Skip Authorization**: Use `skipAuthorization: true` for public endpoints (login, register)
- **Type Safety**: Uses TypeScript generics `<T>` for response types
- **Consistent Headers**: Sets default headers (Accept, Content-Type, CORS)

---

## 🎯 Service Layer Pattern

**File:** `src/services/users.service.ts` (Example)

Each service class follows this pattern:

### Service Class Structure
```typescript
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {Users, UsersLoginReq, UsersContext} from '../models/users.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class UsersService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Users';
    this.http = new AxiosHelperUtils();
  }
  
  // Example: Login (public endpoint - skipAuthorization: true)
  async login(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/login',
      postdata,
      true, // skipAuthorization = true for public endpoints
    );
    return resp.item!;
  }
  
  // Example: Get user data (protected endpoint)
  async select(req: UsersSelectReq) {
    let postdata: ActionReq<UsersSelectReq> = new ActionReq<UsersSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Users>>>(
      this.baseurl + '/select',
      postdata,
      // skipAuthorization defaults to false
    );
    return resp.item!;
  }
  
  // Example: Save user (protected endpoint)
  async save(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/save',
      postdata,
    );
    return resp.item!;
  }
  
  // Example: GET request
  async placeorder() {
    let resp = await this.http.get<ActionRes<boolean>>(
      this.baseurl + '/PlaceOrder',
    );
    return resp.item!;
  }
}
```

### Service Pattern Summary:
1. **Base URL**: Set in constructor using `environment.baseurl + '/api/ResourceName'`
2. **HTTP Helper**: Instantiate `AxiosHelperUtils` in constructor
3. **Request Wrapper**: Wrap all requests in `ActionReq<T>`
4. **Response Wrapper**: Expect `ActionRes<T>` as response type
5. **Return Data**: Extract `resp.item!` from response
6. **Public Endpoints**: Pass `true` as third parameter to skip authorization

---

## 📦 Request/Response Models

### ActionReq Model
**File:** `src/models/actionreq.model.ts`
```typescript
export class ActionReq<T> {
  item: T | null = null;
}
```

### ActionRes Model
**File:** `src/models/actionres.model.ts`
```typescript
export class ActionRes<T> {
  item: T | null = null;
}

export enum ErrorCodes {
  BadRequest,
  DeleteRequestFailed,
  FileNotFound,
  UserNotFound,
  InvalidOtp,
  OtpAttemptsExceeded,
  IncorrectOtp,
  InvalidSession,
  SessionExpired,
  InvalidOrder,
  InvalidPayment,
  MobileNumberAlreadyExist,
  VendorNotApproved,
  SystemNotApproved,
  AccessDenied
}
```

### Usage Pattern:
```typescript
// Request
let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
postdata.item = req;

// Response
let resp = await this.http.post<ActionRes<UsersContext>>(url, postdata);
return resp.item!; // Extract the actual data
```

---

## 🎨 Usage in Components

### Example 1: Login Screen
```typescript
import {UsersService} from '../services/users.service';
import {UsersLoginReq} from '../models/users.model';

export function LoginScreen() {
  const usersservice = useMemo(() => new UsersService(), []);
  const [isloading, setIsloading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const login = async () => {
    setIsloading(true);
    try {
      let loginreq = new UsersLoginReq();
      loginreq.mobile = mobile;
      loginreq.otp = otp;
      
      let loginresp = await usersservice.login(loginreq);
      dispatch(usercontextactions.set(loginresp!));
      
      // Handle success...
    } catch (error: any) {
      // Handle error...
      console.error('Login failed:', error);
    } finally {
      setIsloading(false);
    }
  };

  return (
    // UI components...
  );
}
```

### Example 2: Fetching Data
```typescript
import {AppoinmentService} from '../services/appoinment.service';
import {AppoinmentSelectReq} from '../models/appoinment.model';

export function UserDashboardScreen() {
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const [appointments, setAppointments] = useState([]);

  const getuserappoinment = async () => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.userid = usercontext.value.userid;
      
      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setAppointments(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  // Use useFocusEffect to load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );
}
```

### Best Practices in Components:
1. **Memoize Services**: Use `useMemo(() => new Service(), [])` to avoid recreating instances
2. **Loading States**: Always manage loading states
3. **Error Handling**: Wrap API calls in try-catch
4. **Lifecycle Hooks**: Use `useFocusEffect` to reload data when screen is focused
5. **Type Safety**: Use proper TypeScript types for requests/responses

---

## 🌍 Environment Configuration

**File:** `src/utils/environment.ts`
```typescript
export var environment = {
    baseurl: "https://www.appointza.com",
    templateBaseUrl: "https://www.appointza.com/template",
    googleMapsApiKey: "AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ"
}
```

### Usage:
```typescript
import {environment} from '../utils/environment';

// In service constructor
this.baseurl = environment.baseurl + '/api/Users';
```

---

## ⚠️ Error Handling

### Global Error Handling
- **401 Unauthorized**: Automatically handled by interceptor (logs out user)
- **Other Errors**: Logged to console with full details

### Component-Level Error Handling
```typescript
try {
  const res = await service.method(req);
  // Handle success
} catch (error: any) {
  // Access error details
  const message = error?.response?.data?.message || 'An error occurred';
  const status = error?.response?.status;
  
  // Show user-friendly error
  AppAlert({message});
  
  // Log for debugging
  console.error('API Error:', error);
}
```

### Error Response Structure:
```typescript
error.response.status      // HTTP status code
error.response.statusText  // HTTP status text
error.response.data       // Response body
error.message             // Error message
error.config              // Request configuration
```

---

## 🔐 Authentication Flow

### Token Storage
- Token stored in **Redux store** (`usercontext.redux.ts`)
- Path: `store.getState().usercontext.value.accesstoken`

### Token Injection
- Automatically injected by `AxiosHelperUtils.createAuthorizationHeader()`
- Added to `Authorization` header for all requests (unless `skipAuthorization: true`)

### Login Flow
```typescript
// 1. Call login endpoint (skipAuthorization: true)
let loginresp = await usersservice.login(loginreq);

// 2. Store user context (including token) in Redux
dispatch(usercontextactions.set(loginresp!));

// 3. Subsequent API calls automatically include token
const data = await usersservice.select(req); // Token auto-injected
```

### Logout Flow
```typescript
// Triggered automatically on 401, or manually:
usersservice.applogout(); // Clears Redux store and navigates to Login
```

---

## 📝 Complete Example: Creating a New Service

### Step 1: Create Model
```typescript
// src/models/product.model.ts
export class Product {
  productid: number = 0;
  name: string = '';
  price: number = 0;
}

export class ProductSelectReq {
  productid: number = 0;
  categoryid?: number;
}
```

### Step 2: Create Service
```typescript
// src/services/product.service.ts
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {Product, ProductSelectReq} from '../models/product.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class ProductService {
  baseurl: string;
  http: AxiosHelperUtils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Product';
    this.http = new AxiosHelperUtils();
  }
  
  async select(req: ProductSelectReq) {
    let postdata: ActionReq<ProductSelectReq> = new ActionReq<ProductSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Product>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }
  
  async save(req: Product) {
    let postdata: ActionReq<Product> = new ActionReq<Product>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Product>>(
      this.baseurl + '/save',
      postdata,
    );
    return resp.item!;
  }
}
```

### Step 3: Use in Component
```typescript
// src/screens/products/products.screen.tsx
import {ProductService} from '../services/product.service';
import {ProductSelectReq} from '../models/product.model';

export function ProductsScreen() {
  const productService = useMemo(() => new ProductService(), []);
  const [products, setProducts] = useState<Product[]>([]);
  
  const fetchProducts = async () => {
    try {
      const req = new ProductSelectReq();
      req.categoryid = 1;
      const res = await productService.select(req);
      setProducts(res || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  return (
    // UI...
  );
}
```

---

## 🔑 Key Takeaways

1. **Centralized Configuration**: All axios setup in one place (`axiosinterceptor.util.tsx`)
2. **Automatic Auth**: Token automatically injected from Redux store
3. **Type Safety**: Full TypeScript support with generics
4. **Consistent Pattern**: All services follow the same structure
5. **Error Handling**: Global 401 handling + component-level error handling
6. **Request Wrapper**: All requests wrapped in `ActionReq<T>`
7. **Response Wrapper**: All responses wrapped in `ActionRes<T>`
8. **Public Endpoints**: Use `skipAuthorization: true` for login/register

---

## 📚 Dependencies

**package.json** (relevant dependencies):
```json
{
  "dependencies": {
    "axios": "^1.7.9",
    "@reduxjs/toolkit": "^2.5.0",
    "react-redux": "^9.2.0",
    "redux": "^5.0.1"
  }
}
```

---

## 🚀 Quick Start Checklist

To implement this pattern in a new project:

- [ ] Install axios: `npm install axios`
- [ ] Create `utils/axiosinterceptor.util.tsx` with interceptors
- [ ] Create `utils/axioshelper.utils.tsx` with helper class
- [ ] Create `utils/environment.ts` with base URL
- [ ] Create `models/actionreq.model.ts` and `actionres.model.ts`
- [ ] Set up Redux store for auth token (if using authentication)
- [ ] Create service classes following the pattern
- [ ] Use services in components with proper error handling

---

**End of Document**

