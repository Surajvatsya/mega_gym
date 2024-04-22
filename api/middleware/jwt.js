const jwt = require("jsonwebtoken");
require("dotenv").config();

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Failed to authenticate token" });
    }
    next();
  });
};

module.exports = verifyToken;
