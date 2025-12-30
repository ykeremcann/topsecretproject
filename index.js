import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import adminRoutes from "./routes/admin.js";
import eventRoutes from "./routes/events.js";
import eventPostRoutes from "./routes/eventPosts.js";
import blogRoutes from "./routes/blogs.js";
import uploadRoutes from "./routes/upload.js";
import exerciseRoutes from "./routes/exercises.js";
import dietRoutes from "./routes/diets.js";
import messageRoutes from "./routes/messages.js";
import statsRoutes from "./routes/stats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

import { handleSocketConnection } from "./sockets/socketHandler.js";

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
});

// Initialize Socket Handler
handleSocketConnection(io);

// Middleware to attach io to req (optional, if we still want to emit from controllers)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika"
  max: 10000, // IP başına maksimum 100 istek
  message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.",
});

// ! RATE LIMITER TEST İÇİN KAPALI

// Middleware
app.use(helmet());
//use cors just for all localhost not just localhost:3000
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files - Uploads klasörünü serve et
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // Opsiyonel: Cross-Origin-Resource-Policy'yi disable et
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/event-posts", eventPostRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/diets", dietRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Hasta Sosyal Medyası API çalışıyor",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Sunucu hatası oluştu",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Endpoint bulunamadı" });
});

// Database bağlantısı ve server başlatma
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO ready`);
    });
  })
  .catch((error) => {
    console.error("Database bağlantı hatası:", error);
    process.exit(1);
  });
