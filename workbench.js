/**
 * Module requirements
 */
console.log("load requirements");
var express = require('express');
var exsession = require('express-session');
var fs = require('fs');

//Set poolsize before pool is created in other modules
var pg = require('pg');
pg.defaults.poolSize = 10;
// pg.defaults.poolLog= console.log;
// pg.defaults.poolIdleTimeout = 10000;

console.log("load sio");
var sio = require('socket.io');
console.log("sio successfully loaded");
var redis = require('connect-redis')(exsession);

var url = require('url');

var path = require('path');

var passport = require('passport');

var passportSocketIo = require('passport.socketio');

var TS = require('sqlspaces');

//var LocalStrategy = require('passport-local').Strategy;

var ejs = require('ejs');

/**
 * Include configuration
 */

var config = require('./config.js');

console.log("local libs");
/**
 * Include local libraries
 */

var sf = require('./lib/socketio.js');
console.log("local socket io loaded");
var tsauth = require('./lib/tsauth.js');

var wfm = require("./lib/wfmanager.js");

var cleanupManager = require("./lib/cleanupManager.js");
console.log("done");

console.log("connect to redis");
/**
 * Create session store
 */
var sessionStore = new redis();
console.log("done");

/**
 * Create express
 */

var app = express();

/**
 * Configure express
 */

var SITE_SECRET = 'our analytics workbench secret';
var COOKIE_SESSION_KEY = 'express.sid';

// Expresss middleware
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var logger = require('morgan');
var methodOverride = require('method-override');

app.use(logger('combined'));
app.use(compress());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(exsession({key: COOKIE_SESSION_KEY, secret: SITE_SECRET, store: sessionStore, resave: false, saveUninitialized: true}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

/**
 * Create actual servers that will be listening
 */
var server = require('https').createServer(config.ssloptions, app);
var httpServer = require('http').createServer(app);

/**
 * Connect Socket.IO to server
 */

var ioconfig = config.ssloptions;
ioconfig.log = true;
console.log(ioconfig);
var io = sio.listen(server, ioconfig);

/**
 * Passport
 */

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(tsauth.serializeUser);

passport.deserializeUser(tsauth.deserializeUser);

//add strategies to passport ( tsLogin() = local )
passport.use(tsauth.initTSAuth());

//set authorization for socket.io
io.set('authorization', passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: COOKIE_SESSION_KEY,       // the name of the cookie where express/connect stores its session_id
    secret: SITE_SECRET,    // the session_secret to parse the cookie
    store: sessionStore,        // we NEED to use a sessionstore. no memorystore please
    success: onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail: onAuthorizeFail     // *optional* callback on fail/error - read more below
}));

// send minified version of socket.io.js
io.set('browser client minification', true);

// tell sockets how to react
io.sockets.on('connection', sf.onconnect);


/**
 * First step: Redirect plain http server to secure server
 */
app.get(/^\/.*/, function (req, res, next) {
//    console.log("secrequest " + req.secure);
    if (!req.secure) {
        console.log(req.url);
        if ('/' == req.url && 'GET' == req.method) {
            // if it is a secure request for the site, redirect it
            var goal = [];
            goal.push('https://');
            //goal.push(req.host);
            goal.push(config.sslhost);
            if (443 != config.secureport) {
                goal.push(':' + config.secureport);
            }
            goal.push('/');
            console.log('redirecting to ' + goal.join(''));
            res.redirect(goal.join(''));
        } else {
            return deny(req, res, next);
        }
    } else {
        return next();
    }
});

app.get('/', function (req, res) {
    var data = getRenderData(req, 'home');
    res.render('index', data);
});

app.get('/about', function (req, res) {
    var data = getRenderData(req, 'about');
    res.render('about', data);
});

app.get('/references', function (req, res) {
    var data = getRenderData(req, 'references');
    res.render('references', data);
});

app.get('/admin', function (req, res) {
    var data = getRenderData(req, 'admin');
    if (data.admin) {
        if (req.query.view) {
            if (req.query.view == 'user') {
                res.render('admin-user', data);
            } else if (req.query.view == 'wfm') {
                res.render('admin-wfm', data);
            } else if (req.query.view == 'ae') {
                res.render('admin-autoexec', data);
            } else if (req.query.view == 'sw') {
                res.render('admin-savedwfs', data);
            } else {
                return deny(req, res);
            }
        } else {
            return deny(req, res);
        }
//        res.render('admin', data);
    } else {
        // res.redirect('/');
        return deny(req, res);
    }

});


app.get('/login', function (req, res) {

    console.log('received request for login page');

    var isAuthenticated = false;
    if (req.isAuthenticated()) {
        isAuthenticated = true;
    }
    var destination = "home";
    if (req.query.destination) {
        destination = req.query.destination;
    }

    // TODO: Idea is good, but this does not work :(
//    if (isAuthenticated) {
//        if (destination === 'workbench') {
//            res.redirect('/workbench')
//        } else if (destination === 'mobile') {
//            res.redirect('/mobile');
//        } else {
//            res.redirect('/');
//        }
//    }

    var failure = false;
    if (req.query.failure === "true") {
        failure = true;
    }
    res.render('login', {guest_account: config.allowguest, destination: destination, failure: failure});
});


