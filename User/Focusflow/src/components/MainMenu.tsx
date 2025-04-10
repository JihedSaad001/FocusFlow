import { useNavigate } from "react-router-dom";
import {

  Layout,
 
  Spade,
  Briefcase,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

const MainMenu = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Layout className="w-12 h-12 text-[#ff4e50]" />,
      title: "Smart Workspace",
      description: "Customizable workspace with Pomodoro, music, and ambient sounds",
    },
    {
      icon: <Briefcase className="w-12 h-12 text-[#fc913a]" />,
      title: "Project Management",
      description: "Organize tasks with Kanban boards and track progress efficiently",
    },
    {
      icon: <Spade className="w-12 h-12 text-[#ff4e50]" />,
      title: "Planning Poker",
      description: "Collaborative estimation tool for agile teams",
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-[#fc913a]" />,
      title: "Team Collaboration",
      description: "Real-time chat and team planning features",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#1E1E1E] opacity-10"></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-8">
            <span className="bg-gradient-to-r from-[#830E13] via-[#ff4e50] to-[#830E13] bg-clip-text text-transparent animate-gradient-x">
              Focus Flow
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mt-8 leading-relaxed">
            Your complete productivity ecosystem. Combine focus tools, project management,
            and team collaboration in one seamless platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <button
              onClick={() => navigate("/signup")}
              className="group relative px-8 py-4 text-lg font-medium bg-gradient-to-r from-[#830E13] to-[#6B1E07] rounded-xl hover:opacity-90 transition-all duration-300 ease-out hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="px-8 py-4 text-lg border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm hover:scale-105"
            >
              Sign In
            </button>
          </div>
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  {feature.icon}
                  <h3 className="text-xl font-bold mt-4 mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Why FocusFlow Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Why Choose FocusFlow?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-white/5">
                <h3 className="text-xl font-bold mb-3">Enhanced Productivity</h3>
                <p className="text-gray-400">Boost your focus with our integrated Pomodoro timer and ambient soundscapes</p>
              </div>
              <div className="p-6 rounded-lg bg-white/5">
                <h3 className="text-xl font-bold mb-3">Team Synergy</h3>
                <p className="text-gray-400">Real-time collaboration tools including Planning Poker for agile estimation</p>
              </div>
              <div className="p-6 rounded-lg bg-white/5">
                <h3 className="text-xl font-bold mb-3">Project Success</h3>
                <p className="text-gray-400">Track and manage projects efficiently with our intuitive Kanban system</p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">How It Works</h2>
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg bg-white/5">
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-3">1. Smart Workspace</h3>
                  <p className="text-gray-400">Create your ideal work environment with customizable layouts, background music, and productivity tools</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg bg-white/5">
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-3">2. Team Planning</h3>
                  <p className="text-gray-400">Collaborate with your team using Planning Poker for accurate story point estimation</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg bg-white/5">
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-3">3. Project Tracking</h3>
                  <p className="text-gray-400">Monitor progress and manage tasks with our visual project management tools</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
         
        </div>
      </section>
    </div>
  );
};

export default MainMenu;
