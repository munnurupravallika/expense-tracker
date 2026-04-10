const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://expense-tracker-three-pearl-70.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error:", err));

// MODELS
const transactionSchema = new mongoose.Schema({
  userId: String,
  title: String,
  amount: Number,
  date: String,
  type: String,
  category: String,
});
const Transaction = mongoose.model("Transaction", transactionSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// TRANSACTIONS
app.get("/transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions" });
  }
});
app.post("/transactions", verifyToken, async (req, res) => {
  try {
    const newTransaction = new Transaction({
      ...req.body,
      userId: req.userId,
    });

    await newTransaction.save();
    res.json({ message: "Transaction added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding transaction" });
  }
});

app.delete("/transactions/:id", verifyToken, async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting transaction" });
  }
});

app.delete("/transactions", verifyToken, async (req, res) => {
  try {
    await Transaction.deleteMany({ userId: req.userId });
    res.json({ message: "All transactions cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing transactions" });
  }
});

// AUTH
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ message: "Error signing up" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});