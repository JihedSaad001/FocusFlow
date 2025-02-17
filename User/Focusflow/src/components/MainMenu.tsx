import { useNavigate } from "react-router-dom";
import {
  
  Timer,
  ListTodo,
  Music2,
  Palette,
  Calendar,
  ArrowRight,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center py-20 px-6 overflow-hidden">
        <div className="absolute  bg-[#1E1E1E] opacity-10 "></div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-[#830E13] via-[#ff4e50] to-[#830E13] bg-clip-text text-transparent animate-gradient-x">
              Stay Focused.
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#6B1E07] via-[#fc913a] to-[#6B1E07] bg-clip-text text-transparent animate-gradient-x">
              Be Productive.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mt-8 leading-relaxed">
            Your all-in-one productivity sanctuary featuring Pomodoro timers,
            to-do lists, focus music, and a distraction-free environment.
          </p>

          {/* CTA Buttons */}
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-[#ff4e50] to-[#fc913a] bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to maximize your productivity and maintain focus
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Timer className="w-8 h-8" />,
                title: "Pomodoro Timer",
                desc: "Boost focus with structured work/break cycles",
                gradient: "from-[#830E13] to-[#6B1E07]",
              },
              {
                icon: <ListTodo className="w-8 h-8" />,
                title: "Smart To-Do List",
                desc: "Organize tasks, set priorities, and track progress",
                gradient: "from-[#ff4e50] to-[#fc913a]",
              },
              {
                icon: <Music2 className="w-8 h-8" />,
                title: "Focus Music",
                desc: "Stay in the zone with curated productivity playlists",
                gradient: "from-[#830E13] to-[#6B1E07]",
              },
              {
                icon: <Palette className="w-8 h-8" />,
                title: "Custom Workspace",
                desc: "Personalize your environment for maximum focus",
                gradient: "from-[#ff4e50] to-[#fc913a]",
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Smart Calendar",
                desc: "Plan your day with intelligent scheduling",
                gradient: "from-[#830E13] to-[#6B1E07]",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                ></div>
                <div className="relative z-10">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className=""></div>
            <div className="flex gap-8">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="/blog"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Blog
              </a>
              <a
                href="/help"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Help
              </a>
            </div>
            <div></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
