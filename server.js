const express = require('express');

const path = require('path')

const StringDecoder = require("string_decoder").StringDecoder

const session = require('express-session');

const cookieParser = require('cookie-parser');

const Pool = require('pg').Pool;

const db = {
    user:'postgres',
    host:'localhost',
    database:'db498',
    password:'DEMO498',
    port:5432
};

const pool = new Pool(db);

const app = express();

// Security
const crypto = require('crpyto')
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
const helmet = require('helmet');
function firewall_detect(str_to_detect){
    var regexp_rule =[
        /select.+(from|limit)/i,
        /(?:(union(.*?)select))/i,
        /sleep\((\s*)(\d*)(\s*)\)/i,
        /group\s+by.+\(/i,
        /(?:from\W+information_schema\W)/i,
        /(?:(?:current_)user|database|schema|connection_id)\s*\(/i,
        /\s*or\s+.*=.*/i,
        /order\s+by\s+.*--$/i,
        /benchmark\((.*)\,(.*)\)/i,
        /base64_decode\(/i,
        /(?:(?:current_)user|database|version|schema|connection_id)\s*\(/i,
        /(?:etc\/\W*passwd)/i,
        /into(\s+)+(?:dump|out)file\s*/i,
        /xwork.MethodAccessor/i,
        /(?:define|eval|file_get_contents|include|require|require_once|shell_exec|phpinfo|system|passthru|preg_\w+|execute|echo|print|print_r|var_dump|(fp)open|alert|showmodaldialog)\(/i,
        /\<(iframe|script|body|img|layer|div|meta|style|base|object|input)/i,
        /(onmouseover|onmousemove|onerror|onload)\=/i,
        /javascript:/i,
        /\.\.\/\.\.\//i,
        /\|\|.*(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv)/i,
        /(?:ls|pwd|whoami|ll|ifconfog|ipconfig|&&|chmod|cd|mkdir|rmdir|cp|mv).*\|\|/i,
        /(gopher|doc|php|glob|file|phar|zlib|ftp|ldap|dict|ogg|data)\:\//i
    ];
    for(i=0; i< regexp_rule.length; i++){
        if(regexp_rule[i].test(str_to_detect) == true){
            console.log("Intercepted Attack:", "("+i+")", regexp_rule[i]);
            return true;
        }
    }
    return false;
}
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}
function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}


//Middlware
app.use(express.json()); 
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'html');
//app.engine('html', require('ejs').renderFile);
app.use(cookieParser());
app.use(helmet());

//Sessions
app.use(session({
    key: 'user_sid',
    secret:'This is my secret message',
    resave: false,
    saveUninitialized: false,
    cookie:{
        expires: 600000
    }
}));
app.locals.login = false;

//Serve the login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

//Serve the home page
app.get('/mainweb', (req, res) => {
    console.log("Loading Main Page")
    res.sendFile(__dirname + '/public/mainweb.html');
});



//Login, Logout, and Create account functionality
app.post('/login', (req, res) => {
    console.log("Server received login info");
    res.setHeader('Content-Type', 'text/html');
    let useremail = req.body.useremail;
    let userpassword = req.body.password;

    // Firewall Implementation
    if(firewall_detect(useremail) == false && firewall_detect(userpassword) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let loginquery = "SELECT * FROM users WHERE email = '"+useremail+"'";

            

            client.query(loginquery, function(error, results){

                done();

                if(error){
                    throw error;
                };

                let resultUser = results.rows;
                console.log(resultUser[0]);

                let password = decrypt(resultUser[0]['password'])
            
                if(resultUser && password == userpassword){
                    req.session.user = resultUser;
                    app.locals.username = resultUser[0]['email'];
                    app.locals.login = true;
                    console.log(resultUser[0]['email']);
                    var dataSend = {"login": "Login worked"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Login Sent!");
                }
                if(resultUser && password != userpassword){
                    var dataSend = {"login": "The password you have entered is incorrect!"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Login Sent!");
                }
                if(resultUser.length == 0 && password != userpassword){
                    var dataSend = {"login": "The username and/or password is incorrect!"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Login Sent!");
                };
        });

        };
    });
});

app.post('/logout', (req, res) => {
    console.log("Log out");
    req.session.user = null;
    res.clearCookie("user_sid");
    app.locals.login = false;
    var dataSend = {"test": "Logout worked"};
    console.log(JSON.stringify(dataSend));
    res.send(JSON.stringify(dataSend));
    console.log("Logout Sent!");
});

app.post('/createaccount', (req, res) => {
    console.log("Server received login info");
    res.setHeader('Content-Type', 'text/html');
    let useremail = req.body.useremail;
    let userpassword = req.body.password;
    let major = req.body.major;

    // Firewall Implementation
    if(firewall_detect(useremail) == false && firewall_detect(userpassword) == false && firewall_detect(major) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM users WHERE email = '"+useremail+"'";
            client.query(checkQuery, function(error, results){
                if(error){
                    throw error;
                };
                let resultUser = results.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    console.log(useremail);
                    var dataSend = {"account": "User email already exists!"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Account creation not successful!");
                }else{
                    let createAccountQuery = "INSERT INTO users (email, password, major, notify) VALUES ($1, $2, $3, $4)";

                    let encryptedEmail = encrypt(useremail)
                    let encryptedPassword = encrypt(userpassword);
                    let encryptedMajor = encrypt(major);
                    
                    client.query(createAccountQuery, [encryptedEmail, encryptedPassword, encryptedMajor, true], (error, results)=>{
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"account": "Account worked"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Account creation is successful!");
                        };
                           
                    });
                };
            });
        };
    });  
});

