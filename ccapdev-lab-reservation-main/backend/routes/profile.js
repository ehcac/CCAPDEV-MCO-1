import express from "express";
import { db } from "../server.js";
import { ObjectId } from "mongodb";  
const router = express.Router();

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mime from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads")); 
    },
    filename: function (req, file, cb) {
        const ext = mime.extension(file.mimetype) || "png"; 
        cb(null, `profile_${Date.now()}.${ext}`); 
    }
});

const upload = multer({ storage: storage });

//for logged-in user profile
router.get("/:id", async (req, res) => {
    const userId = req.params.id;
    
    try {
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        let userObjectId;
        try {
            userObjectId = new ObjectId(userId);  
        } catch (error) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const user = await db.collection("UserInformation").findOne({ _id: userObjectId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const fullName = `${user.firstName} ${user.lastName}`

        res.json(user);  
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//for public profiles
router.get("/user/:id", async (req, res) => {
    const userId = req.params.id;
    
    try {
        const user = await db.collection("UserInformation").findOne({ userID: userId});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const fullName = `${user.firstName} ${user.lastName}`

        res.json(user);  
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//edit profile
router.post("/:id", upload.single("profilePicture"), async (req, res) => {
    console.log(`POST request received for updating ID: ${req.params.id}`);
    
    try {
        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);

        const userId = req.params.id;
        let userObjectId;

        try {
            userObjectId = new ObjectId(userId);
        } catch (error) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const existingUser = await db.collection("UserInformation").findOne({ _id: userObjectId });
        console.log("Existing user before update:", existingUser);

        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const result = await db.collection("UserInformation").updateOne(
            { _id: userObjectId },
            { 
                $set: { 
                    description: req.body.description,
                    ...(req.file && { profilePicture: `/uploads/${req.file.filename}` }) 
                }
            }
        );

        //console.log("Update result:", result);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await db.collection("UserInformation").findOne({ _id: userObjectId });
        console.log("Updated user profile:", updatedUser);

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
