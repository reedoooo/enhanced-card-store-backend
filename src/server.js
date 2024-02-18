"use strict";

// Core Dependencies
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const morgan = require("morgan");
const compression = require("compression");
const fs = require("fs");

// Custom Modules
const { initSocket } = require("./socket");
const { setupSocketEvents } = require("./socketEvents");
const routes = require("./routes");
// const errorHandler = require("./middleware/errorHandler");
const apiLimiter = require("./middleware/rateLimit");
// const logPerformance = require("./middleware/logPerformance");
const handleStripePayment = require("./middleware/handleStripePayment");
const { unifiedErrorHandler } = require("./middleware/unifiedErrorHandler");

// Load Environment Variables
require("dotenv").config({
  path: path.join(__dirname, "configs", ".env"),
});

// App Initialization
const app = express();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myapp";
console.log("MONGO_URI: ", MONGO_URI);
const PORT = process.env.PORT || 3001;
// Apply Middleware
app.use(cors()); // Simplified CORS (customize as needed)
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" })); // Optimized limit
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  morgan("common", {
    stream: fs.createWriteStream(
      path.join(__dirname, "./logs/info/access.log"),
      {
        flags: "a",
      }
    ),
  })
);
app.use("/api/", apiLimiter);
// app.use(logPerformance);
app.use(express.static(path.join(__dirname, "../public"))); // Corrected path for static files

// Stripe Payment Route
app.post("/api/stripe/checkout", handleStripePayment);

// API Routes
app.use("/api", routes);

// Basic Routes
app.get("/", (req, res) => res.send("Welcome to the API."));

// Unified Error Handling
// app.use(errorHandler); // Note: This replaces the generic error handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  unifiedErrorHandler(error, req, res, next);
});
// Socket Initialization
const server = http.createServer(app);
initSocket(server);
setupSocketEvents();

// MongoDB Connection and Server Start
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
  )
  .catch((error) => console.error("MongoDB connection error:", error));

module.exports = { app };
