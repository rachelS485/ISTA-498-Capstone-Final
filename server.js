const express = require('express');

const path = require('path')

const StringDecoder = require("string_decoder").StringDecoder

const session = require('express-session');

const cookieParser = require('cookie-parser');

const Pool = require('pg').Pool;

// Security
const crypto = require('crpyto')
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);
const helmet = require('helmet');
const https = require('https');




const db = {
    user:'postgres',
    host:'localhost',
    database:'db498',
    password:'DEMO498',
    port:5432
};

const pool = new Pool(db);

const app = express();
const httpsServer = https.createServer(app);

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

            // -- REPLACE ID_SLOT WITH THE ID COLUMN
            let loginquery = "SELECT DecryptByKey(EncryptedEmail, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, ID_SLOT))) AS 'email', " +
                             "DecryptByKey(EncryptedPassword, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, ID_SLOT))) AS 'password', " +
                             "DecryptByKey(EncryptedMajor, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, ID_SLOT))) AS 'major' " +
                             "FROM users WHERE EncryptedEmail = '" + useremail + "';";

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
                    // Encrypt data above

                    let encrypted1 = cipher.update(app.locals.username, 'utf8', 'hex');
                    encrypted1 += cipher.final('hex');

                    app.locals.username = encrypted1
                    
                    app.locals.login = true;
                    console.log(resultUser[0]['email']);
                    var dataSend = {"login": "Login worked"};
                    // Encrypt data above

                    let encrypted2 = cipher.update(dataSend, 'utf8', 'hex');
                    encrypted2 += cipher.final('hex');


                    
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(encrypted2));
                    console.log("Login Sent!");
                }else{
                    var dataSend = {"login": "Login failed"};
                    // Encrypt data above


                    let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                    encrypted += cipher.final('hex');

                    
                    console.log(JSON.stringify(dataSend));
                    res.send(JSON.stringify(encrypted));
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
    // Encrypt data above


    let encrypted = cipher.update(dataSend, 'utf8', 'hex');
    encrypted += cipher.final('hex');

                    
    res.send(JSON.stringify(encrypted));
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

        }
        
        else{

            // Changed sql query to decrpyt
            // Replace ID_SLOT with the id column in users
            let checkQuery = "SELECT DecryptByKey(EncryptedEmail, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, CreditCardID))) AS 'email', " +
                             "DecryptByKey(EncryptedPassword, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, CreditCardID))) AS 'password', " +
                             "DecryptByKey(EncryptedMajor, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, CreditCardID))) AS 'major' " +
                             "FROM users WHERE EncryptedEmail = '" + useremail + "';";

            client.query(checkQuery, function(error, results) {
                if(error){

                    throw error;

                };

                let resultUser = results.rows;
                console.log(resultUser);

                if(resultUser.length > 0) {

                    console.log(useremail);
                    var dataSend = {"account": "User email already exists!"};
                    console.log(JSON.stringify(dataSend));
                    // Encrypt data above

                    let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                    encrypted += cipher.final('hex');


                    
                    res.send(JSON.stringify(encrypted));
                    console.log("Account creation not successful!");

                }
                
                else{

                    // Replace ID_SLOT with the id column in users
                    let createAccountQuery = "INSERT INTO users (EncryptedEmail,EncryptedPassword,EncryptedMajor) VALUES " +
                                             "(EncryptByKey(Key_GUID('et1lhaets9'), N$1, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, ID_SLOT)), " +
                                             "EncryptByKey(Key_GUID('et1lhaets9'), N$2, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, ID_SLOT)), " +
                                             "EncryptByKey(Key_GUID('et1lhaets9'), N$3, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, ID_SLOT)));";

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
                            // Encrypt data above


                            let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                            encrypted += cipher.final('hex');

                    
                            res.send(JSON.stringify(encrypted));
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
                let checkQuery = "SELECT userid, " +
                        "DecryptByKey(EncryptedRecString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'courserecstring', " +
                        "FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"';";

                client.query(checkQuery, function(error, result){
                    if(error){
                        throw error;
                    };

                    let resultUser = result.rows;
                    console.log(resultUser);
                    if(resultUser.length > 0){

                        let updatecourseQuery = "UPDATE courserecs SET EncryptedRecString = " +
                                                "EncryptByKey(Key_GUID('et1lhaets9'), N$1, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, userid))) " + 
                                                "WHERE userid = $2;";

                        client.query(updatecourseQuery, [course_matches, req.session.user[0]['userid']], (error, results)=>{
                            if(error){
                                throw error;
                            };
                            let resultUser = results.rows;
                            console.log(resultUser);
                            if(resultUser){
                                var dataSend = {"courses": "Update sucess!"};
                                console.log(JSON.stringify(dataSend));
                                // Encrypt data above

                                let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                                encrypted += cipher.final('hex');


                    
                                res.send(JSON.stringify(encrypted));
                                console.log("Update successful!");
                            };  
                        });
                    }else{
                        let createCourseQuery = "INSERT INTO courserecs (userid, EncryptedRecString) VALUES (" +
                                                "$1, EncryptByKey(Key_GUID('et1lhaets9'), N$2, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, userid))));";

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
                                // Encrypt data above


                                let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                                encrypted += cipher.final('hex');

                    
                                res.send(JSON.stringify(encrypted));
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
            let checkQuery = "SELECT userid, DecryptByKey(EncryptedRecString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'courserecstring' " +
                             "FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"';";

            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){

                    let coursesQuery = "SELECT DecryptByKey(EncryptedRecString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'courserecstring' " +
                                       "FROM courserecs WHERE userid = '"+req.session.user[0]['userid']+"';";

                    client.query(coursesQuery, function(error, result){
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = result.rows;
                        console.log(resultUser);
                        var dataSend = {"coursematches": resultUser[0]['courserecstring']};
                        console.log(JSON.stringify(dataSend));
                        // Encrypt data above

                        let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                        encrypted += cipher.final('hex');


                    
                        res.send(JSON.stringify(encrypted));
                        console.log("Courses sent!");
                    });
                }
                else{
                    var dataSend = {"coursematches": 'No courses'};
                    console.log(JSON.stringify(dataSend));
                    // Encrypt data above


                    let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                    encrypted += cipher.final('hex');

                    
                    res.send(JSON.stringify(encrypted));
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

            let checkQuery = "SELECT userid, DecryptByKey(EncryptedSummString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'interstsumarystring' " +
                             "FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"';";

            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){

                    let updateInterestsQuery = "UPDATE interestresults SET EncryptedSummString = EncryptByKey(Key_GUID('et1lhaets9'), N$1, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, userid))) " + 
                                               "WHERE userid = $2;";

                    client.query(updateInterestsQuery, [interstform, req.session.user[0]['userid']], (error, results)=>{
                        if(error){
                            throw error;
                        };
                        let resultUser = results.rows;
                        console.log(resultUser);
                        if(resultUser){
                            var dataSend = {"interests": "Update sucess!"};
                            console.log(JSON.stringify(dataSend));
                            // Encrypt data above

                            let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                            encrypted += cipher.final('hex');


                    
                            res.send(JSON.stringify(encrypted));
                            console.log("Update successful!");
                        };  
                    });
                }else{
                    
                    let createInterstQuery = "INSERT INTO interestresults (userid, EncryptedSummString) " +
                                             "VALUES ($1, EncryptByKey(Key_GUID('et1lhaets9'), N$2, 1, HASHBYTES('SHA2_256', CONVERT( varbinary, userid))));";

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
                            // Encrypt data above

                            let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                            encrypted += cipher.final('hex');


                    
                            res.send(JSON.stringify(encrypted));
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

            let checkQuery = "SELECT userid, DecryptByKey(EncryptedSummString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'interstsumarystring' " +
                             "FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"';";
                             
            client.query(checkQuery, function(error, result){
                if(error){
                    throw error;
                };
                let resultUser = result.rows;
                console.log(resultUser);
                if(resultUser.length > 0){

                    let interestsQuery = "SELECT DecryptByKey(EncryptedSummString, 1 , HASHBYTES('SHA2_256', CONVERT(varbinary, userid))) AS 'interstsumarystring' " +
                                         "FROM interestresults WHERE userid = '"+req.session.user[0]['userid']+"';";

                    client.query(interestsQuery, function(error, result){
                        done();
                        if(error){
                            throw error;
                        };
                        let resultUser = result.rows;
                        console.log(resultUser);
                        var dataSend = {"insterestsaved": resultUser[0]['interstsumarystring']};
                        console.log(JSON.stringify(dataSend));
                        // Encrypt data above

                        let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                        encrypted += cipher.final('hex');


                    
                        res.send(JSON.stringify(encrypted));
                        console.log("Intersts sent!");
                    });
                }else{
                    var dataSend = {"insterestsaved": 'No intersts'};
                    console.log(JSON.stringify(dataSend));
                    // Encrypt data above


                    let encrypted = cipher.update(dataSend, 'utf8', 'hex');
                    encrypted += cipher.final('hex');

                    
                    res.send(JSON.stringify(encrypted));
                    console.log("No intersts yet!");
                };

            });
        }
    });
});

//Server setup
httpsServer.listen(3000, () => {
    console.log("Server running on port 3000");
});