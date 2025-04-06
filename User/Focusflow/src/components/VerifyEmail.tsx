"use client";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
          setError("Verification token is missing");
          setVerifying(false);
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/auth/verify-email/${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        setSuccess(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg border border-gray-700">
          {verifying ? (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">
                Verifying your email...
              </h2>
              <p className="text-gray-400 mt-2">
                Please wait while we verify your email address.
              </p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Email Verified!
              </h2>
              <p className="text-gray-300 mb-6">
                Your email has been successfully verified. You can now sign in
                to your account.
              </p>
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-red-500/20 p-3 rounded-full">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Verification Failed
              </h2>
              <p className="text-red-400 mb-6">{error}</p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-3 rounded-lg bg-gray-700 text-white font-medium transition mr-4"
                >
                  Sign Up Again
                </button>
                <button
                  onClick={() => navigate("/signin")}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
