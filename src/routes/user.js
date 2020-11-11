const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");
const router = new express.Router();

router.get("/users/all", async (req, res) => {
  try {
    const response = await User.find();
    res.send(response);
  } catch (e) {
    res.status(500).send({ error: "Something went wrong !!" });
  }
});

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token, message: "logged in successfully !" });
  } catch (e) {
    res.status(400).send({ error: (e && e.message) || "Can't log in now !!" });
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();

    res.send({ message: "successfully logged out !!" });
  } catch (e) {
    res.status(500).send({ error: "Something went wrong !!" });
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send({ error: "Something went wrong !!" });
  }
});

// Update user without auth token :

router.patch("/users/:_id", async (req, res) => {
  const { _id } = req.params;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const user = await User.findOne({ _id });
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// When Admin wants to delete mentor in this case auth token is not required

router.delete("/users/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await User.findOne({ _id });
    await user.remove();
    res.send({ message: "Account removed successfully !!" });
  } catch (e) {
    res.status(500).send({ error: "Something went wrong !!" });
  }
});

// Where mentor wants to delete himself (auth token required) :
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send({ message: "Account removed successfully !!" });
  } catch (e) {
    res.status(500).send({ error: "Something went wrong !!" });
  }
});

// Update user with auth token :

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
