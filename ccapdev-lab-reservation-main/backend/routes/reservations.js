import express from "express";
import { db } from "../server.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const reservations = await db.collection("ReservationsByUsers").aggregate([
            {
                $lookup: {
                    from: "UserInformation",
                    localField: "userID",
                    foreignField: "userID",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    "_id": 1,
                    "userID": 1,
                    "userDetails.firstName": 1,
                    "userDetails.lastName": 1,
                    "labID": 1,
                    "startTime": 1,
                    "endTime": 1,
                    "seatNumber": 1,
                    "createdAt": 1,
                    "isAnonymous": 1,
                    "updatedAt": 1
                }
            }
        ]).toArray();

        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


  
router.get("/:userID", async (req, res) => {
    try {
        const userId = req.params.userID; 
        console.log("Request parameters:", req.params);

        let matchStage = {};

        if (ObjectId.isValid(userId)) {
            matchStage = { userID: new ObjectId(userId) }; 
        } else {
            matchStage = { userID: userId }; 
        }

        const reservations = await db.collection("ReservationsByUsers").aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "UserInformation",
                    localField: "userID",
                    foreignField: "userID",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    "_id": 1,
                    "userDetails.firstName": 1,
                    "userDetails.lastName": 1,
                    "labID": 1,
                    "startTime": 1,
                    "endTime": 1,
                    "seatNumber": 1,
                    "createdAt": 1,
                    "isAnonymous": 1,
                    "updatedAt": 1
                }
            }
        ]).toArray();

        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/*
//TODO: consider when timeslots > 1 FOR EFFICIENCY
router.get("/seats", async(req,res) => {
    try{
        const { labID, startTime } = req.query;
        if (!labID || !selectedDate) {
            return res.status(400).json({ error: "Missing required parameters (labID, selectedDate)." });
        }

//       const formattedDate = new Date(selectedDate).toISOString().split("T")[0];
        const reservations = await db.collection("ReservationsByUsers").find({
            labID,
            startTime
        })

        return reservations;
    } catch (error) {
        console.error("Error fetching reservation by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
*/


