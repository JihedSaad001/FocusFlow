import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Plus, Search, LayoutGrid, List, Trash2 } from "lucide-react";
import axios from "axios";

function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Create API client function that returns a configured axios instance
  const createApiClient = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return null;
    }
    
    return axios.create({
      baseURL: "https://focusflow-production.up.railway.app/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const api = createApiClient();
        if (!api) return;

        // Get user projects
        const response = await api.get("/projects");
        setProjects(response.data);
      } catch (error: any) {
        console.error("❌ Fetch Error:", error);
        setError("Error loading projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  const deleteProject = async (projectId: string, projectName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`
    );
    if (!confirmed) return; // Exit if the user cancels

    try {
      const api = createApiClient();
      if (!api) return;

      // Delete project
      await api.delete(`/projects/${projectId}`);

      // Remove the deleted project from the state
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      );
    } catch (error: any) {
      console.error("❌ Delete Error:", error);
      setError(
        `Error deleting project: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header Section */}
          <div className="border-b border-gray-700/50">
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                    Your Projects
                  </h1>
                  <p className="text-gray-400 mt-2">
                    Manage and organize your projects
                  </p>
                </div>
                <button
                  onClick={() => navigate("/createProject")}
                  className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus size={20} />
                  <span>New Project</span>
                </button>
              </div>

              {/* Search and View Toggle */}
              <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-grow max-w-2xl">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>
                <div className="flex items-center space-x-2 bg-black/30 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${
                      viewMode === "grid"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${
                      viewMode === "list"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <p className="text-gray-400">Loading projects...</p>
              </div>
            )}

            {!loading && projects.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-black/30 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Folder className="w-12 h-12 text-red-500" />
                </div>
                <p className="text-gray-300 text-xl font-semibold">
                  No projects found
                </p>
                <p className="text-gray-500 mt-2">
                  Create your first project to get started
                </p>
              </div>
            )}

            {!loading && filteredProjects.length > 0 && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className={`group cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-black/50 rounded-xl border border-gray-700 hover:border-red-500/50 overflow-hidden transform transition-all duration-200 hover:scale-[1.02]"
                        : "bg-black/30 rounded-lg border border-gray-700 hover:border-red-500/50 transform transition-all duration-200 hover:scale-[1.01]"
                    }`}
                  >
                    <div
                      className={
                        viewMode === "grid" ? "p-6" : "p-4 flex items-center"
                      }
                    >
                      <div
                        className={`${
                          viewMode === "list" ? "flex-shrink-0 mr-6" : "mb-6"
                        }`}
                      >
                        <div className="p-4 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors duration-200">
                          <Folder className="text-red-500 w-8 h-8" />
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-semibold text-white truncate hover:underline">
                            {project.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent navigating to project details when clicking delete
                              deleteProject(project._id, project.name);
                            }}
                            className="text-red-400 hover:text-red-300 p-2 rounded-full bg-black/50 hover:bg-red-500/20 transition-colors duration-200"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="text-gray-400 mt-2 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Projects;
