const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const upload = require("./config/multerconfig");
const authRoutes = require("./routes/auth"); // Import Auth Routes
const userModel = require("./models/user");
const postModel = require("./models/post");
const jwt = require("jsonwebtoken");
const postsRoutes = require("./routes/allPosts"); // Importing the posts route

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Routes
app.use(authRoutes); // Use the new auth routes
app.use(postsRoutes);

app.use((req, res, next) => {
  res.locals.user = req.user || null; // Makes user available in all views
  next();
});


app.get("/", (req, res) => res.render("home"));
app.get("/auth", (req, res) => res.render("auth"));
app.get("/features", (req, res) => res.render("features"));
app.get("/chatbox", (req, res) => res.render("chatbox"));


app.get("/profileupload", (req, res) => res.render("profileupload"));

app.get("/allPosts", async (req, res) => {
  let posts = await postModel.find().populate("user");
  res.render("allposts", { user: req.user, posts }); 
  console.log("posts",posts);
  
});

app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  user.profilePic = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  if (!req.user) return res.status(401).send("Unauthorized: No user found");

  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.post("/like/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("likes");

    let index = post.likes.findIndex(
      (like) => like._id.toString() === req.user.userid
    );

    let liked = false;

    if (index !== -1) {
      post.likes.splice(index, 1); // Unlike post
    } else {
      post.likes.push(req.user.userid); // Like post
      liked = true;
    }

    await post.save();

    res.json({ liked, likes: post.likes.length }); // Send updated like count
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  try {
    await postModel.findOneAndUpdate(
      { _id: req.params.id },
      { content: req.body.content },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


app.post("/postUpload",isLoggedIn,upload.single("media"),async (req, res) => {
    try {
      let user = await userModel.findOne({ email: req.user.email });
      if (!user) {
        return res.status(404).send("User not found");
      }

      let { content } = req.body;
      let media = req.file ? `${req.file.filename}` : null; // Store file path

      let post = new postModel({
        user: user._id,
        content,
        media,
      });

      await post.save();
      user.posts.push(post._id);
      await user.save();
console.log("post.media",post.media);

      res.redirect("/profile");
    } catch (error) {
      console.error("❌ Error creating post:", error);
      res.status(500).send("Error creating post");
    }
  }
);

function isLoggedIn(req, res, next) {
  if (!req.cookies.jwt) return res.send("You must be logged in");

  let data = jwt.verify(req.cookies.jwt, "secret");
  req.user = data;
  next();
}

app.listen(3000);
