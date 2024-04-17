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


//Middlware
app.use(express.json()); 
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'html');
//app.engine('html', require('ejs').renderFile);
app.use(cookieParser());


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
                if(resultUser && resultUser[0]['password'] == userpassword){
                    req.session.user = resultUser;
                    app.locals.username = resultUser[0]['email'];
                    app.locals.login = true;
                    console.log(resultUser[0]['email']);
                    var dataSend = {"login": "Login worked"};
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(dataSend));
                    console.log("Login Sent!");
                }else{
                    var dataSend = {"login": "Login failed"};
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
                    let createAccountQuery = "INSERT INTO users (email, password, major) VALUES ($1, $2, $3)";
                    client.query(createAccountQuery, [useremail, userpassword, major], (error, results)=>{
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"account": "Account creation success!"};
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

//TODO
//6-10pm
//1. Get data take the course rec data and put into the table if the user id does not exist if it does then update. DONE
//2. Adjust the course rec code to SELECT * from the table instead to pull alwasys on onload. DONE
//3. Save the interest form results. Update or create depending on if the user is new DONE
//4. Adjust the insterest form summary to be an onload that pulls everytime the page loads as well DONE

//10-2am
//5. pull data from 4 year plan
//6. Update or Create in table
//7. Use onload to always pull from table using SELECT *. 

// Handling request  
app.post("/dataformresultsforalgorithm", (req, res) => { 
    console.log("Server received");
    res.setHeader('Content-Type', 'text/html');
    let type = req.body.type;
    let dataString = req.body.data;
    let artsString = req.body.arts;
    let societyString = req.body.society;
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
                        client.query(updatecourseQuery, [course_matches, req.session.user[0]['userid']], (error, results)=>{
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
                        client.query(createCourseQuery, [req.session.user[0]['userid'], course_matches], (error, results)=>{
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
                    client.query(updateInterestsQuery, [interstform, req.session.user[0]['userid']], (error, results)=>{
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
                    client.query(createInterstQuery, [req.session.user[0]['userid'], interstform], (error, results)=>{
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

//Server setup
app.listen(3000, () => {
    console.log("Server running on port 3000");
});