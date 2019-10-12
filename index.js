var express         = require("express"),
    app             = express(),
    methodOverride  = require("method-override"),
    expressSanitizer= require("express-sanitizer"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    User            = require("./models/user"),
    LocalStrategy   = require("passport-local"),
    passportLocalMongoose  = require("passport-local-mongoose");



mongoose.connect("mongodb://"); // connect to where your db is located


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); // must go after body-parser
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "Cocoa and Gismo are the best",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
}); 
    

// SCHEMA SETUP
var phagesSchema = new mongoose.Schema({
    phagename: String,
    phageimage: {type: String, default: "https://images.pexels.com/photos/60022/microscope-slide-research-close-up-60022.jpeg?cs=srgb&dl=biology-close-up-instrument-60022.jpg&fm=jpg"},
    // ^^ random default image
    googledocimages: String,
    foundby: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    yearfound: String,
    cityfound: String,
    statefound: String,
    countryfound: String,
    gpslat: String,
    gpslong: String,
    soilsample: String,
    isolationhost: String,
    phagediscovery: String,
    phagenaming: String,
    isotemp: String,
    seqcomplete: String,
    seqfacility: String,
    seqmethod: String,
    genomelength: String,
    genomeend: String,
    overhanglength: String,
    overhangseq: String,
    gccontent: String,
    cluster: String,
    clusterlife: String,
    annotatestatus: String,
    phagemorphology: String,
    morphotype: String,
    phamerated: String,
    genbank: String,
    genbanklink: String,
    archivestatus: String,
    freezerboxnum: String,
    freezerboxgridnum: String,
    

});

var thePhages = mongoose.model("Phages", phagesSchema);


app.get("/", function(req, res){
    res.render("home");
})

app.get("/about", function(req, res){
    res.render("about");
})

app.get("/supplementalinfo", function(req, res){
    res.render("supplement");
})

app.get("/phages", function(req, res){
        thePhages.find({}, function(err, allphages){
            if(err){
                console.log("fix error");
             } else {
                res.render("phages", {phages:allphages});
             }
        })
});

app.post("/phages", isLoggedIn, function(req, res){
    req.body.phages.body = req.sanitize(req.body.phages.body);
    thePhages.create(req.body.phages, function(err, phages){
        if(err){
            res.render("newphages");
        } else {
            phages.author.id = req.user._id;
            phages.author.username = req.user.username;
            phages.save();
            res.redirect("/phages/" + phages._id);
        }
    })
})

app.get("/phages/new", isLoggedIn, function(req, res) {
    res.render("newphages");
});

app.get("/phages/modify", function(req, res) {
    thePhages.find({}, function(err, allphages){
            if(err){
                console.log("fix error");
             } else {
                res.render("modify", {phages:allphages})
             }
        });
});

app.get("/phages/:id", isLoggedIn, function(req, res) {
        thePhages.findById(req.params.id, function(err, specificPhage){
        if(err){
            console.log("/phages");
         } else {
            res.render("show", {phages:specificPhage})
         }
    });
});

app.get("/phages/:id/edit", isLoggedIn, isApproved, function(req, res) {
        thePhages.findById(req.params.id, function(err, specificPhage){
        if(err){
            console.log("/phages/:id");
         } else {
            res.render("edit", {phages:specificPhage})
         }
    });
});


app.put("/phages/:id", isLoggedIn, function(req, res){
    req.body.phages.body = req.sanitize(req.body.phages.body);
    if(req.body.phages.phageimage == undefined) { 
	    req.body.phages.phageimage = "https://images.pexels.com/photos/60022/microscope-slide-research-close-up-60022.jpeg?cs=srgb&dl=biology-close-up-instrument-60022.jpg&fm=jpg";
	    // ^^ random default image
	    req.body.phages.body.save();
	 }
    thePhages.findByIdAndUpdate(req.params.id, req.body.phages, function(err, updatePhages){
        if(err){
            res.redirect("/phages");
        } else {
            res.redirect("/phages/" + req.params.id);
        }
    });
})


app.get("/register", function(req, res){

    res.render("authRegister");

})

app.post("/register", isAuthorized, function(req, res){

        req.body.username
        req.body.password
        User.register(new User({username: req.body.username}), req.body.password, function(err, user){
            if(err){
                alert("There was a problem, please try again.");
                console.log(err);
                return res.render('authRegister'); 
            }
            passport.authenticate("local")(req, res, function(){
            res.redirect("/phages");
            })
        })

});

app.get("/login", function(req, res) {
    res.render("authLogin");
});

app.get("/loginretry", function(req, res) {
    res.render("authLoginFail");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/phages",
    failureRedirect: "/loginretry"
}), function(req, res){});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

function isAuthorized(req, res, next){
    var validation = req.body.valid;
    if (validation === "iwuregister2018"){ 
    // can change this to validate new users
        return next();
    }
    res.redirect("/register");
}

function isApproved(req, res, next){
    thePhages.findById(req.params.id, function(err, specificPhage){
        if(err){
            console.log(err);
         } else {
             User.findById(req.user, function(err, currentPerson){
                 if(err) {
                     console.log(err);
                 } else {
                    if(specificPhage.author.username == currentPerson.username 
                    || currentPerson.username == "mgndolan@gmail.com") { 
                // whoever you want your admin user to be ^^
                        return next();
                    } else {
                        res.redirect("/phages");
                    } 
                 }
             })

         }
    });
};

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Application has Started");
});