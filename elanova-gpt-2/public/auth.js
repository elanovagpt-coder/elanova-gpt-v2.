
/* ELANOVA.GPT — Authentication */

document.addEventListener("DOMContentLoaded", () => {
  const db = window.elanovaSupabase;

  const modal = document.getElementById("auth-modal");
  const loginBtn = document.getElementById("login");
  const closeBtn = document.getElementById("auth-close");
  const form = document.getElementById("auth-form");
  const email = document.getElementById("auth-email");
  const password = document.getElementById("auth-password");
  const error = document.getElementById("auth-error");
  const title = document.getElementById("auth-title");
  const description = document.getElementById("auth-description");
  const submit = document.getElementById("auth-submit");
  const toggle = document.getElementById("auth-toggle");
  const switchLabel = document.getElementById("auth-switch-label");

  if (!db || !modal || !form) {
    console.error("ELANOVA Auth: configuration missing.");
    return;
  }

  let mode = "login";

  function showMessage(message, success = false) {
    error.textContent = message;
    error.style.color = success ? "#75e3bb" : "#ff8c99";
    error.classList.remove("hidden");
  }

  function setMode(nextMode) {
    mode = nextMode;
    error.classList.add("hidden");
    password.value = "";

    const signup = mode === "signup";

    title.textContent = signup ? "Create your account" : "Welcome back";
    description.textContent = signup
      ? "Join ELANOVA.GPT today."
      : "Sign in to your ELANOVA account.";
    submit.textContent = signup ? "Create Account" : "Log In";
    toggle.textContent = signup ? "Log In" : "Sign Up";
    switchLabel.textContent = signup
      ? "Already have an account?"
      : "Don't have an account?";
    password.autocomplete = signup
      ? "new-password"
      : "current-password";
  }

  function openModal() {
    setMode("login");
    modal.classList.remove("hidden");
    email.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    form.reset();
    error.classList.add("hidden");
  }

  loginBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openModal();
  }, true);

  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  toggle?.addEventListener("click", () => {
    setMode(mode === "login" ? "signup" : "login");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.classList.add("hidden");

    submit.disabled = true;
    submit.textContent = "Please wait...";

    try {
      if (mode === "signup") {
        const { data, error: authError } = await db.auth.signUp({
          email: email.value.trim(),
          password: password.value
        });

        if (authError) throw authError;

        if (data.session) {
          closeModal();
          alert("Welcome to ELANOVA.GPT!");
        } else {
          showMessage(
            "Account request received. Check your email to confirm your account.",
            true
          );
        }
      } else {
        const { error: authError } =
          await db.auth.signInWithPassword({
            email: email.value.trim(),
            password: password.value
          });

        if (authError) throw authError;

        closeModal();
        alert("Successfully logged in!");
      }
    } catch (err) {
      showMessage(err.message || "Authentication failed.");
    } finally {
      submit.disabled = false;
      submit.textContent =
        mode === "signup" ? "Create Account" : "Log In";
    }
  });
});
