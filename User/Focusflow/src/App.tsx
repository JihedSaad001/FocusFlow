import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import MainMenu from "./components/MainMenu";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Home from "./components/Home";
import Workspace from "./components/Workspace/Workspace";
import KanbanBoard from "./components/KanbanBoard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import ProjectDetails from "./components/ProjectDetails/ProjectDetails";
import PlanningSession from "./components/Poker/PlanningSession";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";

import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#121212]">
        <Routes>
        
          <Route path="/" element={<MainMenu />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/createProject"
            element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/poker"
            element={
              <ProtectedRoute>
                <PlanningSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route - Redirect to main menu */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
