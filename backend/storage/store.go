package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"load_and_stability_analyzer/models"
)

var (
	ErrUserExists        = errors.New("user already exists")
	ErrInvalidCredential = errors.New("invalid email or password")
	ErrNotFound          = errors.New("resource not found")
)

type Store struct {
	mu        sync.Mutex
	usersFile string
	testsFile string
}

func NewStore(dataDir string) (*Store, error) {
	if dataDir == "" {
		dataDir = "data"
	}

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, err
	}

	s := &Store{
		usersFile: filepath.Join(dataDir, "users.json"),
		testsFile: filepath.Join(dataDir, "tests.json"),
	}

	if err := ensureJSONArrayFile(s.usersFile); err != nil {
		return nil, err
	}
	if err := ensureJSONArrayFile(s.testsFile); err != nil {
		return nil, err
	}

	return s, nil
}

func ensureJSONArrayFile(path string) error {
	if _, err := os.Stat(path); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	return os.WriteFile(path, []byte("[]\n"), 0o644)
}

func hashPassword(password string) string {
	s := sha256.Sum256([]byte(password))
	return hex.EncodeToString(s[:])
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func (s *Store) readUsersLocked() ([]models.User, error) {
	b, err := os.ReadFile(s.usersFile)
	if err != nil {
		return nil, err
	}
	var users []models.User
	if err := json.Unmarshal(b, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (s *Store) writeUsersLocked(users []models.User) error {
	b, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	return os.WriteFile(s.usersFile, b, 0o644)
}

func (s *Store) readTestsLocked() ([]models.TestRun, error) {
	b, err := os.ReadFile(s.testsFile)
	if err != nil {
		return nil, err
	}
	var tests []models.TestRun
	if err := json.Unmarshal(b, &tests); err != nil {
		return nil, err
	}
	return tests, nil
}

func (s *Store) writeTestsLocked(tests []models.TestRun) error {
	b, err := json.MarshalIndent(tests, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	return os.WriteFile(s.testsFile, b, 0o644)
}

func (s *Store) Signup(name, email, password string) (models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	email = normalizeEmail(email)
	if email == "" || strings.TrimSpace(name) == "" || strings.TrimSpace(password) == "" {
		return models.User{}, errors.New("name, email and password are required")
	}

	users, err := s.readUsersLocked()
	if err != nil {
		return models.User{}, err
	}

	for _, u := range users {
		if normalizeEmail(u.Email) == email {
			return models.User{}, ErrUserExists
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)
	user := models.User{
		Name:           strings.TrimSpace(name),
		Email:          email,
		PasswordSha256: hashPassword(password),
		CreatedAt:      now,
	}

	users = append(users, user)
	if err := s.writeUsersLocked(users); err != nil {
		return models.User{}, err
	}
	user.PasswordSha256 = ""
	return user, nil
}

func (s *Store) Login(email, password string) (models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	email = normalizeEmail(email)
	if email == "" || strings.TrimSpace(password) == "" {
		return models.User{}, ErrInvalidCredential
	}

	users, err := s.readUsersLocked()
	if err != nil {
		return models.User{}, err
	}

	passwordHash := hashPassword(password)
	for _, u := range users {
		if normalizeEmail(u.Email) == email && u.PasswordSha256 == passwordHash {
			u.PasswordSha256 = ""
			return u, nil
		}
	}
	return models.User{}, ErrInvalidCredential
}

func (s *Store) SaveTestRun(userEmail string, cfg models.TestConfig, result models.AnalysisResult) (models.TestRun, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	userEmail = normalizeEmail(userEmail)
	if userEmail == "" {
		return models.TestRun{}, errors.New("userEmail is required")
	}

	tests, err := s.readTestsLocked()
	if err != nil {
		return models.TestRun{}, err
	}

	now := time.Now().UTC()
	run := models.TestRun{
		ID:        fmt.Sprintf("run_%d", now.UnixNano()),
		UserEmail: userEmail,
		TargetURL: cfg.TargetURL,
		Config:    cfg,
		Result:    result,
		CreatedAt: now.Format(time.RFC3339),
	}

	tests = append(tests, run)
	if err := s.writeTestsLocked(tests); err != nil {
		return models.TestRun{}, err
	}

	return run, nil
}

func (s *Store) GetDashboard(userEmail string) (models.DashboardStats, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tests, err := s.readTestsLocked()
	if err != nil {
		return models.DashboardStats{}, err
	}

	userEmail = normalizeEmail(userEmail)
	if userEmail == "" {
		return models.DashboardStats{}, errors.New("userEmail is required")
	}

	endpoints := map[string]struct{}{}
	var totalScore float64
	var count, alerts int

	for _, t := range tests {
		if normalizeEmail(t.UserEmail) != userEmail {
			continue
		}
		count++
		totalScore += t.Result.StabilityScore
		if t.Result.CollapseDetected {
			alerts++
		}
		if t.TargetURL != "" {
			endpoints[t.TargetURL] = struct{}{}
		}
	}

	stats := models.DashboardStats{
		TestsRun:   count,
		Endpoints:  len(endpoints),
		Alerts:     alerts,
		HasResults: count > 0,
	}
	if count > 0 {
		stats.AvgScore = totalScore / float64(count)
	}
	return stats, nil
}

func (s *Store) ListEndpointSummaries(userEmail string) ([]models.EndpointSummary, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tests, err := s.readTestsLocked()
	if err != nil {
		return nil, err
	}
	userEmail = normalizeEmail(userEmail)
	if userEmail == "" {
		return nil, errors.New("userEmail is required")
	}

	type aggregate struct {
		url       string
		latest    models.TestRun
		testCount int
	}
	byURL := map[string]aggregate{}
	for _, t := range tests {
		if normalizeEmail(t.UserEmail) != userEmail {
			continue
		}
		a := byURL[t.TargetURL]
		a.url = t.TargetURL
		a.testCount++
		if a.latest.CreatedAt == "" || t.CreatedAt > a.latest.CreatedAt {
			a.latest = t
		}
		byURL[t.TargetURL] = a
	}

	out := make([]models.EndpointSummary, 0, len(byURL))
	for _, a := range byURL {
		out = append(out, models.EndpointSummary{
			URL:        a.url,
			LastTested: a.latest.CreatedAt,
			Score:      a.latest.Result.StabilityScore,
			Collapse:   a.latest.Result.CollapseDetected,
			TestCount:  a.testCount,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].LastTested > out[j].LastTested
	})
	return out, nil
}

func (s *Store) GetEndpointDetail(userEmail, targetURL string) (models.EndpointDetail, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tests, err := s.readTestsLocked()
	if err != nil {
		return models.EndpointDetail{}, err
	}
	userEmail = normalizeEmail(userEmail)
	targetURL = strings.TrimSpace(targetURL)
	if userEmail == "" || targetURL == "" {
		return models.EndpointDetail{}, errors.New("userEmail and targetUrl are required")
	}

	var history []models.TestRun
	for _, t := range tests {
		if normalizeEmail(t.UserEmail) == userEmail && t.TargetURL == targetURL {
			history = append(history, t)
		}
	}
	if len(history) == 0 {
		return models.EndpointDetail{}, ErrNotFound
	}

	sort.Slice(history, func(i, j int) bool {
		return history[i].CreatedAt > history[j].CreatedAt
	})

	latest := history[0]
	return models.EndpointDetail{
		URL:         targetURL,
		Latest:      latest.Result,
		LastTested:  latest.CreatedAt,
		History:     history,
		HistorySize: len(history),
	}, nil
}

func (s *Store) GetResultByID(userEmail, id string) (models.TestRun, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tests, err := s.readTestsLocked()
	if err != nil {
		return models.TestRun{}, err
	}
	userEmail = normalizeEmail(userEmail)
	id = strings.TrimSpace(id)

	for _, t := range tests {
		if t.ID == id && normalizeEmail(t.UserEmail) == userEmail {
			return t, nil
		}
	}
	return models.TestRun{}, ErrNotFound
}