app.get('/workbench', function (req, res) {
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + '/secure_html/workbench.html');
    } else {
        res.redirect('/login?destination=workbench');
    }
});

app.get('/mobile', function (req, res) {
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + '/secure_html/mobile.html');
    } else {
        res.redirect('/login?destination=mobile');
    }
});
app.get('/clientV2', function (req, res) {
    if (req.isAuthenticated()) {
        res.sendfile('secure_html/clientV2.html')
    } else {
        res.redirect('/login?destination=clientV2');
    }
});
// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                console.log('error detected: ' + err);
                return next(err);
            }
            if (user) {
                console.log("login from user " + user);
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    if (req.body.destination === "mobile") {
                        return res.redirect('/mobile');
                    }
                    if (req.body.destination === "workbench") {
                        return res.redirect('/workbench');
                    }
                    if (req.body.destination === "clientV2") {
                        return res.redirect('/clientV2');
                    }
                    return res.redirect('/');
                });
            } else {
                console.log('login not successful');
                var destination = "home";
                if (req.body.destination) {
                    destination = req.body.destination;
                }
                res.redirect('/login?destination=' + destination + '&failure=true');
            }
        })(req, res, next);
    }
);


app.get('/logout', function (req, res) {
    // TODO sockets
    io.sockets.in(req.user.id).emit('logout_ack');
    req.logout();
    res.redirect('/');
});

/**
 * Dynamic route for results things. (They are outside of public_html)
 */
app.get(/results\/([^\/]*)\/([^\/]*)\/(.*)/, ensureAuthenticated, function (req, res, next) {

    var user = req.session.passport.user;//becomes undefined on logout/new session

    if (user) {
        console.log('Serving Run ID: ' + req.params[0] + ', Instance ID: ' + req.params[1] + ' to ' + user.name);
        var normalized = path.normalize(decodeURI(url.parse(req.url).pathname));
        var filepath = path.join(process.cwd(), normalized);
        if (config.resultdir) {
            if (config.resultdir.match(/\S/)) {
                filepath = path.join(config.resultdir, normalized.substr(8));
            }
        }
        fs.stat(filepath, function (err, stat) {
            if (!err && stat.isFile()) {
//                res.sendfile(__dirname + req.url);
                res.sendFile(__dirname + "/" + filepath);
            } else {
                next();
            }
        });
    } else {
        next();
    }


//    console.log('Serving Run ID: ' + req.params[0] + ', Instance ID: ' + req.params[1] + ' to ' + req.user.username);
//    var filepath = __dirname + path.normalize(decodeURI(url.parse(req.url).pathname));
//    console.log("results " + filepath);
//    fs.stat(filepath, function (err, stat) {
//        if (!err && stat.isFile()) {
//            res.sendfile(__dirname + req.url);
//        } else {
//            console.log("ERROR " + err);
//            return next();
//        }
//    });

});

/*
 Offer contents of public_html statically
 */
app.use('/', express.static(__dirname + '/public_html'));

/*
 route to react in case of file not found (or not accessible)
 */

app.use(function (req, res, next) {
    return deny(req, res, next);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    console.log("ensure authenticated");
    if (req.isAuthenticated()) {
        return next();
    }
    // res.redirect('/login');
    return deny(req, res, next);
}

/*
 for denying requests
 */
function deny(req, res, next) {
    res.writeHead(404);
    res.end('Not found!');
}


/*
 Functions to react on authorization success and failure
 */

function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');

    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
    if (error)
        throw new Error(message);
    console.log('failed connection to socket.io:', message);
    console.log(data);

    // We use this callback to log all of our failed connections.
    accept(null, false);
}

var getRenderData = function (req, active) {
    var isAuthenticated = false;
    var username = "";
    var isAdmin = false;
    if (req.isAuthenticated()) {
        username = req.user.name;
        isAuthenticated = true;
        if (req.user.admin) {
            isAdmin = true;
        }
    }
    var data = {logged_in: isAuthenticated, active_element: active, username: username, admin: isAdmin};
    if (wfm) {
//        console.log('wfm found: ' + wfm.getNow());
        data.now = wfm.getNow();
//    } else {
//        console.log('wfm not found');
    }
//    console.log('render data: ' + JSON.stringify(data));
    return data;
};

/*
 Config for Workflowmanager
 */
var wfm_config = {
    ifWebservice: false,
    ifLogFile: true,
    ifMailNotification: false,
    ifAgentMonitoring: true
};

/*
 Start listening
 */
var startServers = function () {
    // start the webservers
    server.listen(config.secureport);
    httpServer.listen(config.plainport);
    console.log('Started NodeWorkbench on ' + config.plainport + ' and secure on ' + config.secureport);
    // start the workflowmanager
    wfm.start(wfm_config);
    // start the cleanup manager
    cleanupManager.start();
};


startServers();
