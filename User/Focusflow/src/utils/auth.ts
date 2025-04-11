import { jwtDecode } from "jwt-decode";

// Interface for decoded token
interface DecodedToken {
  id: string;
  exp: number;
}

// Token key for local storage
export const TOKEN_KEY = 'token';

// Function to retrieve token from local storage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Function to set token in local storage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Function to remove token from local storage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

// Function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
};

// Function to retrieve user ID from token
export const getUserId = (): string | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.id;
  } catch {
    return null;
  }
};

// Function to log out user
export const logout = (): void => {
  removeToken();
  // Add any additional cleanup here if needed
};
