"use client";

import { useState } from "react";
import { loginUser } from "../actions";
import { useTheme } from "../components/ThemeProvider";
import Link from "next/link";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginUser(username, password);
    if (res?.error) setError(res.error);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1
          className="header-title"
          style={{ textAlign: "center", marginBottom: "1.5rem" }}
        >
          compleme
        </h1>
        <h2 style={{ marginBottom: "1rem" }}>Login</h2>
        {error && (
          <p
            style={{
              color: "var(--accent)",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "1rem", width: "100%" }}
          >
            Login
          </button>
        </form>
        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.9rem",
            color: "var(--fg-muted)",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
