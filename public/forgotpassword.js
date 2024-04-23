
var resetPasswordButton = document.getElementById("resetPasswordButton");
let forgotError = document.getElementById("throwError");


document.getElementById("resetPasswordButton").onclick = function resetPassword(){
    let userEmail = document.getElementById("forgotEmail").value;
    let newPassword = document.getElementById("newPassword").value;

    //Sending login info to server
    let payload = {useremail: userEmail, newpassword: newPassword};
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/forgotpassword');
    xhr.setRequestHeader('Content-Type', 'application/json');
    console.log(payload);
    console.log("Sending from Client");
    xhr.send(JSON.stringify(payload));
    xhr.onreadystatechange = function(){
        console.log(xhr.status);
        if(xhr.readyState == 4 && xhr.status == 200){
            var response = JSON.parse(xhr.responseText);
            console.log(response["passwordreset"]);
            if(response["passwordreset"] == "Reset worked"){
                console.log(response["passwordreset"]);
                console.log("Worked!");
                window.location.replace("login.html");
                forgotError.style.display = "none";
            }else{
                console.log(response["passwordreset"]);
                console.log("Failed!");
                forgotError.style.display = "block";
                setTimeout(function(){
                    window.location.replace("forgotpassword.html");
                }, 5000); 
            console.log("ELSE HERE");
            };
        };
    };
}