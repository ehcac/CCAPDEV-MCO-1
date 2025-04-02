import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from "../server.js";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  console.log("📩 Received registration request:", req.body);

  // Check if all fields are provided
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: '❌ All fields are required' });
  }

  const userCollection = db.collection("UserInformation");

  try {
    const existingUser = await db.collection("UserInformation").findOne({ email });
    if (existingUser) {
      //console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: '❌ Email is already registered' });
    }

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      userID: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "student",
    };

    //saves to database
    await userCollection.insertOne(newUser);
    //console.log("✅ User registered successfully:", newUser.email);

    res.status(201).json({
      success: true,
      message: `🎉 Welcome, ${firstName}! Registration successful!`,
    });

  } catch (err) {
    console.error('🔥 Error during registration:', err);
    res.status(500).json({ message: '⚠️ Internal server error' });
  }
});



// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔑 Login attempt for:", email);

  try {
    const user = await db.collection("UserInformation").findOne({ email });
    if (!user) {
      //console.warn('🚫 Login failed: User not found');
      return res.status(400).json({ message: '❌ Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn('🚫 Login failed: Incorrect password');
      return res.status(400).json({ message: '❌ Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '21d' }
    );

    res.status(200).json({
      message: '✅ Login successful!',
      user: {
        id: user._id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        otherID: user.userID,
      },
      token,
    });

  } catch (err) {
    console.error('🔥 Error during login:', err);
    res.status(500).json({ message: '⚠️ Internal server error' });
  }
});

/*
router.post('/logout', (req, res) => {
  console.log("🚪 User logged out");
  res.status(200).json({ message: '✅ Logout successful' });
});
*/

export default router;
