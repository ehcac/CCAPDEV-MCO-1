import express from "express";

// Fetch available slots for a lab on a specific day
export const getAvailableSlots = async (req, res) => {
  try {
    const { labID, date } = req.params;

    if (!mongoose.Types.ObjectId.isValid(labID)) {
      return res.status(400).json({ error: "Invalid labID format" });
    }
    const labObjectId = new mongoose.Types.ObjectId(labID);

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const now = new Date();
    
    const reservations = await ReservationByUser.find({
      labID: labObjectId,
      startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Generate 30-minute time slots (from 7:00 AM - 6:00 PM)
    const timeSlots = [];
    let startTime = new Date(startOfDay);
    startTime.setHours(7, 0, 0, 0);

    while (startTime.getHours() < 18) {
      const endTime = new Date(startTime.getTime() + 30 * 60000);

      // Skip past time slots (only allow future slots)
      if (startTime < now) {
        startTime = endTime;
        continue;
      }

      // Check if the slot is taken
      const isTaken = reservations.some(res =>
        (startTime >= res.startTime && startTime < res.endTime) ||
        (endTime > res.startTime && endTime <= res.endTime)
      );

      if (!isTaken) {
        timeSlots.push({ startTime: startTime.toISOString(), endTime: endTime.toISOString() });
      }
      startTime = endTime;
    }

    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch available seats for a lab at a specific time
export const getAvailableSeats = async (req, res) => {
  try {
    const { labID, startTime } = req.params;
    const endTime = new Date(new Date(startTime).getTime() + 30 * 60000);

    if (!mongoose.Types.ObjectId.isValid(labID)) {
      return res.status(400).json({ error: "Invalid labID format" });
    }
    const labObjectId = new mongoose.Types.ObjectId(labID);

    const occupiedSeats = await ReservationByUser.find(
      {
        labID: labObjectId,
        $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
      },
      { seatNumber: 1 }
    );

    const occupiedSeatNumbers = occupiedSeats.map(res => res.seatNumber);
    const totalSeats = 30;
    const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1)
      .filter(seat => !occupiedSeatNumbers.includes(seat));

    res.json(availableSeats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a reservation for students
export const reserveSlotByUser = async (req, res) => {
  try {
    const { userID, labID, startTime, endTime, seatNumber, isAnonymous } = req.body;
    
    const newReservation = new ReservationByUser({ userID, labID, startTime, endTime, seatNumber, isAnonymous });
    await newReservation.save();

    const io = req.app.get("io");
    io.emit("updateReservations", { labID });

    res.status(201).json({ message: "Student reservation successful" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create a reservation for lab technicians
export const reserveSlotByTechnician = async (req, res) => {
  try {
    const { technicianID, labID, startTime, endTime, reason } = req.body;
    
    const newReservation = new ReservationByLabTechnician({
      reservationID: new mongoose.Types.ObjectId(),
      labID,
      startTime,
      endTime,
      reason,
      technicianID
    });

    await newReservation.save();
    res.status(201).json({ message: "Technician reservation successful" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch all student reservations
export const getUserReservations = async (req, res) => {
  try {
    const reservations = await ReservationByUser.find()
      .populate({ path: "userID", model: "User", select: "email firstName lastName" })
      .populate({ path: "labID", model: "Lab", select: "name" });

    const formattedReservations = reservations.map(res => ({
      _id: res._id,
      userEmail: res.isAnonymous ? "Anonymous" : res.userID?.email || "Andrei Balingit",
      labName: res.labID?.name || "GK301",
      startTime: res.startTime,
      endTime: res.endTime,
      seatNumber: res.seatNumber
    }));

    res.json(formattedReservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch all technician reservations
export const getTechnicianReservations = async (req, res) => {
  try {
    const reservations = await ReservationByLabTechnician.find()
      .populate("technicianID", "email")
      .populate("labID", "name");

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a student reservation
export const removeUserReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await ReservationByUser.findByIdAndDelete(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const io = req.app.get("io");
    io.emit("updateReservations", { labID: reservation.labID });

    res.json({ message: "Student reservation removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a technician reservation
export const removeTechnicianReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    await ReservationByLabTechnician.findByIdAndDelete(reservationId);
    res.json({ message: "Technician reservation removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
