import { useEffect, useState } from "react";
import { uploadFile, fetchResources, deleteResource } from "../api";
import { FaUpload, FaTrash, FaDownload } from "react-icons/fa";

const ResourcesDatabase = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("wallpapers");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchResources();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load resources", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return console.error("❌ No file selected!");
    console.log("📂 Uploading file:", file.name, "Category:", category);

    setLoading(true);
    try {
      await uploadFile(file, category, token);
      console.log("✅ Upload Successful!");
      loadResources();
    } catch (error) {
      console.error("🔥 Upload failed", error);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteResource(id, token);
      loadResources();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 mt-20 md:px-12 lg:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Resources Database</h1>
        <div className="bg-[#151515] p-6 rounded-lg shadow-lg border border-white/20">
          <h2 className="text-xl font-semibold mb-4">Upload a Resource</h2>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
          >
            <option value="wallpapers">Wallpapers</option>
            <option value="audio">Audio</option>
          </select>
          <button
            onClick={handleUpload}
            className="bg-red-500 px-6 py-2 rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaUpload /> Upload
          </button>
          <h2 className="text-xl font-semibold mt-8 mb-4">
            Available Resources
          </h2>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-120 mb-4 p-2 border border-gray-600 rounded-lg bg-black"
          />

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files
                .filter((file) =>
                  file.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((file) => (
                  <div
                    key={file.id}
                    className="bg-[#151515] p-4 rounded-lg shadow-lg border border-white/20 flex justify-between items-center"
                  >
                    <p>{file.name}</p>
                    <div className="flex space-x-2">
                      <a
                        href={file.url}
                        download
                        className="bg-green-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                      >
                        <FaDownload />
                      </a>
                      {token && (
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="bg-red-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcesDatabase;
