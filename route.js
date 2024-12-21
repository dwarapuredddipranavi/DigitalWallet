const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const router = express.Router();
const { JWT_SECRET } = process.env;

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Add money
router.post("/add-money", authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const user = await User.findById(req.user.id);
    user.balance += amount;
    await user.save();

    const transaction = new Transaction({
      user: user._id,
      amount,
      type: "credit",
    });
    await transaction.save();

    res.json({ message: "Money added successfully", balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make transaction
router.post("/transfer", authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (amount <= 0 || user.balance < amount)
      return res.status(400).json({ error: "Insufficient funds" });

    user.balance -= amount;
    await user.save();

    const transaction = new Transaction({
      user: user._id,
      amount,
      type: "debit",
    });
    await transaction.save();

    res.json({ message: "Transaction successful", balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;