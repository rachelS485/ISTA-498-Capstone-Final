// Add login and ceate function requests
    // implement hashing passwords and creating sessions with cookies in server.js file

// Add function requests to bring up an error when user enters anything but an email and


document.getElementById("loginButton").onclick = function loginUser(){

    let useremail = document.getElementById("emaillogin").value;
    let password = document.getElementById("passwordlogin").value;
    //Sending login info to server
    let payload = {useremail: useremail, password: password};
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/login');
    xhr.setRequestHeader('Content-Type', 'application/json');
    console.log(payload);
    console.log("Sending from Client");
    xhr.send(JSON.stringify(payload));
    xhr.onreadystatechange = function(){
    if(xhr.readyState == 4 && xhr.status == 200){
        console.log("Loaded Login");
        var response = JSON.parse(xhr.responseText);
        if(response["login"] == "Login worked"){
            console.log(response["login"]);
            console.log("Worked!");
            window.location.replace("mainweb.html");
        }else{
            console.log(response["login"]);
            console.log("Failed!");
            window.location.replace("login.html");
        };
    };
    };

}
document.getElementById("createAccountButton").onclick = function createUser(){
    let useremail = document.getElementById("emailcreate").value;
    let password = document.getElementById("passwordcreate").value;
    let major = "";
    if (document.getElementById("major1").checked){
        major = document.getElementById("major1").value;
    }else{
        if (document.getElementById("major2").checked){
            major = document.getElementById("major2").value;
        };
    };
    //Sending login info to server
    let payload = {useremail: useremail, password: password, major: major};
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/createaccount');
    xhr.setRequestHeader('Content-Type', 'application/json');
    console.log(payload);
    console.log("Sending from Client");
    xhr.send(JSON.stringify(payload));
    xhr.onreadystatechange = function(){
    if(xhr.readyState == 4 && xhr.status == 200){
        console.log("Loaded Acount");
        var response = JSON.parse(xhr.responseText);
        if(response["login"] == "Account worked"){
            console.log(response["account"]);
            console.log("Worked!");
            window.location.replace("login.html");
        }else{
            console.log(response["account"]);
            console.log("Failed!");
            window.location.replace("login.html");
        };
    };
    };

}
