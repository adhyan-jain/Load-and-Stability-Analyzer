package models

type TestConfig struct {
	TargetURL      string  `json:"targetUrl"`
	RequestMethod  string  `json:"requestMethod"`
	RequestBody    string  `json:"requestBody"`
	TotalRequests  int     `json:"totalRequests"`
	Concurrency    int     `json:"concurrency"`
	DurationSec    int     `json:"durationSec"`
	RampUp         bool    `json:"rampUp"`
	Accept4xxAsSuccess bool `json:"accept4xxAsSuccess"`
	RetryCount     int     `json:"retryCount"`
	CostPerRequest float64 `json:"costPerRequest"`
}

type RequestResult struct {
	LatencyMs  float64
	StatusCode int
	Error      error
	Retries    int
}

type Metrics struct {
	TotalRequests  int     `json:"totalRequests"`
	SuccessCount   int     `json:"successCount"`
	ErrorCount     int     `json:"errorCount"`
	ErrorRate      float64 `json:"errorRate"`
	AvgLatencyMs   float64 `json:"avgLatencyMs"`
	MinLatencyMs   float64 `json:"minLatencyMs"`
	MaxLatencyMs   float64 `json:"maxLatencyMs"`
	P95LatencyMs   float64 `json:"p95LatencyMs"`
	ThroughputRps  float64 `json:"throughputRps"`
	TotalDurationMs float64 `json:"totalDurationMs"`
}

type AnalysisResult struct {
	Metrics                  Metrics `json:"metrics"`
	CollapseThreshold        string  `json:"collapseThreshold"`
	CollapseDetected         bool    `json:"collapseDetected"`
	RetryAmplificationFactor float64 `json:"retryAmplificationFactor"`
	StabilityScore           float64 `json:"stabilityScore"`
	CostEstimate             float64 `json:"costEstimate"`
}

type User struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	PasswordSha256 string `json:"passwordSha256"`
	CreatedAt      string `json:"createdAt"`
}

type TestRun struct {
	ID         string         `json:"id"`
	UserEmail  string         `json:"userEmail"`
	TargetURL  string         `json:"targetUrl"`
	Config     TestConfig     `json:"config"`
	Result     AnalysisResult `json:"result"`
	CreatedAt  string         `json:"createdAt"`
}

type DashboardStats struct {
	TestsRun   int     `json:"testsRun"`
	AvgScore   float64 `json:"avgScore"`
	Endpoints  int     `json:"endpoints"`
	Alerts     int     `json:"alerts"`
	HasResults bool    `json:"hasResults"`
}

type EndpointSummary struct {
	URL        string  `json:"url"`
	LastTested string  `json:"lastTested"`
	Score      float64 `json:"score"`
	Collapse   bool    `json:"collapse"`
	TestCount  int     `json:"testCount"`
}

type EndpointDetail struct {
	URL         string         `json:"url"`
	Latest      AnalysisResult `json:"latest"`
	LastTested  string         `json:"lastTested"`
	History     []TestRun      `json:"history"`
	HistorySize int            `json:"historySize"`
}