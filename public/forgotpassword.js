function resetPassword() {
    // reset password request 
}

var resetPasswordButton = document.getElementById("resetPasswordButton");


resetPasswordButton.addEventListener("click", () => {
    resetPassword()
    window.location.href = "login.html";
});