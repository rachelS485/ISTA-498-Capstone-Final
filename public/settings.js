
function updateAccSettings() {
    // Function to make requet and change name
}

function resetPassword() {
    // Function to make requet to reset password
        // different than forget password-reset password screen
        // resets in the settings screen with a alert notification saying it reset
        // request should confirm original password exists and both original and new match as well
}

const accountButton = document.getElementById("accountButton");
const passwordButton = document.getElementById("passwordButton");
const emailTabButton = document.getElementById("emailTabButton");
const instructions = document.getElementById("instructions");

var passwordResetButton = "";
var accountSettingsSave = "";
var emailNotifResetButton = "";

// These 3 event listners change the content of the settings tab
accountButton.addEventListener("click", () => {
    let html_to_insert = "<form> <div id='currRemindPref'> <div class='emailSettings' style='margin-top: 0;'> <label class='emailLabels' >Current Settings</label> <br> <br> <label class='emailLabels' >Email:</label> <span>sample@arizona.edu</span> <br> </div> </div> </form> <form> <div id='updtRemindPref'> <label class='emailLabels' >Update Settings</label> <br> <br> <label for='email' class='emailLabels'>Email:</label> <input type='email' id='email' pattern='^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$' title='Must be an email' required=''> <br> <br> <div class='emailSettings' style='margin-top: 10px;'> <input type='submit' id='accountSettingsSave' value='Save'> </div> </div> </form>"
    
    document.getElementById("settings").innerHTML = html_to_insert;

    if (document.getElementById("email").value == "") {
        // Uncooment this code and make /getName in server.js request to fill
        // the current name,email settings, the repsonse needs to be a string
        // in  the format of first last email, seperated by spaces "Evan Williams test@gmail.com"

        // fetch("/getEmail")
        // .then((response) => response.text())
        // .then((details) => {
        //     document.getElementById("email").value = details;
        // })
        // .catch((error) => console.error(error));
        
    }

    //declares buttons in html
    accountSettingsSave = document.getElementById("accountSettingsSave");
    

});
passwordButton.addEventListener("click", () => {
    let html_to_insert = "<form> <div class='passwordSettings' style='margin-top: 0;'> <label for='origPassword' class='passwordLabels'>Original Password</label><br> "+ 
                         "<input type='password' id='origPassword' class='passwordInputs' name='origPassword' value='' required=''> </div> " + 
                         "<div class='passwordSettings' style='margin-top: 0;'> <label for='newPassword' class='passwordLabels'>New Password</label><br> " + 
                         "<input type='password' id='newPassword' class='passwordInputs' name='newPassword' value='' required=''> </div> " + 
    "<div class='passwordSettings' style='margin-top: 10px;'> <input type='submit' id='passwordResetButton' value='Save'> </div> </form>";

    document.getElementById("settings").innerHTML = html_to_insert;

    

    //declares buttons in html
    passwordResetButton = document.getElementById("passwordResetButton");
});
emailTabButton.addEventListener("click", () => {
    let html_to_insert = "<form> <div id='currRemindPref'> <div class='emailSettings' style='margin-top: 0;'> <label class='emailLabels' >Current Preferences</label> <br> <br> <label class='emailLabels' >Email:</label> <span>sample@arizona.edu</span> <br> <br> <label class='emailLabels' >Opted In:</label> <span>Yes</span> </div> </div> </form> <form> <div id='updtRemindPref'> <label class='emailLabels' >Update Preferences</label> <br> <br> <label for='email' class='emailLabels'>Email:</label> <input type='email' id='email' pattern='^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$' title='Must be an email' required=''> <br> <br> <label class='emailLabels' >Opted In:</label> <input type='radio' id='optYes' name='opted' required='' value='Yes'> <label for='optYes'>Yes</label> <input type='radio' id='optNo' name='opted' required='' value='No'> <label for='optNo'>No</label><br><br> <div class='emailSettings' style='margin-top: 10px;'> <input type='submit' id='emailNotifResetButton' value='Save'> </div> </div> </form>";

    document.getElementById("settings").innerHTML = html_to_insert;

    //declares buttons in html
    emailNotifResetButton = document.getElementById("emailNotifResetButton");
});

//This one sets changes the screen to instructions
instructions.addEventListener("click", () => {
    window.location.href = "instructions.html";
});

//Resets password
passwordResetButton.addEventListener("click", () => {
    resetPassword()
});

//Resets name
accountSettingsSave.addEventListener("click", () => {
    updateAccSettings()
});