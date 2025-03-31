import express from "express";
import {MongoClient} from "mongodb";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
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
app.use(cors()); 

const databaseURL = "mongodb://127.0.0.1:27017"; 
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


app.listen(5000, () => console.log("Server running on port 5000"));
export { db };