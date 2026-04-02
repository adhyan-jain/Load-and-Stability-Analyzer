import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg">
      <div className="flex items-center gap-2 mb-8">
        <Logo size={30} />
        <span className="font-bold text-sm text-text-primary tracking-wide">
          LSAnalyzer
        </span>
      </div>

      <div className="w-full max-w-sm bg-bg-card border border-border rounded-xl p-8">
        <h1 className="text-xl font-bold text-text-primary mb-1">
          Welcome back
        </h1>
        <p className="text-xs text-text-muted mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg font-bold text-xs py-2.5 rounded-md hover:opacity-80 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        <p className="text-xs text-text-muted text-center mt-5">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-accent no-underline hover:opacity-80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
