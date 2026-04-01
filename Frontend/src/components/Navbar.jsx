import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/test/new", label: "New Test" },
  { to: "/endpoints", label: "Endpoints" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 h-14 bg-bg-card border-b border-border flex items-center px-6 gap-6">
      <NavLink
        to="/dashboard"
        className="flex items-center gap-2 no-underline mr-4"
      >
        <Logo size={28} />
        <span className="text-text-primary font-bold text-sm tracking-wide">
          LSAnalyzer
        </span>
      </NavLink>

      <nav className="flex items-center gap-1 flex-1">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-xs px-3 py-1.5 rounded-full no-underline transition-colors ${
                isActive
                  ? "text-accent bg-accent/10"
                  : "text-text-dim hover:text-text-primary"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/test/new"
        className="bg-accent text-bg font-bold text-xs px-4 py-2 rounded-md no-underline hover:opacity-80 transition-opacity"
      >
        Run Test
      </NavLink>

      {user && (
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
          <span className="text-xs text-text-muted">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-text-dim hover:text-text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
