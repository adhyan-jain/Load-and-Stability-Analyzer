import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    testsRun: 0,
    avgScore: 0,
    endpoints: 0,
    alerts: 0,
    hasResults: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api.dashboard(user.email);
        if (active) setStats(data);
      } catch (_err) {
        if (active) {
          setStats((prev) => ({ ...prev, hasResults: false }));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (user?.email) {
      load();
    }
    return () => {
      active = false;
    };
  }, [user?.email]);

  const cards = [
    { label: "Tests Run", value: stats.testsRun },
    {
      label: "Avg Score",
      value: stats.hasResults ? stats.avgScore.toFixed(1) : "--",
    },
    { label: "Endpoints", value: stats.endpoints },
    { label: "Alerts", value: stats.alerts },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm text-text-dim mb-8">
        Overview of your load test results.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {cards.map(({ label, value }) => (
          <div key={label} className="bg-bg-card border rounded-lg p-4">
            <p className="text-[10px] text-text-muted mb-1">{label}</p>
            <p className="text-2xl font-bold text-text-primary">
              {loading ? "..." : value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-10 text-center">
        <p className="text-sm text-text-muted mb-4">
          {stats.hasResults
            ? "Run another test to track stability over time."
            : "No test results yet."}
        </p>
        <Link
          to="/test/new"
          className="inline-block bg-accent text-bg font-bold text-xs px-5 py-2.5 rounded-md no-underline hover:opacity-80"
        >
          {stats.hasResults ? "Run another test" : "Run your first test"}
        </Link>
      </div>
    </div>
  );
}
