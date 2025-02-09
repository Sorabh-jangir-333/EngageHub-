const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const router = express.Router();

router.post("/signup", async (req, res) => {
  let { username, email, password, name, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(400).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let newUser = await userModel.create({
        username,
        email,
        password: hash,
        name,
        age,
      });

      let token = jwt.sign({ email: email, userid: newUser._id }, "secret");
      res.cookie("jwt", token);
      res.redirect("/profile");
    });
  });
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "Please fill in all fields" });
  }

  let user = await userModel.findOne({ email });
  if (!user) return res.render("login", { error: "User not found" });

  let result = await bcrypt.compare(password, user.password);
  if (result) {
    let token = jwt.sign({ email: email, userid: user._id }, "secret");
    res.cookie("jwt", token);
    res.redirect("/profile");
  } else {
    return res.render("login", { error: "Invalid email or password" });
  }
});

router.get("/logout", (req, res) => {
  res.cookie("jwt", "", { expires: new Date(0) });
  res.redirect("/");
});

module.exports = router;
