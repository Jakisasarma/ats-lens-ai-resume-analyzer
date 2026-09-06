import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errorHandler.js";

/* =========================================================
   ENV
========================================================= */

dotenv.config();

/* =========================================================
   APP
========================================================= */

const app = express();

const PORT =
  process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

/* =========================================================
   SECURITY
========================================================= */

app.use(
  helmet()
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

/* =========================================================
   RATE LIMIT
========================================================= */

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 200,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api",
  apiLimiter
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/* =========================================================
   HOME
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,

      name:
        "ATS LENS BACKEND",

      message:
        "AI Resume Analyzer API is running.",

      server:
        `http://localhost:${PORT}`,

      health:
        `http://localhost:${PORT}/api/health`,
    });
  }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "ATS Lens API is healthy.",

      database:
        app.locals
          .dbConnected
          ? "Connected"
          : "Disconnected",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* =========================================================
   ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/resume",
  resumeRoutes
);

/* =========================================================
   404
========================================================= */

app.use(
  notFound
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  errorHandler
);

/* =========================================================
   DATABASE + SERVER START
========================================================= */

const startServer =
  async () => {
    try {
      await connectDB();

      app.locals.dbConnected =
        true;

      app.listen(
        PORT,
        () => {
          console.log(
            ""
          );

          console.log(
            "=============================="
          );

          console.log(
            "🚀 ATS LENS BACKEND"
          );

          console.log(
            "=============================="
          );

          console.log(
            `✅ Server: http://localhost:${PORT}`
          );

          console.log(
            `❤️ Health: http://localhost:${PORT}/api/health`
          );

          console.log(
            "🗄️ Database: Connected"
          );

          console.log(
            "=============================="
          );

          console.log(
            ""
          );
        }
      );
    } catch (error) {
      app.locals.dbConnected =
        false;

      console.error(
        "❌ Server startup failed:"
      );

      console.error(
        error.message
      );

      process.exit(1);
    }
  };

startServer();