import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEFAULT_FORM = {
  targetUrl: "",
  requestMethod: "GET",
  requestBody: "",
  totalRequests: 100,
  concurrency: 10,
  retryCount: 0,
  rampUp: false,
  accept4xxAsSuccess: false,
};

export default function NewTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.targetUrl.trim()) return;

    setSubmitting(true);
    setError("");

    const config = {
      targetUrl: form.targetUrl.trim(),
      requestMethod: form.requestMethod,
      requestBody: form.requestBody,
      totalRequests: Number(form.totalRequests) || 0,
      concurrency: Number(form.concurrency) || 0,
      retryCount: Number(form.retryCount) || 0,
      rampUp: Boolean(form.rampUp),
      accept4xxAsSuccess: Boolean(form.accept4xxAsSuccess),
      durationSec: 0,
      costPerRequest: 0,
    };

    try {
      const res = await api.runTest({ userEmail: user?.email, config });
      navigate("/results", {
        state: {
          config,
          result: res.result,
          testId: res.testId,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to run load test");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">New Load Test</h1>
      <p className="text-sm text-text-dim mb-8">
        Configure and run a load test against an endpoint.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
            Target URL
          </label>
          <input
            type="url"
            required
            placeholder="https://api.example.com/health"
            value={form.targetUrl}
            onChange={(e) => set("targetUrl", e.target.value)}
            className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
            Request Method
          </label>
          <select
            value={form.requestMethod}
            onChange={(e) => set("requestMethod", e.target.value)}
            className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
            Request Body (for POST)
          </label>
          <textarea
            rows={6}
            placeholder='{"example":"value"}'
            value={form.requestBody}
            onChange={(e) => set("requestBody", e.target.value)}
            disabled={form.requestMethod !== "POST"}
            className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Requests
            </label>
            <input
              type="number"
              min={1}
              value={form.totalRequests}
              onChange={(e) => set("totalRequests", e.target.value)}
              className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Concurrency
            </label>
            <input
              type="number"
              min={1}
              value={form.concurrency}
              onChange={(e) => set("concurrency", e.target.value)}
              className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Retries
            </label>
            <input
              type="number"
              min={0}
              value={form.retryCount}
              onChange={(e) => set("retryCount", e.target.value)}
              className="w-full bg-bg-card border border-border rounded-md px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-bg-card border border-border rounded-md px-4 py-3">
          <div>
            <p className="text-sm text-text-primary font-medium">
              Ramp-up Mode
            </p>
            <p className="text-[11px] text-text-muted">
              Gradually increase concurrency
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("rampUp", !form.rampUp)}
            className={`w-10 h-5 rounded-full relative transition-colors ${form.rampUp ? "bg-accent" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${form.rampUp ? "left-5 bg-bg" : "left-0.5 bg-text-muted"}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between bg-bg-card border border-border rounded-md px-4 py-3">
          <div>
            <p className="text-sm text-text-primary font-medium">
              Accept 4xx as Success
            </p>
            <p className="text-[11px] text-text-muted">
              Treat client errors (4xx) as successful responses
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("accept4xxAsSuccess", !form.accept4xxAsSuccess)}
            className={`w-10 h-5 rounded-full relative transition-colors ${form.accept4xxAsSuccess ? "bg-accent" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${form.accept4xxAsSuccess ? "left-5 bg-bg" : "left-0.5 bg-text-muted"}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-bg font-bold text-sm py-3 rounded-md hover:opacity-80 transition-opacity"
        >
          {submitting ? "Running..." : "Run Load Test"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}
