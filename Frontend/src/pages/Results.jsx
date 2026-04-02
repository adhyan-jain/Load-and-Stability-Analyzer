import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Results() {
  const { user } = useAuth();
  const location = useLocation();
  const [config, setConfig] = useState(location.state?.config || null);
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const testId = location.state?.testId;

  useEffect(() => {
    let active = true;
    async function loadById() {
      setLoading(true);
      setError("");
      try {
        const data = await api.resultById(user.email, testId);
        if (!active) return;
        setResult(data.result || null);
        setConfig((prev) => prev || { targetUrl: data.targetUrl });
      } catch (err) {
        if (active) setError(err.message || "Failed to load result");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!result && testId && user?.email) {
      loadById();
    }
    return () => {
      active = false;
    };
  }, [result, testId, user?.email]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Results</h1>
        <p className="text-sm text-text-muted">Loading result...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Results</h1>
        <p className="text-sm text-text-muted mb-6">
          {error && <span className="block text-red-400 mb-2">{error}</span>}
          {config
            ? `Test configured for ${config.targetUrl || "unknown endpoint"}, but no saved result was found.`
            : "No results to display. Run a test first."}
        </p>
        <Link
          to="/test/new"
          className="inline-block bg-accent text-bg font-bold text-xs px-5 py-2.5 rounded-md no-underline hover:opacity-80 transition-opacity"
        >
          Run a test
        </Link>
      </div>
    );
  }

  const m = result.metrics || {};
  const score = result.stabilityScore;

  const rows = [
    ["Total Requests", m.totalRequests],
    ["Successful", m.successCount],
    ["Errors", m.errorCount],
    [
      "Error Rate",
      m.errorRate != null ? (m.errorRate * 100).toFixed(1) + "%" : "--",
    ],
    [
      "Throughput",
      m.throughputRps != null ? m.throughputRps.toFixed(1) + " req/s" : "--",
    ],
    ["Min Latency", m.minLatencyMs != null ? m.minLatencyMs + " ms" : "--"],
    ["Avg Latency", m.avgLatencyMs != null ? m.avgLatencyMs + " ms" : "--"],
    ["P95 Latency", m.p95LatencyMs != null ? m.p95LatencyMs + " ms" : "--"],
    ["Max Latency", m.maxLatencyMs != null ? m.maxLatencyMs + " ms" : "--"],
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Results</h1>
      {config?.targetUrl && (
        <p className="text-xs text-text-muted mb-6 break-all">
          {config.targetUrl}
        </p>
      )}

      {score != null && (
        <div className="bg-bg-card border border-border rounded-lg p-5 mb-6 flex items-center gap-6">
          <div className="text-center">
            <p
              className={`text-4xl font-bold ${score >= 75 ? "text-accent" : score >= 45 ? "text-amber" : "text-danger"}`}
            >
              {score.toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-1">
              Stability Score
            </p>
          </div>
          <div className="text-xs text-text-dim space-y-1">
            <p>Collapse: {result.collapseDetected ? "Yes" : "No"}</p>
            {result.retryAmplificationFactor != null && (
              <p>
                Retry amplification:{" "}
                {result.retryAmplificationFactor.toFixed(2)}x
              </p>
            )}
          </div>
          <Link
            to="/test/new"
            className="ml-auto text-xs text-text-dim hover:text-text-primary transition-colors no-underline"
          >
            Run another
          </Link>
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Detailed Metrics
          </p>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-border">
                <td className="px-4 py-2.5 text-text-muted">{label}</td>
                <td className="px-4 py-2.5 text-text-primary">
                  {value ?? "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
