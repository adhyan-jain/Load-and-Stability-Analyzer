import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Endpoints() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api.endpoints(user.email);
        if (active) setItems(data.items || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (user?.email) load();
    return () => {
      active = false;
    };
  }, [user?.email]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Endpoints</h1>
      <p className="text-sm text-text-dim mb-8">
        History of tested endpoints and their results.
      </p>

      <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted col-span-2">
            URL
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Score
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Last Tested
          </p>
        </div>
        {!loading && items.length === 0 && (
          <div className="px-5 py-8 text-center text-xs text-text-muted">
            No tested endpoints yet.
          </div>
        )}
        {items.map((ep) => (
          <Link
            key={ep.url}
            to={`/endpoints/${encodeURIComponent(ep.url)}`}
            className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-border/20 transition-colors no-underline"
          >
            <p className="text-xs text-text-primary truncate col-span-2">
              {ep.url}
            </p>
            <p
              className={`text-xs font-bold ${
                ep.score >= 75
                  ? "text-accent"
                  : ep.score >= 45
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {ep.score.toFixed(1)}
            </p>
            <p className="text-xs text-text-muted">
              {new Date(ep.lastTested).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
