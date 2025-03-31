import express from "express";
import {
  reserveSlotByUser,
  reserveSlotByTechnician,
  getUserReservations,
  getTechnicianReservations,
  removeUserReservation,
  removeTechnicianReservation,
  getAvailableSlots, 
  getAvailableSeats
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/available-slots/:labID/:date", getAvailableSlots);
router.get("/seats/:labID/:startTime", getAvailableSeats);

router.post("/reserve/user", reserveSlotByUser);
router.get("/reservations/user", getUserReservations);
router.delete("/remove-reservation/user/:reservationId", removeUserReservation);

router.post("/reserve/technician", reserveSlotByTechnician);
router.get("/reservations/technician", getTechnicianReservations);
router.delete("/remove-reservation/technician/:reservationId", removeTechnicianReservation);

export default router;