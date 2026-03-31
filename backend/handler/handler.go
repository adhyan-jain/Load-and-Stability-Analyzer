package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"load_and_stability_analyzer/loadtest"
	"load_and_stability_analyzer/models"
	"load_and_stability_analyzer/storage"
)

var dataStore *storage.Store

func InitStore(s *storage.Store) {
	dataStore = s
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("[handler] encode response failed: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func requireStore(w http.ResponseWriter) bool {
	if dataStore == nil {
		writeError(w, http.StatusInternalServerError, "data store not initialized")
		return false
	}
	return true
}

func requireUserEmail(w http.ResponseWriter, r *http.Request) (string, bool) {
	email := strings.TrimSpace(r.URL.Query().Get("userEmail"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "userEmail query param is required")
		return "", false
	}
	return email, true
}

func Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func Signup(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	user, err := dataStore.Signup(req.Name, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, storage.ErrUserExists) {
			writeError(w, http.StatusConflict, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"user": user})
}

func Login(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	user, err := dataStore.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, storage.ErrInvalidCredential) {
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func Analyze(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	var req struct {
		UserEmail string            `json:"userEmail"`
		Config    models.TestConfig `json:"config"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	cfg := req.Config
	if strings.TrimSpace(cfg.TargetURL) == "" {
		writeError(w, http.StatusBadRequest, "config.targetUrl is required")
		return
	}
	cfg.RequestMethod = strings.ToUpper(strings.TrimSpace(cfg.RequestMethod))
	if cfg.RequestMethod == "" {
		cfg.RequestMethod = http.MethodGet
	}
	if cfg.RequestMethod != http.MethodGet && cfg.RequestMethod != http.MethodPost {
		writeError(w, http.StatusBadRequest, "config.requestMethod must be GET or POST")
		return
	}

	log.Printf("[Analyze] method=%s target=%s requests=%d concurrency=%d rampUp=%v",
		cfg.RequestMethod, cfg.TargetURL, cfg.TotalRequests, cfg.Concurrency, cfg.RampUp)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	metrics, totalRetries, err := loadtest.Run(ctx, cfg)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load test failed: "+err.Error())
		return
	}

	collapseDetected, collapseMsg, retryAmp, stabilityScore, costEstimate :=
		loadtest.Analyze(metrics, totalRetries, cfg.CostPerRequest)

	result := models.AnalysisResult{
		Metrics:                  metrics,
		CollapseDetected:         collapseDetected,
		CollapseThreshold:        collapseMsg,
		RetryAmplificationFactor: retryAmp,
		StabilityScore:           stabilityScore,
		CostEstimate:             costEstimate,
	}

	run, err := dataStore.SaveTestRun(req.UserEmail, cfg, result)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"testId": run.ID,
		"result": result,
	})
}

func Dashboard(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	userEmail, ok := requireUserEmail(w, r)
	if !ok {
		return
	}

	stats, err := dataStore.GetDashboard(userEmail)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

func Endpoints(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	userEmail, ok := requireUserEmail(w, r)
	if !ok {
		return
	}

	items, err := dataStore.ListEndpointSummaries(userEmail)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func EndpointDetail(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	userEmail, ok := requireUserEmail(w, r)
	if !ok {
		return
	}

	targetURL := r.PathValue("encodedUrl")
	if targetURL == "" {
		writeError(w, http.StatusBadRequest, "missing encodedUrl path param")
		return
	}
	targetURL, _ = url.QueryUnescape(targetURL)

	detail, err := dataStore.GetEndpointDetail(userEmail, targetURL)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

func ResultByID(w http.ResponseWriter, r *http.Request) {
	if !requireStore(w) {
		return
	}

	userEmail, ok := requireUserEmail(w, r)
	if !ok {
		return
	}

	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		writeError(w, http.StatusBadRequest, "missing id path param")
		return
	}

	run, err := dataStore.GetResultByID(userEmail, id)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"testId": run.ID, "targetUrl": run.TargetURL, "result": run.Result})
}
