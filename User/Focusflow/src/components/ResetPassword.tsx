"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      setError(
        "Reset token is missing. Please request a new password reset link."
      );
    } else {
      setToken(tokenParam);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://focusflow-production.up.railway.app/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg border border-gray-700">
          <Link
            to="/signin"
            className="text-gray-400 hover:text-white flex items-center mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>

          <h2 className="text-2xl font-bold text-white mb-6">
            Reset Your Password
          </h2>

          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Password Reset Successful!
              </h3>
              <p className="text-gray-300 mb-6">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                  <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-500">{error}</p>
                </div>
              )}

              {!token && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-500">
                    Invalid or missing reset token. Please request a new
                    password reset link.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="text-yellow-500 hover:text-yellow-400 underline text-sm font-medium mt-2 inline-block"
                  >
                    Go to Forgot Password
                  </Link>
                </div>
              )}

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token || loading}
                  className="w-full bg-black/30 text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token || loading}
                  className="w-full bg-black/30 text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>

              <button
                type="submit"
                disabled={!token || loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