app.post('/forgotpassword', (req, res) => {
    console.log("Server received login info");
    res.setHeader('Content-Type', 'text/html');
    let useremail = req.body.useremail;
    let userpassword = req.body.newpassword;

    // Firewall Implementation
    if(firewall_detect(useremail) == false && firewall_detect(userpassword) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM users WHERE email = '"+useremail+"'";
            client.query(checkQuery, function(error, results){
                if(error){
                    throw error;
                };
                let resultUser = results.rows;
                console.log(resultUser);
                if(resultUser.length == 0){
                    console.log(useremail);
                    var dataSend = {"passwordreset": "Your email does not exist!"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Password rest not successful!");
                }else{
                    let updatePasswordQuery = "UPDATE users SET password = $1 WHERE email = $2";

                    let encryptedPassword = encrypt(userpassword);
                    let encryptedEmail = encrypt(useremail);
                    
                    client.query(updatePasswordQuery, [encryptedPassword, encryptedEmail], (error, results)=>{
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"passwordreset": "Reset worked"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Password reset is successful!");
                        };
                           
                    });
                };
            });
        };
    });  
});
// Serve the homepage
app.get('/', (req, res) => {
    if(req.session.user && req.cookies.user_sid){
        console.log("Logged in loading main!!")
        res.redirect('/mainweb');
    }
    else{
        res.redirect('/login');
    }
});
 

