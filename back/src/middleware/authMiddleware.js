const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debugging
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error); // Debugging
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { authenticateJWT, isAdmin };
