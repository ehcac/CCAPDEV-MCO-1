import express from "express";
import { db } from "../server.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await db.collection("UserInformation").find().toArray();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


export default router;
  