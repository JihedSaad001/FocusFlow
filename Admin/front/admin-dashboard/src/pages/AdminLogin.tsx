import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationCircle } from "react-icons/fa";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    { email: false, password: false }
  );
  const navigate = useNavigate();

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

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }

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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Mark all fields as touched for validation
    setTouched({ email: true, password: true });

    // Validate all fields
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

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

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://focusflow-production.up.railway.app";
      const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

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
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 rounded bg-[#1C1C1C] text-gray-300 border focus:ring-2 outline-none ${
                  touched.email && errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-[#333] focus:ring-red-500"
                }`}
              />
              {touched.email && errors.email && (
                <div className="flex items-center mt-1 text-xs text-red-400">
                  <FaExclamationCircle className="mr-1" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 rounded bg-[#1C1C1C] text-gray-300 border focus:ring-2 outline-none ${
                  touched.password && errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-[#333] focus:ring-red-500"
                }`}
              />
              {touched.password && errors.password && (
                <div className="flex items-center mt-1 text-xs text-red-400">
                  <FaExclamationCircle className="mr-1" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>
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
