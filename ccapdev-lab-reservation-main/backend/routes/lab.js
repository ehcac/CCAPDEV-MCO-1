import express from "express";

const router = express.Router();
import { getDB } from "../server.js";
const db = getDB();


router.get('/:labID', async (req, res) => {
    const { labID } = req.params;
    try {
        const lab = await db.collection("Labs").findOne({ name:labID }); 
        if (!lab) return res.status(404).json({ error: "Lab not found" });
        res.json({ lab });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/', async (req, res) => {
    try {
        const lab = await db.collection("Labs").find().toArray();
        if (!lab) return res.status(404).json({ error: "Lab not found" });
        res.json({ lab });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
