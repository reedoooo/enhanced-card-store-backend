"use strict";

// 1. Environment and Dependencies
// Core Dependencies
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const compression = require("compression");

// Middleware and Routes
const routes = require("./routes");
const handleStripePayment = require("./middleware/handleStripePayment");
const { morganMiddleware } = require("./middleware/morganMiddleware");
const { unifiedErrorHandler } = require("./middleware/logErrors");

// Load environment variables
require("dotenv").config({
  path: path.join(__dirname, "configs", ".env"),
});

// 2. App Initialization
const app = express();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myapp";
const environment = process.env.NODE_ENV || 'development';

const PORT = process.env.PORT || 3001;

// 3. Middleware Configuration
// CORS options
const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morganMiddleware);
app.use(express.static(path.join(__dirname, "../public")));

// 4. Route Definitions
// Stripe Payment Route
app.post("/api/stripe/checkout", handleStripePayment);

// API Routes
app.use("/api", routes);

// Basic route
app.get("/", (req, res) => res.send("Welcome to the API."));

// 5. Error Handling
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  unifiedErrorHandler(error, req, res, next);
});

// 6. Server and Database Initialization
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  // Different behavior based on environment
  if (environment === 'production') {
    // In production, just start the server
    server.listen(PORT, () => console.log(`Server running on port ${PORT} in production mode`));
  } else {
    // In development or other environments, additional logs or actions can be implemented
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${environment} mode`);
      // For example, in development, you might want to automatically open the browser
      if (environment === 'development') {
        console.log('Starting in development mode with additional logging.');
      }
    });
  }
})
.catch((error) => console.error("MongoDB connection error:", error));
module.exports = { app };
