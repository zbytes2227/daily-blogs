const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
const _ = require('lodash');

const homeStartingContent = "Welcome to My blog-site project.";
const aboutContent = "Hey, I am zbytes, I have created this blog site using nodejs,mongoDB and passportJs. Try out my application...";
const contactContent = "email me on: zbytes1@outlook.com";

const PORT = process.env.PORT;
const dbURL = process.env.DB_url;
const mySecret = process.env.session_secret;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// INITIALIZING SESSION AND PASSPORT
app.use(session({
  secret: mySecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



// Connect to Database
mongoose.connect(dbURL, () => {
  console.log("Database Status: Connected");
})

// Creating a Schema for Blog Posts
const blogSchema = new mongoose.Schema({
  blogTitle: {
    type: String
  },
  blogPost: {
    type: String
  },
  link: {
    type: String
  }
});

// Create an Admin user Schema
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// Add Plugin passportLocalMongoose to Admin User Schema.
adminSchema.plugin(passportLocalMongoose);


// Models Mongodb
const Blog = new mongoose.model('Blogs', blogSchema);
const User = new mongoose.model('User', adminSchema);

// createStrategy
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// All GET routes
app.get('/', (req, res) => {
  Blog.find({}, (err, posts) => {
    if (!err) {
      res.render('home', { homeContent: homeStartingContent, allPosts: posts });
    }
  })
});


app.get('/about', (req, res) => {
  res.render('about', { aboutContent: aboutContent });
});


app.get('/contact', (req, res) => {
  res.render('contact', { contactContent: contactContent });
});


app.get('/error', (req, res) => {
  res.send("Error");
});


app.get('/admin', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('admin')
  } else {
    res.render('login');
  }
});


app.get('/admin/compose', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('compose');
  }
  else {
    res.sendStatus(404);
  }
});


app.get('/allarticles', (req, res) => {
  if (req.isAuthenticated()) {
    Blog.find({}, (err, posts) => {
      if (!err) {
        res.render('allarticles', { allPosts: posts });
      }
    })
    // res.render('allarticles');
  }
  else {
    res.sendStatus(404);
  }
});


app.get('/admin/adduser', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('newuser');
  }
  else {
    res.sendStatus(404);
  }
});


app.get('/posts/:blogTitle', (req, res) => {
  var requested_title = _.lowerCase(req.params.blogTitle);
  Blog.find({}, (err, post) => {
    if (!err) {
      post.forEach((post) => {
        var stored_postTitle = _.lowerCase(post.blogTitle);
        if (requested_title === stored_postTitle) {
          res.render('post', { postTitle: post.blogTitle, postData: post.blogPost });
        }
      });
    };
  });

});





// All POST Routes

app.post('/login', (req, res) => {
  // console.log(req.isAuthenticated());

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (!err) {
      passport.authenticate("local")(req, res, () => {
        res.redirect('/admin');
      });
    }
  });
});



app.post("/admin/compose", (req, res) => {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {

    var post_link = _.lowerCase(req.body.composeTitle);

    const post = new Blog({
      blogTitle: req.body.composeTitle,
      blogPost: req.body.composePost,
      link: post_link
    });

    post.save().then(() => {
      res.redirect('/');
    });
  } else {
    res.send('You need to be logged in before posting articls.');
  }
});

app.post("/admin/delete", (req, res) => {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    Blog.findOneAndDelete({ blogTitle: req.body.deleteBlog }, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/allarticles')
      }
    });
  } else {
    res.send('You need to be logged in.');
  }
});

app.post("/admin/edit", (req, res) => {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    Blog.findOne({ blogTitle: req.body.deleteBlog }, (err, post) => {
      if (err) {
        console.log(err);
      } else {
        res.render('compose', { blog_title: post.blogTitle, blog_content: post.blogPost })
      }
    });
  } else {
    res.send('You need to be logged in.');
  }
});

app.post("/admin/save", (req, res) => {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    var edit_blog_title = _.lowerCase(req.body.blogTitle);
    const saveBlog = new Blog({
      blogTitle: edit_blog_title,
      blogPost: req.body.blogPost,
    });

    saveBlog.save().then(() => {
      res.redirect('/allarticles');
    });
  } else {
    res.send('You need to be logged in.');
  }
});



app.post('/admin/adduser', (req, res) => {
  // console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
      if (!err) {
        console.log("user added");
        res.redirect('/');
      } else {
        console.log(err);
        res.redirect('/admin/adduser');
      }
    });
  } else {
    res.send('You need to be logged in.');
  }
})





app.listen(PORT, function () {
  console.log("Server Status: Running");
});