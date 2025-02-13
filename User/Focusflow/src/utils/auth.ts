import { jwtDecode } from "jwt-decode";

// Interface for decoded token
interface DecodedToken {
  id: string;
  exp: number;
}

// Function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true; // Assume expired if decoding fails
  }
};
