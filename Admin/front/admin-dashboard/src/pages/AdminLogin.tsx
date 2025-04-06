import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/admin-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      console.log("✅ Login Success:", data);

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
        navigate("/admin/dashboard");
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      console.error("🔥 Login Error:", err);
      setError("Failed to login.");
    }
  };

  return (
    <div className="relative flex min-h-screen  w-full items-center justify-center px-6 py-10 bg-black text-white">
      {/* Top Right Red Blur Effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600 opacity-40 blur-[120px] rounded-full"></div>

      {/* Bottom Left Red Blur Effect */}
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-700 opacity-30 blur-[120px] rounded-full"></div>

      {/* Login Form */}
      <div className="relative w-full max-w-sm bg-[#0E0E0E] p-8 rounded-lg shadow-lg border border-[#222]">
        <h2 className="text-xl font-semibold text-center text-gray-100">
          Login to your account
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Enter your email below to login to your account
        </p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#1C1C1C] text-gray-300 border border-[#333] focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400"
              >
                Password
              </label>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-300">
                Forgot your password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#1C1C1C] text-gray-300 border border-[#333] focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-50 p-2 rounded text-black font-semibold hover:bg-red-700 hover:text-white transition"
          >
            Login
          </button>
          {error && <p className="text-red-50 text-center text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
