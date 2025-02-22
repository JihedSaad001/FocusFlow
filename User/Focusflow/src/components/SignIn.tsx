import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles input changes and updates form state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://focusflow-production.up.railway.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Login failed");

      // Store user data and token in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userToken", data.token);

      // Notify other components about the storage update
      window.dispatchEvent(new Event("storage"));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-center">{error}</p>}

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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white font-medium transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
