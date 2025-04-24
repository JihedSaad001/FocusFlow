"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate, Link, Navigate } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess(false);

    // Validate username length
    if (formData.username.length < 3) {
      setError("Name must be at least 3 characters long");
      return;
    }

    // Validate email format with a simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password length
    if (formData.password.length < 5) {
      setError("Password must be at least 5 characters long");
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      // ✅ Ensure response is not empty before parsing JSON
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) throw new Error(data.message || "Signup failed");

      setSignupSuccess(true);
      // Clear the form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to home if already logged in
  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
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
              We've sent a verification link to your email address. Please check
              your inbox and click the link to activate your account.
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
                required
                className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
              />
              <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>

            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg shadow-[8px_-12px_15px_rgba(0,0,0,0.3)] outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
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
  );
}

export default SignUp;
