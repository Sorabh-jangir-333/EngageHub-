const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");
const cookieParser = require("cookie-parser");

const isLoggedIn = async (req, res, next) => {
    if (!req.cookies.jwt) {
      req.user = null;
      return next();
    }
  
    try {
      let data = jwt.verify(req.cookies.jwt, "secret"); // Verify token
  
      const user = await User.findById(data.userid); // Fetch full user from DB
  
      if (!user) {
        req.user = null;
        return next();
      }
  
      req.user = user; // Store full user object
      next();
    } catch (error) {
      console.error("❌ Invalid Token:", error);
      req.user = null;
      next();
    }
  };
  

// function isLoggedIn(req, res, next) {
//   if (!req.cookies.jwt) return res.send("You must be logged in");

//   let data = jwt.verify(req.cookies.jwt, "secret");
//   req.user = data;
//   next();
// }

// Use the middleware in your route
router.get("/allPosts", isLoggedIn, async (req, res) => {
    console.log("🔍 Route /allPosts was hit!");

    try {
        const posts = await Post.find()
            .populate("user") // Fetch username from User model
            .sort({ date: -1 }) // Sort by newest first
            .exec();

        console.log("✅ Retrieved Posts:", posts.length, "posts found!");
        console.log("👤 User:",req.user);
        

        res.render("allPosts", { posts, user: req.user }); 
    } catch (error) {
        console.error("❌ Error fetching posts:", error);
        res.status(500).send("Error fetching posts");
    }
});

module.exports = router;
