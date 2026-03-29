# Load & Stability Analyzer

A full-stack load testing and API stability analysis tool. Configure tests against any HTTP endpoint, fire concurrent requests with optional ramp-up, and get back detailed latency metrics, collapse detection, and a weighted stability score — all from a clean, modern dashboard.

![Go](https://img.shields.io/badge/Backend-Go%201.25-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Bundler-Vite%207-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Concurrent Load Testing** — Worker-pool architecture with goroutines & channels for bounded concurrency
- **Ramp-Up Mode** — Gradually increases workers (1 → max) at one per second
- **Stability Score** — Weighted composite: error rate (40%) + P95 latency (30%) + retry amplification (10%) + throughput bonus (20%)
- **Collapse Detection** — Flags system collapse when error rate > 20% OR P95 > 5× average latency
- **Retry Amplification Factor** — Measures how much retries inflate total traffic
- **Cost Estimation** — Per-request cost × total requests for cloud billing projections
- **Multi-Page Dashboard** — Landing, Dashboard, New Test, Results, Endpoints, and Endpoint Detail views
- **Responsive UI** — Built with React 19, React Router 7, Tailwind CSS 4, and Recharts

---

## Folder Structure

```
Load & Stability Analyzer/
├── README.md
├── backend/
│   ├── go.mod                   # Go module (go 1.25)
│   ├── main.go                  # HTTP server (port 8000) + CORS middleware
│   ├── handler/
│   │   └── handler.go           # HTTP handlers — Health (GET) & Analyze (POST)
│   ├── loadtest/
│   │   ├── engine.go            # Worker pool, request firing, result aggregation
│   │   └── analysis.go          # Collapse detection, stability score, cost estimate
│   └── models/
│       └── models.go            # Shared structs (TestConfig, Metrics, AnalysisResult)
└── Frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js            # Vite + React + Tailwind CSS plugin
    ├── eslint.config.js
    └── src/
        ├── main.jsx              # React entry point
        ├── App.jsx               # React Router setup (BrowserRouter)
        ├── index.css             # Global styles
        ├── components/
        │   ├── AppLayout.jsx     # Layout wrapper (Navbar + Outlet)
        │   ├── Logo.jsx          # SVG hexagon logo with chart motif
        │   └── Navbar.jsx        # Top navigation bar with route links
        └── pages/
            ├── Landing.jsx       # Hero section, features grid, how-it-works
            ├── Dashboard.jsx     # Overview stats (tests run, avg score, etc.)
            ├── NewTest.jsx       # Load test configuration form
            ├── Results.jsx       # Stability score card + metrics table
            ├── Endpoints.jsx     # List of tested endpoints
            └── EndpointDetail.jsx # Per-endpoint history & details
```

---

## Tech Stack

| Layer        | Technology                           |
| ------------ | ------------------------------------ |
| **Backend**  | Go 1.25, `net/http` (stdlib)         |
| **Frontend** | React 19, React Router 7, Recharts 3 |
| **Styling**  | Tailwind CSS 4                       |
| **Bundler**  | Vite 7                               |
| **Linting**  | ESLint 9                             |

---

## Prerequisites

- **Go** ≥ 1.25 — https://go.dev/dl/
- **Node.js** ≥ 18 + npm — https://nodejs.org/

---

## Getting Started

### 1. Start the Backend

```bash
cd backend
go run main.go
# → server listening on port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

### 2. Start the Frontend

```bash
cd Frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Usage

1. Open **http://localhost:5173** in your browser.
2. Click **Run Test** or navigate to **New Test**.
3. Fill in the configuration form:
   | Field | Description | Example |
   |-------|-------------|---------|
   | **Target URL** | Any HTTP/HTTPS endpoint | `https://httpbin.org/get` |
   | **Total Requests** | Number of requests to send | `100` |
   | **Concurrency** | Parallel workers | `10` |
   | **Duration (sec)** | Max test duration (`0` = unlimited) | `0` |
   | **Retry Count** | Retries per failed request | `2` |
   | **Cost per Request** | USD cost for billing estimate | `0.000001` |
   | **Ramp-Up** | Start with 1 worker, add 1/sec | `true` |
4. Click **Run Analysis**.
5. View results on the **Results** page:
   - **Stability Score** (0–100)
   - **Collapse Detected** (yes / no with explanation)
   - **Latency Metrics** — avg, min, max, P95
   - **Throughput** — requests per second
   - **Error Rate**
   - **Retry Amplification Factor**
   - **Cost Estimate**

---

## API Reference

### `GET /api/health`

Returns server health status.

```json
{ "status": "ok" }
```

### `POST /api/analyze`

Runs a load test and returns analysis results.

**Request body:**

```json
{
  "targetURL": "https://httpbin.org/get",
  "totalRequests": 100,
  "concurrency": 10,
  "durationSec": 0,
  "rampUp": false,
  "retryCount": 2,
  "costPerRequest": 0.000001
}
```

**Response:**

```json
{
  "metrics": {
    "totalRequests": 100,
    "successCount": 98,
    "errorCount": 2,
    "errorRate": 0.02,
    "avgLatencyMs": 230.5,
    "minLatencyMs": 180.1,
    "maxLatencyMs": 950.3,
    "p95LatencyMs": 720.2,
    "throughputRPS": 12.4,
    "totalDurationMs": 8064
  },
  "collapseDetected": false,
  "collapseThreshold": "No collapse detected. System appears stable under this load.",
  "retryAmplificationFactor": 0.02,
  "stabilityScore": 82.3,
  "costEstimate": 0.0001
}
```

---

## Key Design Decisions

| Decision                                    | Reason                                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Worker pool via goroutines + channels       | Bounded concurrency — prevents OOM on high request counts                                           |
| Single shared `http.Client`                 | Reuses TCP connections; mirrors real production behaviour                                           |
| Context propagation                         | Test stops cleanly on client disconnect or duration timeout                                         |
| P95 via post-hoc sort                       | All latencies collected first; sort once for accurate percentile                                    |
| Stability score (weighted)                  | Error rate (40%) + P95 latency (30%) + RAF (10%) + throughput bonus (20%)                           |
| Collapse = error rate > 20% OR P95 > 5× avg | Standard SRE knee-of-the-curve heuristics                                                           |
| React Router state for results              | Frontend passes config & results via `useNavigate` / `useLocation` state — no extra API round-trips |

---

## Frontend Routes

| Path                     | Page            | Description                        |
| ------------------------ | --------------- | ---------------------------------- |
| `/`                      | Landing         | Hero, features grid, how-it-works  |
| `/dashboard`             | Dashboard       | Overview stats & quick actions     |
| `/test/new`              | New Test        | Load test configuration form       |
| `/results`               | Results         | Stability score + detailed metrics |
| `/endpoints`             | Endpoints       | List of tested endpoints           |
| `/endpoints/:encodedUrl` | Endpoint Detail | Per-endpoint history               |

---

## Building for Production

```bash
# Backend binary
cd backend
go build -o load-stability-analyzer .

# Frontend static files
cd Frontend
npm run build
# → dist/ can be served by any static host or nginx
```

---

## License

This project is open source under the [MIT License](LICENSE).
