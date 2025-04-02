import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv"; // Import dotenv

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import reservationsRoutes from "./routes/reservations.js";
import loginRoutes from "./routes/login.js"; 
import userRoutes from "./routes/users.js";
import profileRoutes from "./routes/profile.js";
import labRoutes from "./routes/lab.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json()); 
const frontendURL = process.env.FRONTEND_URL || "https://lab-reservation-system.vercel.app";

app.use(cors({
  origin: "https://lab-reservation-system.vercel.app/", 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Use MONGO_URI from environment variable 
const databaseURL = process.env.MONGODB_URI;
const dbName = "lab-reservation-system"; 

let db;

MongoClient.connect(databaseURL, { useUnifiedTopology: true })
  .then(client => {
    console.log("MongoDB Connected");
    db = client.db(dbName);
  })
  .catch(err => console.error("MongoDB Connection Failed:", err));

app.use("/api/reservations", reservationsRoutes);
app.use("/api/login", loginRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 
app.use("/api/lab", labRoutes);
app.use("/api/auth", authRoutes);

app.get('/favicon.ico', (req, res) => {
  res.status(204).send();  // No content for the favicon request
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(5000, () => console.log("Server running on port 5000"));

export default app;
export { db };
