import { useEffect, useState } from "react";


const quotes = [
  "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
  "Focus on being productive instead of busy.",
  "The key to productivity is to rotate your avoidance techniques.",
  "Start where you are. Use what you have. Do what you can.",
  "Success is the sum of small efforts, repeated day in and day out.",
];

const Home = () => {
  
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Select a random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-white">
      <div className="max-w-3xl text-center px-6">
        {/* Welcome Message */}
        <h1 className="text-4xl font-bold">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-[#ff4e50] to-[#fc913a] bg-clip-text text-transparent">
            {user?.username || "User"}!
          </span>
        </h1>
        <p className="text-gray-400 mt-2">
          Stay focused and make today productive.
        </p>

        {/* Quote */}
        <div className="mt-6 text-xl italic text-gray-300">{`"${quote}"`}</div>
      </div>
    </div>
  );
};

export default Home;
