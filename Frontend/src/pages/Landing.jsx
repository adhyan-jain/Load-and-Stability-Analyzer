import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 h-14 bg-bg-card border-b border-border flex items-center px-8 gap-6">
        <div className="flex items-center gap-2 flex-1">
          <Logo size={28} />
          <span className="font-bold text-sm text-text-primary tracking-wide">
            LSAnalyzer
          </span>
        </div>
        <nav className="flex gap-6">
          {["Features", "How It Works"].map((n) => (
            <a
              key={n}
              href={`#${n.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs text-text-dim hover:text-text-primary no-underline transition-colors"
            >
              {n}
            </a>
          ))}
        </nav>
        <Link
          to="/login"
          className="bg-accent text-bg font-bold text-xs px-4 py-2 rounded-md no-underline hover:opacity-80 transition-opacity"
        >
          Launch App
        </Link>
      </header>

      <section className="max-w-3xl mx-auto px-8 pt-24 pb-16 text-center">
        <p className="text-[11px] text-accent tracking-[0.15em] uppercase mb-6">
          Open Source Load Testing
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-text-primary mb-6">
          Load test your APIs.
          <br />
          <span className="text-accent">Find collapse.</span>
        </h1>
        <p className="text-text-dim text-sm leading-relaxed max-w-lg mx-auto mb-10">
          Fire concurrent requests at your endpoints, measure P95 latency,
          detect system collapse, and get a stability score.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/signup"
            className="bg-accent text-bg font-bold text-sm px-6 py-3 rounded-md no-underline hover:opacity-80 transition-opacity"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="border border-border text-text-primary font-semibold text-sm px-6 py-3 rounded-md no-underline hover:border-text-dim transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section id="features" className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Latency Analysis",
              desc: "Tracks min, avg, P95, and max latency across every request.",
            },
            {
              title: "Collapse Detection",
              desc: "Detects when error rates spike past thresholds under load.",
            },
            {
              title: "Retry Amplification",
              desc: "Measures how retries compound load under failure conditions.",
            },
            {
              title: "Configurable Load",
              desc: "Set concurrency, request count, ramp-up mode, and retries.",
            },
            {
              title: "Stability Score",
              desc: "A 0-100 score summarizing endpoint reliability under stress.",
            },
            {
              title: "Endpoint History",
              desc: "Review past test results and compare runs over time.",
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="bg-bg-card border border-border rounded-lg p-5"
            >
              <h3 className="text-sm font-bold text-text-primary mb-2">
                {title}
              </h3>
              <p className="text-xs text-text-dim leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Configure",
                desc: "Set your target URL, concurrency, and request settings.",
              },
              {
                step: "02",
                title: "Analyze",
                desc: "The engine fires requests and collects real-time metrics.",
              },
              {
                step: "03",
                title: "Inspect",
                desc: "View charts, stability score, and detailed breakdowns.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <span className="text-3xl font-bold text-accent/30">
                  {step}
                </span>
                <h3 className="text-sm font-bold text-text-primary mt-2 mb-1">
                  {title}
                </h3>
                <p className="text-xs text-text-dim leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-[11px] text-text-muted">LSAnalyzer v1.0.0</span>
        </div>
        <span className="text-[11px] text-text-muted">MIT License</span>
      </footer>
    </div>
  );
}
