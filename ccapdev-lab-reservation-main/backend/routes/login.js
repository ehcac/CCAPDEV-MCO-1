import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDB } from "../server.js";
const db = getDB();

const router = express.Router();

router.post("/", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }

    try {
        const user = await db.collection("UserInformation").findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        //TODO: hashing
        if (password !== user.password) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        
        //TODO: jwt token
        const token = jwt.sign({userID: user._id}, "your-secret-key", { expiresIn: "3w" });
        res.json({ 
            user: { 
                id: user._id, 
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
                otherID: user.userID
            }, 
            token 
        });        

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


export default router;
