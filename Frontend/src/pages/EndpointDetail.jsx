import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function EndpointDetail() {
  const { user } = useAuth();
  const { encodedUrl } = useParams();
  const url = decodeURIComponent(encodedUrl || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const detail = await api.endpointDetail(user.email, url);
        if (!active) return;

        const m = detail.latest?.metrics || {};
        setData({
          stabilityScore: detail.latest?.stabilityScore,
          collapseDetected: detail.latest?.collapseDetected,
          retryAmplificationFactor: detail.latest?.retryAmplificationFactor,
          metrics: {
            totalRequests: m.totalRequests,
            successCount: m.successCount,
            errorCount: m.errorCount,
            errorRate:
              m.errorRate != null ? `${(m.errorRate * 100).toFixed(1)}%` : "--",
            throughput:
              m.throughputRps != null
                ? `${m.throughputRps.toFixed(1)} req/s`
                : "--",
            minLatency:
              m.minLatencyMs != null ? `${m.minLatencyMs.toFixed(0)} ms` : "--",
            avgLatency:
              m.avgLatencyMs != null ? `${m.avgLatencyMs.toFixed(0)} ms` : "--",
            p95Latency:
              m.p95LatencyMs != null ? `${m.p95LatencyMs.toFixed(0)} ms` : "--",
            maxLatency:
              m.maxLatencyMs != null ? `${m.maxLatencyMs.toFixed(0)} ms` : "--",
          },
        });
      } catch (_err) {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (user?.email && url) load();
    return () => {
      active = false;
    };
  }, [user?.email, url]);

  const score = data?.stabilityScore;
  const scoreColor =
    score >= 75
      ? "text-accent"
      : score >= 45
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link
        to="/endpoints"
        className="text-xs text-text-dim hover:text-text-primary no-underline transition-colors"
      >
        ← Back to Endpoints
      </Link>
      <h1 className="text-xl font-bold mt-4 mb-1 break-all">
        {url || "Unknown Endpoint"}
      </h1>
      <p className="text-xs text-text-muted mb-6">Last tested result</p>

      {loading ? (
        <div className="bg-bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-text-muted">Loading endpoint data...</p>
        </div>
      ) : !data ? (
        <div className="bg-bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-text-muted">
            No data available for this endpoint.
          </p>
        </div>
      ) : (
        <>
          
          <div className="bg-bg-card border border-border rounded-lg p-5 mb-6 flex items-center gap-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${scoreColor}`}>
                {score.toFixed(1)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mt-1">
                Stability Score
              </p>
            </div>
            <div className="text-xs text-text-dim space-y-1">
              <p>
                Collapse:{" "}
                <span
                  className={
                    data.collapseDetected ? "text-red-400" : "text-accent"
                  }
                >
                  {data.collapseDetected ? "Detected" : "None"}
                </span>
              </p>
              <p>
                Retry amplification: {data.retryAmplificationFactor.toFixed(2)}x
              </p>
            </div>
          </div>

          
          <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs font-semibold text-text-primary">Metrics</p>
            </div>
            {Object.entries(data.metrics).map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between px-5 py-3 border-b border-border last:border-0"
              >
                <p className="text-xs text-text-muted capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="text-xs font-semibold text-text-primary">{val}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
