
document.getElementById("logoutMain").onclick = function logoutUser(){
    //Sending login info to server
    let payload = {logout: "Logging out user"};
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout');
    xhr.setRequestHeader('Content-Type', 'application/json');
    console.log(payload);
    console.log("Sending from Client");
    xhr.send(JSON.stringify(payload));
    xhr.onreadystatechange = function(){
    if(xhr.readyState == 4 && xhr.status == 200){
        console.log("Loggout User");
        var response = JSON.parse(xhr.responseText);
        console.log(response["test"]);
        console.log("Worked!");
        window.location.replace("login.html");
    };
    };
};