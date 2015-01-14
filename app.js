var express = require("express"),
	cookieParser = require("cookie-parser"),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	path = require("path"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	LocalStrategy = require("passport-local").Strategy
	FacebookStrategy = require("passport-facebook").Strategy,
	TwitterStrategy = require("passport-twitter").Strategy;;

// Read config file

	global.config = require(path.join(__dirname, "package.json")).config;

// Instantiate Express

	var app = express();

// Configure Express			
	
	app.set("view engine", "ejs");

	// angular app
  	app.use("/app", express.static(__dirname + "/app"));

	// static resources that don"t need compiling
	app.use("/lib", express.static(__dirname + "/assets/lib"));
	app.use("/img", express.static(__dirname + "/assets/img"));
	app.use("/fonts", express.static(__dirname + "/assets/fonts"));
	
	app.use(cookieParser());
	app.use(bodyParser());
	app.use(session({ secret: config.sessionID }));
	app.use(passport.initialize());
	app.use(passport.session());

// Create the http server
	
	var http = require("http").createServer(app).listen(8080);

// Catch any uncaught errors that have been thrown

	process.on("uncaughtException", function(err) {
		console.log("************************** UNCAUGHT EXCEPTION: " + err);
	});

// Set up the connection to the mongo database

	mongoose.connect(config.mongoAddress);

// Include the global erro handler
	
	global.dataError = require(config.customModulesFolder + "data-error.js");

// Include the controllers

	var users = require(config.controllerPath + "users");
	var links = require(config.controllerPath + "links");

// Configure local passport authentication
	
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});
	
	passport.deserializeUser(function(id, done) {
		users.getById(id, function(err, user) {
			done(err, user);
		});
	});
	
	passport.use(new LocalStrategy({ passReqToCallback: true },
		function(req, username, password, done) {
			if (req.isAuthenticated()) {
				var authenticatedUser = {
					_id: req.user._id, 
					sessionId: req.user.sessionId,
					email: req.user.email,
					joined: req.user.joined,
					facebookAuthenticated: req.user.facebookAuthenticated,
					twitterAuthenticated: req.user.twitterAuthenticated
				}	 
				     
				return done(null, authenticatedUser);
			}
			else if ((username.trim().length > 0) && (password.trim().length > 0)) {
				users.getByEmail(username, function(err, user) {
					if (err) return done(err, false, { message: "Incorrect e-mail" });

					if (!user) return done(null, false, { message: "Incorrect e-mail" });

					if (password != user.password) { 
						return done(null, false, { message: "Incorrect password." });
					}

					if (!user.sessionId) {
						var sessionId = createGUID();
						user.sessionId = sessionId;	
						users.saveSessionId(user._id, sessionId);
					}

					return done(null, user);
				});
			}
			else {
				var cookies = [];

				req.headers.cookie && req.headers.cookie.split(";").forEach(function( cookie ) {
					var parts = cookie.split("=");
					cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || "" ).trim();
				});

				if(cookies[config.cookieID]) {
					users.getBySessionId(cookies[config.cookieID], function(err, user) {
						if ((err) || (!user)) return done(null, null);
						else return done(null, user);
					});
				}
				else return done(null, null);
			}
		}
	));

// Actions for Facebook authentication

	passport.use(new FacebookStrategy({
		clientID: config.facebookKey,
		clientSecret: config.facebookSecret,
		callbackURL: "http://localhost:8080/auth/facebook/callback",
		passReqToCallback: true
	},
	function(req, accessToken, refreshToken, profile, done) {
		if ((accessToken) && (req.user != null)) {
			users.updateUserFacebookToken(req.user._id, accessToken, function(user) {
				return done(null, user);
			});
		}
	}
	));

// Actions for Twitter authentication

	passport.use(new TwitterStrategy({
		consumerKey: config.twitterKey,
		consumerSecret: config.twitterKey,
		callbackURL: "http://localhost:8080/auth/twitter/callback",
    	passReqToCallback: true
	},
  	function(req, token, tokenSecret, profile, done) {
		if ((token) && (req.user != null)) {
			users.updateUserTwitterToken(req.user._id, token, tokenSecret, function(user) {
				return done(null, user);
			});
		}
	}	
	));

