"use strict";

const form = document.getElementById("form");
const firstnameInput = document.getElementById("firstname-input");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const repeatPasswordInput = document.getElementById("repeat-password-input");
const errorMessage = document.getElementById("error-message");

console.log("Form:", form);
console.log("Error Message:", errorMessage);
console.log("Firstname Input:", firstnameInput);

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // Always prevent default for API calls

  let errors = [];
  let isSignup = false;

  if (firstnameInput) {
    // We are in the signup form
    isSignup = true;
    errors = getSignupFormErrors(
      firstnameInput.value,
      emailInput.value,
      passwordInput.value,
      repeatPasswordInput.value
    );
  } else {
    // We are in the login form
    errors = getLoginFormErrors(emailInput.value, passwordInput.value);
  }

  // If there are validation errors, show them and stop
  if (errors.length > 0) {
    errorMessage.innerText = errors.join(". ");
    return;
  }

  // If no validation errors, proceed with API call
  try {
    if (isSignup) {
      await handleSignup(
        firstnameInput.value,
        emailInput.value,
        passwordInput.value
      );
    } else {
      await handleLogin(emailInput.value, passwordInput.value);
    }
  } catch (error) {
    errorMessage.innerText = error.message;
  }
});

// ==================== BACKEND INTEGRATION ====================

async function handleSignup(firstname, email, password) {
  try {
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Creating Account...";
    submitButton.disabled = true;

    // Call the AuthService to sign up
    await AuthService.signUp({
      name: firstname,
      email: email,
      password: password,
    });

    // Success - redirect to login page
    errorMessage.style.color = "green";
    errorMessage.innerText =
      "Account created successfully! Redirecting to login...";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    throw new Error("Sign up failed: " + error.message);
  } finally {
    // Reset button state
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Sign Up";
    submitButton.disabled = false;
  }
}

async function handleLogin(email, password) {
  try {
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Logging in...";
    submitButton.disabled = true;

    // Call the AuthService to login
    await AuthService.login(email, password);

    // Success - redirect to todo app
    errorMessage.style.color = "green";
    errorMessage.innerText = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "todo.html";
    }, 1000);
  } catch (error) {
    throw new Error("Login failed: " + error.message);
  } finally {
    // Reset button state
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Login";
    submitButton.disabled = false;
  }
}

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
