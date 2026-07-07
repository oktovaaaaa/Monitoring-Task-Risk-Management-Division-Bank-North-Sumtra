package http

import (
	"backend/internal/delivery/http/handler"
	"backend/internal/middleware"
	"backend/internal/models"
	"os"

	"github.com/gin-gonic/gin"
)

func SetupRouter(authHandler *handler.AuthHandler, taskHandler *handler.TaskHandler, notifHandler *handler.NotificationHandler, imamHandler *handler.ImamHandler) *gin.Engine {
	r := gin.Default()

	// Ensure uploads directory exists and setup static file serving
	_ = os.MkdirAll("./uploads", 0755)
	r.Static("/uploads", "./uploads")

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.GET("/captcha", authHandler.GetCaptcha)
			
			// Protected routes
			auth.Use(middleware.AuthMiddleware())
			{
				auth.GET("/me", authHandler.GetMe)
				auth.PUT("/profile", authHandler.UpdateProfile)
				auth.POST("/upload", authHandler.UploadAvatar)
				// Accessible by Super Admin and Unit Admin
				auth.POST("/register", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), authHandler.Register)
			}
		}

		// Units routes
		units := api.Group("/units")
		units.Use(middleware.AuthMiddleware())
		{
			// Super Admin & Unit Admin can view all units
			units.GET("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), authHandler.GetUnits)
			// Super Admin & Unit Admin can create new units
			units.POST("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), authHandler.CreateUnit)
			// Super Admin & Unit Admin can assign employees to units
			units.POST("/assign", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), authHandler.AssignEmployeesToUnit)
		}

		// Employees routes
		employees := api.Group("/employees")
		employees.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin))
		{
			employees.GET("", authHandler.GetEmployees)
		}

		// Settings routes
		settings := api.Group("/settings")
		settings.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin))
		{
			settings.GET("", authHandler.GetSettings)
			settings.POST("", authHandler.UpdateSettings)
		}

		// Tasks routes
		tasks := api.Group("/tasks")
		tasks.Use(middleware.AuthMiddleware())
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), taskHandler.CreateTask)
			tasks.PUT("/:id", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), taskHandler.UpdateTask)
			tasks.POST("/:id/submit", middleware.RequireRole(models.RoleEmployee, models.RoleImam), taskHandler.SubmitTask)
			tasks.POST("/:id/review", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), taskHandler.ReviewTask)
			tasks.POST("/subtasks/:subtaskId/submit", middleware.RequireRole(models.RoleEmployee, models.RoleImam), taskHandler.SubmitSubTask)
			tasks.POST("/subtasks/:subtaskId/review", middleware.RequireRole(models.RoleSuperAdmin, models.RoleUnitAdmin), taskHandler.ReviewSubTask)
			tasks.POST("/upload", taskHandler.UploadTaskFile)
		}

		// Imam routes
		imam := api.Group("/imam")
		imam.Use(middleware.AuthMiddleware(), middleware.RequireRole(models.RoleImam))
		{
			imam.GET("/submissions", imamHandler.GetSubmissions)
			imam.POST("/submissions", imamHandler.CreateSubmission)
			imam.PUT("/submissions/:id", imamHandler.UpdateSubmission)
			imam.DELETE("/submissions/:id", imamHandler.DeleteSubmission)
		}

		// Notifications routes
		notifications := api.Group("/notifications")
		notifications.Use(middleware.AuthMiddleware())
		{
			notifications.GET("", notifHandler.GetNotifications)
			notifications.POST("/read", notifHandler.MarkNotificationsRead)
		}
	}

	return r
}
