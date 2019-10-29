var express = require("express"),
    bodyParser = require("body-parser"),
    request = require("request"),
    mongoose = require("mongoose"),
    Campground = require("./models/camp.js"),
    Comments = require("./models/comments.js"),
    User = require("./models/user.js"),
    methodOverride = require("method-override"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    flash=require("connect-flash");

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");


//////////////////////////////////////////////////////////

console.log("connecting to mongodb");
mongoose.connect('mongodb://localhost/yelpcamp', function(err) {
  if (err) {
    console.err(err);
  } else {
    console.log('Connected');
  }
});

//////////////////////////////////////////////////////////


app.use(require("express-session")({
  secret: "yelpcamp project was fun",
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error= req.flash("error");
  res.locals.success= req.flash("success");
  next();
});

//////////////////////////////////////////////////////////
//Campground.create(
//  {
//    name:"camp3",
//    image:"https://images.unsplash.com/photo-1533632359083-0185df1be85d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"
//  }, function(err,camp) {
//      if(err) {
//        console.log(err);
//      } else {
//        console.log("newly created campground: ");
//      console.log(camp);
//
//    }

//});
////////////////////////////////////////////////////////


//creating comments
/* Comments.create(
  {
    text: "abhay will be my hubby!!",
    author: "chiku"
  },function(err,comment){
      if(err){
        console.log(err);
      } else {
        Campground.findOne({name:"camp1"},function(err,foundCamp){
          if(err){
           console.log(err);
          } else {
            foundCamp.comments.push(comment);
            foundCamp.save(function(err,data){
            if(err){
                console.log("error!");
              } else {
                console.log("created comment", data);
              }
            });
          }
        });

      }
 }
); */


///////////////////////////    CAMPGROUND ROUTES    //////////////////////////////////////

app.get("/", function(req, res) {
  res.render("landing");
});

app.get("/campgrounds", function(req, res) {
  console.log("campgrounds get req");
  //get all campgrounds from database yelpcamp
  Campground.find({}, function(err, allCampgrounds) {
    console.log("got data");
    if (err) {
      console.log(err);
    } else {
      res.render("index", {
        campgrounds: allCampgrounds
      });
    }

  });
});

app.post("/campgrounds", isLoggedIn, function(req, res) {
  var name = req.body.name;
  var image = req.body.image;
  var author = {
    id: req.user._id,
    username: req.user.username
  }
  Campground.create({
    name: name,
    image: image,
    author: author
  }, function(err, camp) {
    if (err) {
      console.log(err);
    } else {

      res.redirect("/campgrounds");
    }
  });
});


app.get("/campgrounds/new", isLoggedIn, function(req, res) {
  res.render("form");
})

app.get("/campgrounds/:id", function(req, res) {
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCamp) {
    if (err) {
      console.log(err);
    } else {
      res.render("show", {
        camp: foundCamp
      });
    }
  });
})

app.get("/campgrounds/:id/edit", isCampOwner, function(req, res) {
  Campground.findById(req.params.id, function(err, foundCamp) {
    if (err) {
      res.redirect("/campgrounds/:id");
    } else {
      res.render("edit", {
        camp: foundCamp
      });
    }
  });
});

app.put("/campgrounds/:id", isCampOwner, function(req, res) {
  Campground.findByIdAndUpdate(req.params.id, req.body, function(err, updatedCamp) {

    if (err) {
      res.redirect("/campgrounds/" + req.params.id);
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

 app.delete("/campgrounds/:id", isCampOwner, function(req, res) {
  Campground.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds");
    }
  });
});


////////////////////////////   COMMENT ROUTES   ////////////////////////////////////////

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res) {

  Campground.findById(req.params.id, function(err, camp) {
    if (err) {
      console.log(err);
    } else {
      res.render("newComment", {
        camp: camp
      });
    }
  });
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res) {
  Campground.findById(req.params.id, function(err, camp) {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds/" + req.params.id);
    } else {
      -
      Comments.create(req.body.comment, function(err, comment) {
        if (err) {
          console.log(err);
        } else {
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.save();
          camp.comments.push(comment);

          camp.save(function(err, data) {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/campgrounds/" + camp._id);
            }
          });
        }
      });
    }
  });
});

app.get("/campgrounds/:id/comments/:idc/edit",isCommentOwner,function(req, res) {
  Comments.findById(req.params.idc, function(err, foundComment) {
    if (err) {
      res.redirect("back");
    } else {
      res.render("editComment", {comment:foundComment,camp_id:req.params.id});
    }
  });
});

app.put("/campgrounds/:id/comments/:idc",isCommentOwner, function(req, res) {
  Comments.findByIdAndUpdate(req.params.idc, req.body.comment, function(err, updatedComment) {
    if (err) {

      console.log(err);
      res.redirect("/campgrounds/" + req.params.id);

    } else {
      console.log("updated comment!");
      res.redirect("/campgrounds/" + req.params.id);

    }
  });
});



app.delete("/campgrounds/:id/comments/:idc",isCommentOwner, function(req, res) {
      Comments.findByIdAndRemove(req.params.idc, function(err) {
        if (err) {
          res.redirect("/campgrounds/" + req.params.id);
        } else {
          res.redirect("/campgrounds/" + req.params.id);
        }
      });
    })



/////////////////    AUTH ROUTES   //////////////////////

app.get("/register", function(req, res) {
  res.render("register");
});
app.post("/register", function(req, res) {
  User.register(new User({
    username: req.body.username
  }), req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/campgrounds");
    })
  })
})

app.get("/login", function(req, res) {
  res.render("login");
})

app.post("/login", passport.authenticate("local", {
  successRedirect: "/campgrounds",
  failureRedirect: "/login"
}), function(req, res) {});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/campgrounds");
})


///////////////////////////////////////   MIDDLEWARES    //////////////////////////////


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error","please login first!");
  res.redirect("/login");
};

function isCampOwner(req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, function(err, foundCamp) {
      if (err) {
        res.redirect("back");
      } else {
        if (foundCamp.author.id.equals(req.user._id)) {
          return next();
        } else {
          res.send("u dont have permission");
        }
      }
    });
  } else {
    res.redirect("back");
  }
}


function isCommentOwner(req,res,next){
  if(req.isAuthenticated()) {
    Comments.findById(req.params.idc,function(err,foundComment){
      if(err) {
        console.log(err);
      } else {
        if(foundComment.author.id.equals(req.user._id)) {
          return next();
        } else {
          res.send("u don't have permission for it");
        }
      }
    });
  } else {
    res.send("U need to be logged in !");
  }
};

app.listen(3000, function(req, res) {
  console.log("Server is listening!!");
});
