package main

import (
	"load_and_stability_analyzer/handler"
	"load_and_stability_analyzer/storage"
	"log"
	"net/http"
	"os"
)

func main() {
	dataDir := os.Getenv("LSA_DATA_DIR")
	store, err := storage.NewStore(dataDir)
	if err != nil {
		log.Fatalf("failed to initialize data store: %v", err)
	}
	handler.InitStore(store)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", handler.Health)
	mux.HandleFunc("POST /api/auth/signup", handler.Signup)
	mux.HandleFunc("POST /api/auth/login", handler.Login)
	mux.HandleFunc("POST /api/analyze", handler.Analyze)
	mux.HandleFunc("GET /api/dashboard", handler.Dashboard)
	mux.HandleFunc("GET /api/endpoints", handler.Endpoints)
	mux.HandleFunc("GET /api/endpoints/{encodedUrl}", handler.EndpointDetail)
	mux.HandleFunc("GET /api/results/{id}", handler.ResultByID)

	server := &http.Server{
		Addr:    ":8000",
		Handler: corsMiddleware(mux),
	}

	log.Println("server listening on port 8000")

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

