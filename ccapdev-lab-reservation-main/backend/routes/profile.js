import express from "express";
import { db } from "../server.js";
import { ObjectId } from "mongodb";  
const router = express.Router();

import multer from "multer";
import { put } from "@vercel/blob";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mime from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/*
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
*/

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Edit profile with Vercel Blob storage
router.post("/:id", upload.single("profilePicture"), async (req, res) => {
    try {
        const userId = req.params.id;
        let userObjectId;

        try {
            userObjectId = new ObjectId(userId);
        } catch (error) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const existingUser = await db.collection("UserInformation").findOne({ _id: userObjectId });

        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        let profilePictureUrl = existingUser.profilePicture; // keep existing if no new upload
        if (req.file) {
            // upload the file to Vercel Blob
            const fileName = `profile_${Date.now()}.${req.file.mimetype.split("/")[1]}`;
            const { url } = await put(fileName, req.file.buffer, {
                access: "public",  // allows public access to the file
                contentType: req.file.mimetype,
            });

            profilePictureUrl = url; // update profile picture URL
        }

        // Update user profile in MongoDB
        const result = await db.collection("UserInformation").updateOne(
            { _id: userObjectId },
            { $set: { 
                description: req.body.description, 
                profilePicture: profilePictureUrl 
            } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch updated user data
        const updatedUser = await db.collection("UserInformation").findOne({ _id: userObjectId });

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: error.message });
    }
});

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

/*
//edit profile
router.post("/:id", upload.single("profilePicture"), async (req, res) => {
    try {
        const userId = req.params.id;
        let userObjectId;

        try {
            userObjectId = new ObjectId(userId);
        } catch (error) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const existingUser = await db.collection("UserInformation").findOne({ _id: userObjectId });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const updateData = {
            $set: {
                description: req.body.description,
            },
        };

        if (req.file) {
            updateData.$set.profilePicture = `/uploads/${req.file.filename}`;
        }

        const result = await db.collection("UserInformation").updateOne({ _id: userObjectId }, updateData);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await db.collection("UserInformation").findOne({ _id: userObjectId });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack,
            requestData: req.body, // Optional: includes request data for further debugging
        });
    }    
});
*/

//delete profile
router.delete("/delete/:id", async(req,res) => {
    try {
        const { id } = req.params;
        const deletedProfile = await db.collection("UserInformation").deleteOne({ _id: new ObjectId(id) });
        if (deletedProfile.deletedCount === 0) {
                return res.status(404).json({ message: "Profile not found" });
        }
        res.status(200).json({message: "Profile deleted successfully"});
    } catch (error) {
        console.error("Error deleting Profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
