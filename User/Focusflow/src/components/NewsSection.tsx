"use client";

import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

type Article = {
  id: number;
  title: string;
  url: string;
  published_at: string;
  user: {
    name: string;
  };
};

type ProductivityTip = {
  id: number;
  tip: string;
  source: string;
};

// Curated productivity tips
const productivityTips: ProductivityTip[] = [
  {
    id: 1,
    tip: "Use the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.",
    source: "Pomodoro Technique",
  },
  {
    id: 2,
    tip: "Plan tomorrow's tasks at the end of your workday.",
    source: "Time Management Experts",
  },
  {
    id: 3,
    tip: "Tackle your most challenging task first thing in the morning.",
    source: "Eat That Frog - Brian Tracy",
  },
  {
    id: 4,
    tip: "Group similar tasks together to minimize context switching.",
    source: "Deep Work - Cal Newport",
  },
  {
    id: 5,
    tip: "Take short breaks to maintain focus and prevent burnout.",
    source: "Productivity Research",
  },
  {
    id: 6,
    tip: "Use ambient sounds to improve concentration and focus.",
    source: "Focus Flow",
  },
  {
    id: 7,
    tip: "Set specific, measurable goals for each work session.",
    source: "SMART Goals Framework",
  },
  {
    id: 8,
    tip: "Minimize distractions by silencing notifications during focus time.",
    source: "Digital Minimalism",
  },
  {
    id: 9,
    tip: "Review your productivity data weekly to identify improvement areas.",
    source: "Continuous Improvement",
  },
  {
    id: 10,
    tip: "Maintain a consistent sleep schedule to optimize energy levels.",
    source: "Sleep Foundation",
  },
];

const NewsSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tips, setTips] = useState<ProductivityTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Fetch from Dev.to API - completely free and no API key required
      const response = await fetch("https://dev.to/api/articles?top=7");
      if (!response.ok) throw new Error("Failed to fetch articles");

      const data = await response.json();
      setArticles(data.slice(0, 3)); // Get first 3 articles

      // Get 3 random productivity tips
      const shuffled = [...productivityTips].sort(() => 0.5 - Math.random());
      setTips(shuffled.slice(0, 3));

      setError("");
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-gray-800 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dev News & Productivity Tips</h2>
        <button
          onClick={fetchNews}
          className="p-2 rounded-full hover:bg-[#252525] transition-colors"
          aria-label="Refresh news"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : (
        <div className="space-y-4">
          {/* Dev News */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              LATEST DEV NEWS
            </h3>
            <div className="space-y-3">
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg hover:bg-[#252525] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(article.published_at).toLocaleDateString()} •{" "}
                        {article.user.name}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Productivity Tips */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              PRODUCTIVITY TIPS
            </h3>
            <div className="space-y-3">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3 rounded-lg bg-[#252525]">
                  <p className="text-white">{tip.tip}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Source: {tip.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsSection;