// Handling request  
app.post("/dataformresultsforalgorithm", (req, res) => { 
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    let type = req.body.type;
    let dataString = req.body.data;
    let artsString = req.body.arts;
    let societyString = req.body.society;

    // Firewall Implementation
    if(firewall_detect(type) == false && firewall_detect(dataString) == false && firewall_detect(artsString) == false && firewall_detect(societyString) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    console.log(dataString);
    const spawner = require('child_process').spawn;

    console.log('About to send data to course algorithm Python file. ');
    
    const python_process = spawner('python', ['.\\course_recomendation_algorithm.py', type, dataString, artsString, societyString]);
    
    python_process.stdout.on('data', (data) => {
        console.log('Data received from python:', data.toString());
        course_matches = data.toString();
        pool.connect(function (error, client, done){
            if(error){
                console.log(error);
            }else{
                let checkQuery = "SELECT * FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"'";
                client.query(checkQuery, function(error, result){
                    if(error){
                        throw error;
                    };
                    let resultUser = result.rows;
                    console.log(resultUser);
                    if(resultUser.length > 0){
                        let updatecourseQuery = "UPDATE courserecs SET courserecstring = $1 WHERE userid = $2";

                        let encryptedMatches = encrypt(course_matches);
                        
                        client.query(updatecourseQuery, [encryptedMatches, req.session.user[0]['userid']], (error, results)=>{
                            if(error){
                                throw error;
                            };
                            let resultUser = results.rows;
                            console.log(resultUser);
                            if(resultUser){
                                var dataSend = {"courses": "Update sucess!"};
                                console.log(JSON.stringify(dataSend));
                                res.send(JSON.stringify(dataSend));
                                console.log("Update successful!");
                            };  
                        });
                    }else{
                        let createCourseQuery = "INSERT INTO courserecs (userid, courserecstring) VALUES ($1, $2)";

                        let encryptedMatches = encrypt(course_matches);

                        client.query(createCourseQuery, [req.session.user[0]['userid'], encryptedMatches], (error, results)=>{
                            done();
                            if(error){
                                throw error;
                            };
                            let resultUser = results.rows;
                            console.log(resultUser);
                            if(resultUser){
                                var dataSend = {"courses": "Added new course recs!"};
                                console.log(JSON.stringify(dataSend));
                                res.send(JSON.stringify(dataSend));
                                console.log("Course recs added successfully!");
                            };
                            
                        });
                    };

                });
            }
        });
    });
}); 
app.post("/updatecourseui", (req, res) => { 
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    let coursesQuery = "SELECT courserecstring FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"'";
                    client.query(coursesQuery, function(error, result){
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = result.rows;
                        console.log(resultUser);
                        var dataSend = {"coursematches": resultUser[0]['courserecstring']};
                        console.log(JSON.stringify(dataSend));
                        res.send(JSON.stringify(dataSend));
                        console.log("Courses sent!");
                    });
                }
                else{
                    var dataSend = {"coursematches": 'No courses'};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("No courses yet!");
                };


            });
        }
    });
}); 

app.post("/saveinterstformsummary", (req, res)=>{
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    let interstform = req.body.interestform;

    // Firewall Implementation
    if(firewall_detect(interstform) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    let updateInterestsQuery = "UPDATE interestresults SET interstsumarystring = $1 WHERE userid = $2";

                    let encryptedIntForm = encrypt(interstform);
                    
                    client.query(updateInterestsQuery, [encryptedIntForm, req.session.user[0]['userid']], (error, results)=>{
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"interests": "Update sucess!"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Update successful!");
                        };  
                    });
                }else{
                    let createInterstQuery = "INSERT INTO interestresults (userid, interstsumarystring) VALUES ($1, $2)";

                    let encryptedIntForm = encrypt(interstform);
                    
                    client.query(createInterstQuery, [req.session.user[0]['userid'], encryptedIntForm], (error, results)=>{
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"interests": "Added new interests!"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Interests added successfully!");
                        };
                        
                    });
                };

            });
        }
    });

});

app.post("/loadinterests", (req, res)=>{
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    let interestsQuery = "SELECT interstsumarystring FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"'";
                    client.query(interestsQuery, function(error, result){
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = result.rows;
                        console.log(resultUser);
                        var dataSend = {"insterestsaved": resultUser[0]['interstsumarystring']};
                        console.log(JSON.stringify(dataSend));
                        res.send(JSON.stringify(dataSend));
                        console.log("Intersts sent!");
                    });
                }else{
                    var dataSend = {"insterestsaved": 'No intersts'};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("No intersts yet!");
                };

            });
        }
    });
});

