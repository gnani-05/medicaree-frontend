import { useState } from "react";
import api from "./api";
import Dashboard from "./Dashboard";
import "./App.css";

export default function App() {
  const [role, setRole] = useState("PATIENT");
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("medicareUser")) || null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        await api.post("/register", {
          ...form,
          role,
        });

        setMessage("Registration successful! Please log in.");
        setIsRegister(false);
        setForm({ name: "", email: form.email, password: "" });
      } else {
        const response = await api.post("/login", {
          email: form.email,
          password: form.password,
          role,
        });

        const loggedInUser = response.data;

        localStorage.setItem(
          "medicareUser",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Unable to connect. Check whether the backend is running.")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("medicareUser");
    setUser(null);
    setRole("PATIENT");
    setIsRegister(false);
    setForm({ name: "", email: "", password: "" });
    setMessage("");
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="page">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">✚</span>
          MediCare
        </div>
        <span className="nav-tag">Hospital Management System</span>
      </header>

      <main className="main-layout">
        <section className="welcome">
          <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
          <h1>Healthcare made simpler.</h1>
          <p>
            Book appointments, connect with doctors, and manage
            your healthcare journey in one place.
          </p>

          <div className="feature">
            <span>✓</span>
            Trusted healthcare professionals
          </div>
          <div className="feature">
            <span>✓</span>
            Easy appointment booking
          </div>
          <div className="feature">
            <span>✓</span>
            Convenient appointment tracking
          </div>
        </section>

        <section className="login-card">
          <div className="card-heading">
            <span className="eyebrow">WELCOME TO MEDICARE</span>
            <h2>{isRegister ? "Create your account" : "Sign in"}</h2>
            <p>
              {isRegister
                ? "Fill in your details to get started."
                : "Choose your account type to continue."}
            </p>
          </div>

          <div className="role-tabs">
            {["PATIENT", "DOCTOR", "ADMIN"].map((item) => (
              <button
                key={item}
                type="button"
                className={role === item ? "role active" : "role"}
                onClick={() => {
                  setRole(item);
                  setIsRegister(false);
                  setMessage("");
                }}
              >
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </label>

            <button className="submit-btn" disabled={loading}>
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          {role !== "ADMIN" && (
            <p className="switch-mode">
              {isRegister
                ? "Already have an account?"
                : "New to MediCare?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setMessage("");
                }}
              >
                {isRegister ? "Sign in" : "Register"}
              </button>
            </p>
          )}

          {role === "ADMIN" && !isRegister && (
            <p className="admin-note">
              Authorized administrators only.
            </p>
          )}

          {message && (
            <div className="message" role="status">
              {message}
            </div>
          )}
        </section>
      </main>

      <footer>© 2026 MediCare · Healthcare for everyone</footer>
    </div>
  );
}