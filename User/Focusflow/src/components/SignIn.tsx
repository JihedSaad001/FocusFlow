"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useNavigate, Link, Navigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Handles input changes and updates form state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setNeedsVerification(false);
    setResendSuccess(false);

    try {
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          throw new Error(data.message);
        }
        throw new Error(data.message || "Login failed");
      }

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
      setError(err.message);
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

    setResendingEmail(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/auth/resend-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification email");
      }

      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message);
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
              required
              className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
            />
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
            />
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
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