app.post("/savefouryearplan", (req, res)=>{
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    let savedPlan = req.body.fouryearplan;

    // Firewall Implementation
    if(firewall_detect(savedPlan) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }



    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM fouryearplan WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    let updateInterestsQuery = "UPDATE fouryearplan SET planstring = $1 WHERE userid = $2";

                    let encryptedPlan = encrypt(savedPlan);

                    client.query(updateInterestsQuery, [encryptedPlan, req.session.user[0]['userid']], (error, results)=>{
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"savedplan": "Update sucess!"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Update successful!");
                        };  
                    });
                }else{
                    let createInterstQuery = "INSERT INTO fouryearplan (userid, planstring) VALUES ($1, $2)";

                    let encryptedSavedPlan = encrypt(savedPlan);
                    
                    client.query(createInterstQuery, [req.session.user[0]['userid'], encryptedSavedPlan], (error, results)=>{
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"savedplan": "Added new interests!"};
                            console.log(JSON.stringify(dataSend));
                            res.send(JSON.stringify(dataSend));
                            console.log("Plan added successfully!");
                        };
                        
                    });
                };

            });
        }
    });

});

app.post("/updatfouryearplanui", (req, res)=>{
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let checkQuery = "SELECT * FROM fouryearplan WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){
                    let interestsQuery = "SELECT planstring FROM fouryearplan WHERE userid = '"+req.session.user[0]['userid']+"'";
                    client.query(interestsQuery, function(error, result){
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = result.rows;
                        console.log(resultUser);
                        var dataSend = {"plansaved": resultUser[0]['planstring']};
                        console.log(JSON.stringify(dataSend));
                        res.send(JSON.stringify(dataSend));
                        console.log("Four year plan sent!");
                    });
                }else{
                    var dataSend = {"plansaved": 'No plan'};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("No four plan yet!");
                };

            });
        }
    });
});
//Settings
app.post('/loadsettings', (req, res) => {
    console.log("Server received login info");
    res.setHeader('Content-Type', 'text/html');
    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let getaccountQuery = "SELECT email, password, major, notify FROM users WHERE userid = '"+req.session.user[0]['userid']+"'";
            client.query(getaccountQuery, function(error, results){
                done();
                if(error){
                    throw error;
                };
                let resultUser = results.rows;
                console.log(resultUser[0]);
                var dataSend = {"email": resultUser[0]['email'], "password": resultUser[0]['password'], "major": resultUser[0]['major'], "notify": resultUser[0]['notify'] };
                console.log(JSON.stringify(dataSend));
                res.send(JSON.stringify(dataSend));
                console.log("Account info sent!");
        });

        };
    });
});
app.post('/updatesettings', (req, res) => {
    console.log("Server received login info");
    res.setHeader('Content-Type', 'text/html');
    let updateEmail = req.body.email;
    let updatePassword = req.body.password;
    let updateMajor = req.body.major;
    let updateNotify = req.body.notify;

    // Firewall Implementation
    if(firewall_detect(updateEmail) == false && firewall_detect(updatePassword) == false && firewall_detect(updateMajor) == false && firewall_detect(updateNotify) == false){
        next();
    }else{
        res.send("Attack detected, intercepted")
    }


    pool.connect(function (error, client, done){
        if(error){
            console.log(error);
        }else{
            let updateaccountQuery = "UPDATE users SET email = $1, password = $2, major = $3, notify = $4 WHERE userid = $5";

            let encryptedEmail = encrypt(updateEmail);
            let encryptedPassword = encrypt(updatePassword);
            let encryptedMajor = encrypt(updateMajor);

            client.query(updateaccountQuery, [encryptedEmail, encryptedPassword, encryptedMajor, updateNotify, req.session.user[0]['userid']], (error, results) =>{
                done();
                if(error){
                    throw error;
                };
                let resultUser = results.rows;
                console.log(resultUser[0]);
                var dataSend = {"updateAccount": "Completed"};
                console.log(JSON.stringify(dataSend));
                res.send(JSON.stringify(dataSend));
                console.log("Account info updated!");
            });

        };
    });
});

//Server setup
app.listen(3000, () => {
    console.log("Server running on port 3000");
});