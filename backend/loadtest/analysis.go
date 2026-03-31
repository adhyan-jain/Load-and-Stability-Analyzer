package loadtest

import (
	"fmt"

	"load_and_stability_analyzer/models"
	"load_and_stability_analyzer/utils"
)

func Analyze(m models.Metrics, totalRetries int, costPerRequest float64) (
	collapseDetected bool,
	collapseMsg string,
	retryAmp float64,
	stabilityScore float64,
	costEstimate float64,
) {

	latencySlope := 0.0
	if m.AvgLatencyMs > 0 {
		latencySlope = m.P95LatencyMs / m.AvgLatencyMs
	}

	highErrorRate := m.ErrorRate > 0.20
	highLatencySpike := latencySlope > 5.0

	collapseDetected = highErrorRate || highLatencySpike

	switch {
	case highErrorRate && highLatencySpike:
		collapseMsg = fmt.Sprintf(
			"Collapse detected: error rate %.1f%% AND p95 latency is %.1fx the average (threshold: >5x).",
			m.ErrorRate*100, latencySlope,
		)
	case highErrorRate:
		collapseMsg = fmt.Sprintf(
			"Collapse detected: error rate %.1f%% exceeds 20%% threshold.",
			m.ErrorRate*100,
		)
	case highLatencySpike:
		collapseMsg = fmt.Sprintf(
			"Collapse detected: p95 latency is %.1fx the average (threshold: >5x) — severe tail latency.",
			latencySlope,
		)
	default:
		collapseMsg = "No collapse detected. System appears stable under this load."
	}

	if m.TotalRequests > 0 {
		retryAmp = float64(totalRetries) / float64(m.TotalRequests)
	}

	score := 100.0

	score -= utils.Clamp(m.ErrorRate*100, 0, 1) * 40

	p95Penalty := utils.Clamp((m.P95LatencyMs-200)/1800, 0, 1) * 30
	score -= p95Penalty

	rafPenalty := utils.Clamp(retryAmp, 0, 1) * 10
	score -= rafPenalty

	tpBonus := utils.Clamp((m.ThroughputRps-10)/90, 0, 1) * 10
	score += tpBonus

	stabilityScore = utils.Clamp(score, 0, 100)

	costEstimate = float64(m.TotalRequests+totalRetries) * costPerRequest

	return
}
