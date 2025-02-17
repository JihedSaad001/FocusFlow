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

    console.log(
      `🔍 Token Debug: ID: ${decoded.id}, Exp: ${decoded.exp}, Current Time: ${Math.floor(Date.now() / 1000)}`
    ); // ✅ Logs token details

    // ✅ Store token expiration info in localStorage for debugging
    localStorage.setItem("lastCheckedToken", JSON.stringify(decoded));

    return decoded.exp < Date.now() / 1000; // Compare with current time
  } catch (error) {
    console.error("⚠️ Token decoding failed, assuming expired:", error);
    return true; // Assume expired if decoding fails
  }
};

// ✅ Function to retrieve last checked token info
export const getLastCheckedToken = (): DecodedToken | null => {
  const storedToken = localStorage.getItem("lastCheckedToken");
  return storedToken ? JSON.parse(storedToken) : null;
};
