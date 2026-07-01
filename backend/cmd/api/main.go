package main

import (
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/delivery/http"
	"backend/internal/delivery/http/handler"
	"backend/internal/repository"
	"backend/internal/service"
	"fmt"
	"log"
)

func main() {
	// Initialize Config (includes loading env and database connection)
	config.LoadConfig()

	// Seed Database (includes GORM auto-migrations)
	db.SeedDatabase(config.AppConfig.DB)

	// Initialize Repositories
	userRepo := repository.NewUserRepository(config.AppConfig.DB)
	unitRepo := repository.NewUnitRepository(config.AppConfig.DB)
	captchaRepo := repository.NewCaptchaRepository(config.AppConfig.DB)
	settingRepo := repository.NewSettingRepository(config.AppConfig.DB)
	taskRepo := repository.NewTaskRepository(config.AppConfig.DB)
	notifRepo := repository.NewNotificationRepository(config.AppConfig.DB)

	// Initialize Services
	authService := service.NewAuthService(userRepo, unitRepo, captchaRepo, settingRepo, config.AppConfig.JWTSecret)
	taskService := service.NewTaskService(taskRepo, unitRepo, userRepo, notifRepo)

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService, unitRepo, userRepo)
	taskHandler := handler.NewTaskHandler(taskService)
	notifHandler := handler.NewNotificationHandler(notifRepo)

	// Setup Routes
	router := http.SetupRouter(authHandler, taskHandler, notifHandler)

	// Start Server
	addr := fmt.Sprintf(":%s", config.AppConfig.Port)
	log.Printf("Server is running on port %s", config.AppConfig.Port)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
