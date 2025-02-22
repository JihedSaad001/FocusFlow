import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

      navigate("/signin"); // Redirect after signup
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-center">{error}</p>}

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
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="text-white hover:text-[#830E13] transition"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
