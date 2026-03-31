package loadtest

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"load_and_stability_analyzer/models"
	"load_and_stability_analyzer/utils"
)

func Run(ctx context.Context, cfg models.TestConfig) (models.Metrics, int, error) {

	if cfg.TargetURL == "" {
		return models.Metrics{}, 0, fmt.Errorf("targetUrl must not be empty")
	}
	if cfg.RequestMethod == "" {
		cfg.RequestMethod = http.MethodGet
	}
	cfg.RequestMethod = strings.ToUpper(strings.TrimSpace(cfg.RequestMethod))
	if cfg.RequestMethod != http.MethodGet && cfg.RequestMethod != http.MethodPost {
		return models.Metrics{}, 0, fmt.Errorf("requestMethod must be GET or POST")
	}
	if cfg.TotalRequests <= 0 {
		cfg.TotalRequests = 100
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = 10
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        cfg.Concurrency * 2,
			MaxIdleConnsPerHost: cfg.Concurrency * 2,
			IdleConnTimeout:     30 * time.Second,
		},
	}

	var cancel context.CancelFunc
	if cfg.DurationSec > 0 {
		ctx, cancel = context.WithTimeout(ctx, time.Duration(cfg.DurationSec)*time.Second)
		defer cancel()
	}

	jobs := make(chan int, cfg.TotalRequests)

	results := make(chan models.RequestResult, cfg.TotalRequests)

	startWorkers := cfg.Concurrency
	if cfg.RampUp {
		startWorkers = 1
	}

	var wg sync.WaitGroup

	wallStart := time.Now()

	spawnWorker := func() {
		wg.Add(1)
		go func() {
			defer wg.Done()
			worker(ctx, client, cfg, jobs, results)
		}()
	}

	for i := 0; i < startWorkers; i++ {
		spawnWorker()
	}

	if cfg.RampUp && cfg.Concurrency > 1 {
		go func() {
			ticker := time.NewTicker(1 * time.Second)
			defer ticker.Stop()
			active := startWorkers
			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					if active >= cfg.Concurrency {
						return
					}
					spawnWorker()
					active++
				}
			}
		}()
	}

	for i := 0; i < cfg.TotalRequests; i++ {
		jobs <- i
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	metrics, totalRetries := aggregate(results, wallStart, cfg)

	return metrics, totalRetries, nil
}

func worker(
	ctx context.Context,
	client *http.Client,
	cfg models.TestConfig,
	jobs <-chan int,
	results chan<- models.RequestResult,
) {
	for range jobs {

		select {
		case <-ctx.Done():
			return
		default:
		}

		result := fireRequest(ctx, client, cfg)
		results <- result
	}
}

func fireRequest(ctx context.Context, client *http.Client, cfg models.TestConfig) models.RequestResult {
	var (
		result  models.RequestResult
		lastErr error
	)

	attempts := 1 + cfg.RetryCount

	for attempt := 0; attempt < attempts; attempt++ {
		if attempt > 0 {
			result.Retries++
		}

		start := time.Now()
		var body io.Reader
		if cfg.RequestMethod == http.MethodPost {
			body = strings.NewReader(cfg.RequestBody)
		}

		req, err := http.NewRequestWithContext(ctx, cfg.RequestMethod, cfg.TargetURL, body)
		if err != nil {
			result.Error = err
			return result
		}
		if cfg.RequestMethod == http.MethodPost {
			req.Header.Set("Content-Type", "application/json")
		}

		resp, err := client.Do(req)
		latency := float64(time.Since(start).Microseconds()) / 1000.0

		if err != nil {
			lastErr = err
			continue
		}
		resp.Body.Close()

		result.LatencyMs = latency
		result.StatusCode = resp.StatusCode

		if resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("server error: %d", resp.StatusCode)
			continue
		}

		if !isSuccessfulStatus(cfg, resp.StatusCode) {
			lastErr = fmt.Errorf("unexpected status: %d", resp.StatusCode)
			break
		}

		result.Error = nil
		lastErr = nil
		break
	}

	if lastErr != nil {
		result.Error = lastErr
	}

	return result
}

func aggregate(results <-chan models.RequestResult, wallStart time.Time, cfg models.TestConfig) (models.Metrics, int) {
	var (
		latencies    []float64
		successCount int
		errorCount   int
		totalRetries int
	)

	for r := range results {
		if r.Error != nil || r.StatusCode == 0 || !isSuccessfulStatus(cfg, r.StatusCode) {
			errorCount++
		} else {
			successCount++
			latencies = append(latencies, r.LatencyMs)
		}
		totalRetries += r.Retries
	}

	wallMs := float64(time.Since(wallStart).Milliseconds())
	total := successCount + errorCount

	var errorRate float64
	if total > 0 {
		errorRate = float64(errorCount) / float64(total)
	}

	throughput := 0.0
	if wallMs > 0 {
		throughput = float64(total) / (wallMs / 1000.0)
	}

	return models.Metrics{
		TotalRequests:   total,
		SuccessCount:    successCount,
		ErrorCount:      errorCount,
		ErrorRate:       errorRate,
		AvgLatencyMs:    utils.Average(latencies),
		MinLatencyMs:    utils.Min(latencies),
		MaxLatencyMs:    utils.Max(latencies),
		P95LatencyMs:    utils.Percentile(latencies, 95),
		ThroughputRps:   throughput,
		TotalDurationMs: wallMs,
	}, totalRetries
}

func isSuccessfulStatus(cfg models.TestConfig, statusCode int) bool {
	if statusCode >= 200 && statusCode < 300 {
		return true
	}
	if cfg.Accept4xxAsSuccess && statusCode >= 400 && statusCode < 500 {
		return true
	}
	return false
}
