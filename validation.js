"use strict";
const form = document.getElementById("form");
const firstnameInput = document.getElementById("firstname-input");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const repeatPasswordInput = document.getElementById("repeat-password-input");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", (e) => {
  let errors = [];

  if (firstnameInput) {
    // if we have a firstname input then we are in the signup
    errors = getSignupFormErrors(
      firstnameInput.value,
      emailInput.value,
      passwordInput.value,
      repeatPasswordInput.value
    );
  } else {
    //   if we don't have a firstname then wee are in the login
    errors = getLoginFormErrors(emailInput.value, passwordInput.value);
  }
  if (errors.length > 0) {
    e.preventDefault();
    errorMessage.innerText = errors.join(". ");
  }
});

function getSignupFormErrors(firstname, email, password, repeatpassword) {
  let errors = [];

  if (firstname === "" || firstname == null) {
    errors.push("Firstname is required");
    firstnameInput.parentElement.classList.add("incorrect");
  }
  if (email === "" || email == null) {
    errors.push("Email is required");
    emailInput.parentElement.classList.add("incorrect");
  }
  if (password === "" || password == null) {
    errors.push("Password is required");
    passwordInput.parentElement.classList.add("incorrect");
  }
  if (password.length < 8) {
    errors.push("Password must have at least 8 characters");
    passwordInput.parentElement.classList.add("incorrect");
  }
  if (password !== repeatpassword) {
    errors.push("Password does not match repeat password");
    repeatPasswordInput.parentElement.classList.add("incorrect");
    passwordInput.parentElement.classList.add("incorrect");
  }
  return errors;
}

function getLoginFormErrors(email, password) {
  let errors = [];

  if (email === "" || email == null) {
    errors.push("Email is required");
    emailInput.parentElement.classList.add("incorrect");
  }
  if (password === "" || password == null) {
    errors.push("Password is required");
    passwordInput.parentElement.classList.add("incorrect");
  }
  return errors;
}
const allInputs = [
  firstnameInput,
  emailInput,
  passwordInput,
  repeatPasswordInput,
].filter((input) => input != null);

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    if (input.parentElement.classList.contains("incorrect"))
      input.parentElement.classList.remove("incorrect");
    errorMessage.innerText = "";
  });
});
