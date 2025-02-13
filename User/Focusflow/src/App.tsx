import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import MainMenu from './components/MainMenu'; // Pre-login page

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#121212]">
        <Navbar />
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* NEW */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