// gets original reservation / reservation to be edited
router.get("/edit/:id", async (req, res) => {
    try {
        const reservationId = req.params.id;

        if (!ObjectId.isValid(reservationId)) {
            return res.status(400).json({ message: "Invalid reservation ID format" });
        }

        const reservation = await db.collection("ReservationsByUsers").aggregate([
            { $match: { _id: new ObjectId(reservationId) } },
            {
                $lookup: {
                    from: "UserInformation",
                    localField: "userID",
                    foreignField: "userID",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    "_id": 1,
                    "userDetails.firstName": 1,
                    "userDetails.lastName": 1,
                    "labID": 1,
                    "startTime": 1,
                    "endTime": 1,
                    "seatNumber": 1,
                    "createdAt": 1,
                    "isAnonymous": 1,
                    "updatedAt": 1
                }
            }
        ]).toArray();

        if (reservation.length === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        res.json(reservation[0]); 
    } catch (error) {
        console.error("Error fetching reservation by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/resEdit/:id', async (req, res) => { 
    try {
        const reservationId = req.params.id;
        const { labID, startTime, endTime, seatNumber, isAnonymous } = req.body;
        
        if ( !labID || !startTime || !endTime || !seatNumber) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (!ObjectId.isValid(reservationId)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        const startDates = Array.isArray(startTime) ? startTime.map(time => new Date(time)) : [new Date(startTime)];
        const endDates = Array.isArray(endTime) ? endTime.map(time => new Date(time)) : [new Date(endTime)];

        const existingReservation = await db.collection('ReservationsByUsers').findOne({ _id: new ObjectId(reservationId) });
        
        if (!existingReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        const updatedData = {
            labID,
            seatNumber,
            startTime: startDates,  
            endTime: endDates,      
            updatedAt: new Date(),
        };

        // Update the reservation in the database
        const result = await db.collection('ReservationsByUsers').updateOne(
            { _id: new ObjectId(reservationId) },
            { $set: updatedData }
        );

        console.log("Updated in DB: ", result);

        // Check if the reservation was updated
        if (result.modifiedCount > 0) {
            return res.json({ message: "Successfully edited!" });
        } else {
            return res.status(404).json({ error: "Reservation not found or no changes made" });
        }
    } catch (error) {
        console.error("Error updating reservation:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


/*
router.post('/resEdit/:id', async (req, res) => {
    try {
        const reservationId = req.params.id;
        const formData = req.body;

        if (!ObjectId.isValid(reservationId)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const [startHour, startMinute] = formData.timeslot[0].split(" - ")[0].split(":").map(Number);
        const [endHour, endMinute] = formData.timeslot[0].split(" - ")[1].split(":").map(Number);

        const selectedDate = new Date(formData.day);
        selectedDate.setHours(startHour, startMinute, 0, 0);
        const startTime = new Date(selectedDate.toISOString());

        selectedDate.setHours(endHour, endMinute, 0, 0);
        const endTime = new Date(selectedDate.toISOString());

        const updatedData = {
            labID: formData.room,
            seatNumber: parseInt(formData.selectedSeat, 10),
            startTime: startTime.toISOString(), 
            endTime: endTime.toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection('ReservationsByUsers').updateOne(
            { _id: new ObjectId(reservationId) }, 
            { $set: updatedData }
        );

        console.log("Updated in DB: ", result);

        if (result.modifiedCount > 0) {
            return res.json({ message: "Successfully edited!" });
        } else {
            return res.status(404).json({ error: "Reservation not found or no changes made" });
        }
    } catch (error) {
        console.error("Error updating reservation:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
*/


// adds to database
router.post("/", async (req, res) => {
    try {
        const { userID, labID, startTime, endTime, seatNumber, isAnonymous } = req.body;

        if (!userID || !labID || !startTime || !endTime || !seatNumber) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const startDates = Array.isArray(startTime) ? startTime.map(time => new Date(time)) : [new Date(startTime)];
        const endDates = Array.isArray(endTime) ? endTime.map(time => new Date(time)) : [new Date(endTime)];
        //const endDate = new Date(endTime);

        //console.log("startDate ", startDates);
        //console.log("endDate ", endDates);

        //if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        //    return res.status(400).json({ message: "Invalid date format" });
        //}
        const reservationsCollection = db.collection("ReservationsByUsers");

        // check if the seat is already reserved
        const existingReservation = await db.collection("ReservationsByUsers").findOne({
            labID,
            seatNumber,
            startTime: { $lte: endDates },
            endTime: { $gte: startDates }
        });

        if (existingReservation) {
            return res.status(409).json({ message: "Seat already reserved for this time slot" });
        }

        // create a new reservation
        const newReservation = {
            userID,
            labID,
            startTime: startDates,
            endTime: endDates,
            seatNumber,
            isAnonymous: isAnonymous ?? false,
            createdAt: new Date(),
            updatedAt: new Date()
        };


        // save to the database
        await reservationsCollection.insertOne(newReservation);

        res.status(201).json({ message: "Reservation successful", reservation: newReservation });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//delete
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReservation = await db.collection("ReservationsByUsers").deleteOne({ _id: new ObjectId(id) });

        if (deletedReservation.deletedCount === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/deleteAll/:id", async (req, res) => {
    const userID = req.params.id;  
    console.log(`Deleting all reservations for userID: ${userID}`);
    
    try {
        const result = await db.collection("ReservationsByUsers").deleteMany({ userID: userID });
        if (result.deletedCount > 0) {
            //console.log(`${result.deletedCount} reservations deleted for userID: ${userID}`);
            return res.status(200).json({ message: `The profile was deleted together with their ${result.deletedCount} reservation(s).`});
        } else {
            return res.status(200).json({ message: `The profile was deleted together with their ${result.deletedCount} reservation(s).` });
        }
    } catch (error) {
        console.error('🔥 Error deleting reservations:', error);
        return res.status(500).json({ message: '⚠️ Internal server error' });
    }
});

export default router;