import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-[#121212] px-8 py-4 flex justify-between items-center text-white shadow-md fixed top-0 left-0 w-full z-50">
      {/* Left: Logo */}
      <Link
        to="/"
        className="text-3xl font-extrabold bg-gradient-to-r from-[#ff4e50] to-[#fc913a] text-transparent bg-clip-text"
      >
        FocusFlow
      </Link>

      {/* Right: Sign In/Sign Up (only used on public routes) */}
      <div className="flex items-center space-x-6">
        <Link
          to="/signin"
          className="text-white text-lg hover:text-gray-300 transition"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-6 py-3 text-lg font-medium bg-gradient-to-r from-[#830E13] to-[#6B1E07] rounded-xl hover:opacity-90 transition-all duration-300 ease-out hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
