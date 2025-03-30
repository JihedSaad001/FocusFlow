"use client";

import type React from "react";

import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      setSuccess(true);
      setEmail("");
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
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start mb-6">
              <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-500">
                  If your email is registered, you will receive a password reset
                  link shortly.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Please check your inbox and follow the instructions to reset
                  your password.
                </p>
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

              <p className="text-gray-400">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/30 text-white px-4 py-3 rounded-lg shadow-lg outline-none focus:ring-2 focus:ring-[#830E13] transition pl-10"
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
