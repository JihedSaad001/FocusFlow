import type React from "react";

import { useState, useEffect } from "react";
import { User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [touched, setTouched] = useState<{
    username: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
  }>({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

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
    if (name === "username") {
      if (!value.trim()) {
        return "Name is required";
      }
      if (value.length < 3) {
        return "Name must be at least 3 characters long";
      }
    }

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

    if (name === "confirmPassword") {
      if (!value.trim()) {
        return "Please confirm your password";
      }
      if (value !== formData.password) {
        return "Passwords do not match";
      }
    }

    return undefined;
  };

  // Handles input changes and updates form state with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Mark field as touched
    setTouched({ ...touched, [name as keyof typeof touched]: true });

    // Validate the field
    const fieldError = validateField(name, value);
    setErrors({ ...errors, [name]: fieldError });

    // If this is confirmPassword, also validate password match
    if (name === "password") {
      if (formData.confirmPassword) {
        const confirmError =
          formData.confirmPassword !== value
            ? "Passwords do not match"
            : undefined;
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }

    // Clear the main error message when user starts typing
    setError("");
  };

  // Handle input blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name as keyof typeof touched]: true });
    const fieldError = validateField(name, value);
    setErrors({ ...errors, [name]: fieldError });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess(false);

    // Mark all fields as touched for validation
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const usernameError = validateField("username", formData.username);
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);
    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);

    // Update errors state
    const newErrors = {
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    };
    setErrors(newErrors);

    // Check if there are any errors
    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setError(
        usernameError ||
          emailError ||
          passwordError ||
          confirmPasswordError ||
          "Please fix the errors in the form"
      );
      return;
    }

    setLoading(true);
    try {
  
      const api = axios.create({
        baseURL: "https://focusflow-production.up.railway.app/api",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await api.post("/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      console.log("Signup successful:", response.data);
      setSignupSuccess(true);
      // Clear the form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setError(
        error.response?.data?.message || error.message || "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Redirect to home if already logged in
  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          {signupSuccess ? (
            <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                Registration Successful!
              </h2>
              <p className="text-gray-300 text-center mb-6">
                We've sent a verification link to your email address. Please
                check your inbox and click the link to activate your account.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                  <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-500">{error}</p>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  name="username"
                  placeholder="Name"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 transition pl-10 ${
                    touched.username && errors.username
                      ? "border border-red-500 focus:ring-red-500"
                      : "focus:ring-[#830E13]"
                  }`}
                />
                <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                {touched.username && errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 transition pl-10 ${
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

              <div className="relative">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 transition pl-10 ${
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

              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 transition pl-10 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? "border border-red-500 focus:ring-red-500"
                      : "focus:ring-[#830E13]"
                  }`}
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition-all duration-300 ${
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-[0_0_25px_rgba(131,14,19,0.8)] hover:opacity-95 hover:scale-[1.02]"
                }`}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>

              <p className="text-center text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-white hover:text-[#830E13] transition"
                >
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default SignUp;
