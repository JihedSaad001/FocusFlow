import { useState, useEffect } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import axios from "axios";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    { email: false, password: false }
  );

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Validates a single field
  const validateField = (name: string, value: string) => {
    if (name === "email") {
      if (!value.trim()) {
        return "Email is required";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }

    if (name === "password") {
      if (!value.trim()) {
        return "Password is required";
      }
      if (value.length < 5) {
        return "Password must be at least 5 characters long";
      }
    }

    return undefined;
  };

  // Handles input changes and updates form state with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Mark field as touched
    setTouched({ ...touched, [name]: true });

    // Validate the field
    const fieldError = validateField(name, value);
    setErrors({ ...errors, [name]: fieldError });

    // Clear the main error message when user starts typing
    setError("");
  };

  // Handle input blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const fieldError = validateField(name, value);
    setErrors({ ...errors, [name]: fieldError });
  };

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendSuccess(false);

    // Mark all fields as touched for validation
    setTouched({ email: true, password: true });

    // Validate all fields
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);

    // Update errors state
    const newErrors = { email: emailError, password: passwordError };
    setErrors(newErrors);

    // Check if there are any errors
    if (emailError || passwordError) {
      setError(
        emailError || passwordError || "Please fix the errors in the form"
      );
      return;
    }

    setLoading(true);

    try {
      // Create axios instance with default config
      const api = axios.create({
        baseURL:
          import.meta.env.VITE_API_URL ||
          "https://focusflow-production.up.railway.app/api",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      if (!data.token) {
        throw new Error("Login failed: No token received.");
      }

      console.log("✅ Token received:", data.token); // Debugging log

      // Store user data and token in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Notify other components about the storage update
      window.dispatchEvent(new Event("storage"));

      // Redirect to dashboard
      navigate("/home");
    } catch (err: any) {
      if (err.response?.data?.needsVerification) {
        setNeedsVerification(true);
        setError(err.response.data.message || "Email verification required");
      } else {
        setError(err.response?.data?.message || err.message || "Login failed");
      }
      console.error("❌ Login Error:", err.message); // Debugging log
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    // Validate email format with a simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setResendingEmail(true);
    setError("");
    setResendSuccess(false);

    try {
      // Create axios instance with default config
      const api = axios.create({
        baseURL:
          import.meta.env.VITE_API_URL ||
          "https://focusflow-production.up.railway.app/api",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await api.post("/auth/resend-verification", { email: formData.email });

      setResendSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to resend verification email"
      );
    } finally {
      setResendingEmail(false);
    }
  };

  // Redirect to home if already logged in
  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {needsVerification && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-500 mb-3">
                Your email is not verified. Please check your inbox for the
                verification link.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="text-yellow-500 hover:text-yellow-600 underline text-sm font-medium"
              >
                {resendingEmail ? "Sending..." : "Resend verification email"}
              </button>
              {resendSuccess && (
                <p className="text-green-500 text-sm mt-2">
                  Verification email sent! Please check your inbox.
                </p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 transition pl-10 ${
                touched.email && errors.email
                  ? "border border-red-500 focus:ring-red-500"
                  : "focus:ring-[#830E13]"
              }`}
            />
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 transition pl-10 ${
                touched.password && errors.password
                  ? "border border-red-500 focus:ring-red-500"
                  : "focus:ring-[#830E13]"
              }`}
            />
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-gray-400 hover:text-white text-sm transition"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-white hover:text-[#830E13] transition"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
