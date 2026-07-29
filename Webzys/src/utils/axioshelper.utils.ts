import axios, { RawAxiosRequestHeaders } from 'axios';

export class AxiosHelperUtils {
  constructor() {}

  createAuthorizationHeader(headers: any, skipAuthorization: boolean = false) {
    if (!skipAuthorization) {
      // Get token from localStorage - use auth_token directly (same pattern as appointza-ui-canvas)
      // First try to get from auth_token key
      let token = localStorage.getItem('auth_token');
      
      // If auth_token is not found or is a mock token, fallback to user_context.accesstoken
      if (!token || token.startsWith('mock_token_')) {
        const userContext = localStorage.getItem('user_context');
        if (userContext) {
          try {
            const user = JSON.parse(userContext);
            token = user.accesstoken;
          } catch (error) {
            console.error('Error parsing user_context:', error);
          }
        }
      }
      
      // Only set Authorization header if we have a valid token (not mock)
      if (token && !token.startsWith('mock_token_')) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    headers['Accept'] = headers?.Accept || 'application/json';
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE';
    return headers;
  }

  async get<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.get<T>(url, {
      headers: headers,
    });
    return response.data;
  }

  async delete<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.delete<T>(url, {
      headers: headers,
    });
    return response.data;
  }

  async post<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders = {},
  ) {
    // If data is FormData, don't set Content-Type - let axios set it automatically
    const isFormData = data instanceof FormData;
    if (isFormData) {
      headers = this.createAuthorizationHeader({}, skipAuthorization);
      // Remove Content-Type for FormData - axios will set it with boundary
      delete headers['Content-Type'];
    } else {
      headers = this.createAuthorizationHeader(headers, skipAuthorization);
    }
    let response = await axios.post<T>(url, data, {
      headers,
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.put<T>(url, data, {
      headers: headers,
    });
    return response.data;
  }
}