// Functions to create session Id

	function s4() {
	  	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};
	
	global.createGUID = function() {
		return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
	}


// REST Routes

	app.get("/*", function(req, res, next) {
		if (req.headers.host.match(/^www\./) != null) {
			res.redirect("http://" + req.headers.host.slice(4) + req.url, 301);
		} else next();
	});

	// Actions for user authentication

	app.post("/auth", function(req, res, next) {
		passport.authenticate("local", function(err, user, info) {
			if (err) {
				return res.send({ status: "failed", message: err.message});
			}
			else if (!user) {
				return res.send({ status: "failed", message: info.message});
			}
			else {
				req.logIn(user, function(err) {
					if (err) return res.send({ status: "failed", message: err.message});

					user.password = null;

					return res.send({ status: "success", user: user });
				});
			}
		})(req, res, next);
	});
	
	app.delete("/auth", function(req, res, next) {
		req.logout();
		req.session.destroy();

		return res.send({ status: "success" });
	});
	
	app.get("/checkAuthenticated", function(req, res, next) {
	 	checkAuthenticated(req, res, function(user) {
			if (user) {
				return res.send({ status: "success", user: user });
			}
			else {
				return res.send({ status: "failed" });
			}
		});
	});
	
	function checkAuthenticated(req, res, callback) {
		if (req.isAuthenticated()) {
			var authenticatedUser = {
				_id: req.user._id, 
				sessionId: req.user.sessionId,
				email: req.user.email,
				joined: req.user.joined,
			    facebookEnabled: req.user.facebookEnabled,
			    twitterEnabled: req.user.twitterEnabled,
				facebookAuthenticated: req.user.facebookAuthenticated,
				twitterAuthenticated: req.user.twitterAuthenticated
			}

			return callback(authenticatedUser);
		}
		else {
			var cookies = [];

			req.headers.cookie && req.headers.cookie.split(";").forEach(function( cookie ) {
				var parts = cookie.split("=");
				cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || "" ).trim();
			});

			if(cookies[config.cookieID]) {
				users.getBySessionId(cookies[config.cookieID], function(err, authenticatedUser) {
					if (authenticatedUser) {
						req.login(authenticatedUser, function(err) {
							return callback(authenticatedUser);
						});
					}
					else {
						return callback(null);
					}
				});
			}
			else {
				return callback(null);
			}
		}
	}

	// Main actions

	app.get("/", function(req,res) { 
		res.render("index", { title: "LinkMash" }); 
	});
	
	app.get("/login", function(req,res) {
		checkAuthenticated(req, res, function(user) {
			if (user) {
				res.redirect("/main");
			}
			else {
				res.render("index", { title: "LinkMash" }); 
			}
		});
	});
	
	app.get("/signup", function(req,res) {
		checkAuthenticated(req, res, function(user) {
			if (user) {
				res.redirect("/main");
			}
			else {
				res.render("index", { title: "LinkMash" }); 
			}
		});
	});

	app.get("/main", function(req,res) { 
		res.render("main", { title: "LinkMash" }); 
	});
	
	app.get("/users", users.get);
	app.post("/users", users.insert);

	app.put("/users/facebook", users.setFacebookEnabled);
	app.delete("/users/facebook", users.deleteFacebookEnabled);
	app.put("/users/twitter", users.setTwitterEnabled);
	app.delete("/users/twitter", users.deleteTwitterEnabled);

	app.get("/links", links.getLinks);

	app.put("/links/:id", links.setLinkRead);
	app.delete("/links/:id", links.setLinkDismissed);

	app.get("/links/more/:lastLink", links.getMoreLinks);
	app.get("/links/feed/facebook", links.getNewFacebookLinks);
	app.get("/links/feed/twitter", links.getNewTwitterLinks);

	// Facebook authentication

	app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["read_stream"] }), function(req, res){});
	app.get("/auth/facebook/callback", function(req, res, next) {
	  passport.authenticate("facebook", function(err, user, info) {
		res.redirect("/main");
	  })(req, res, next);
	});

	// Twitter authentication

	app.get("/auth/twitter", passport.authenticate("twitter"), function(req, res){});
	app.get("/auth/twitter/callback", function(req, res, next) {
		passport.authenticate("twitter", function(err, user, info) {
			res.redirect("/main");
		})(req, res, next);
	});