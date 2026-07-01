package handler

import (
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/service"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService service.AuthService
	unitRepo    repository.UnitRepository
	userRepo    repository.UserRepository
}

func NewAuthHandler(authService service.AuthService, unitRepo repository.UnitRepository, userRepo repository.UserRepository) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		unitRepo:    unitRepo,
		userRepo:    userRepo,
	}
}

func (h *AuthHandler) GetCaptcha(c *gin.Context) {
	res, err := h.authService.GenerateCaptcha()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Failed to generate captcha",
			Data:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Captcha generated successfully",
		Data:    res,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid request payload",
			Data:    err.Error(),
		})
		return
	}

	res, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Login successful",
		Data:    res,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid request payload",
			Data:    err.Error(),
		})
		return
	}

	// Retrieve creator's info from context (set by AuthMiddleware)
	creatorRoleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusForbidden, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized: Role not found in context",
		})
		return
	}
	creatorRole := creatorRoleVal.(models.Role)

	creatorUnitIDVal, _ := c.Get("unitId")
	creatorUnitID, _ := creatorUnitIDVal.(*uuid.UUID)

	user, err := h.authService.Register(req, creatorRole, creatorUnitID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.CommonResponse{
		Status:  "success",
		Message: "User registered successfully",
		Data:    user,
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}

	userId, err := uuid.Parse(userIdStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid user ID in token",
		})
		return
	}

	user, err := h.userRepo.FindByID(userId)
	if err != nil {
		c.JSON(http.StatusNotFound, models.CommonResponse{
			Status:  "error",
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Profile retrieved successfully",
		Data:    user,
	})
}

func (h *AuthHandler) GetUnits(c *gin.Context) {
	units, err := h.unitRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Failed to retrieve units",
			Data:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Units retrieved successfully",
		Data:    units,
	})
}

func (h *AuthHandler) CreateUnit(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid request payload",
			Data:    err.Error(),
		})
		return
	}

	unit := &models.Unit{
		Name:        req.Name,
		Description: req.Description,
	}

	err := h.unitRepo.Create(unit)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Failed to create unit",
			Data:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.CommonResponse{
		Status:  "success",
		Message: "Unit created successfully",
		Data:    unit,
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}

	userId, err := uuid.Parse(userIdStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid user ID in token",
		})
		return
	}

	var req models.ProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid request payload",
			Data:    err.Error(),
		})
		return
	}

	err = h.authService.UpdateProfile(userId, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Profile updated successfully",
	})
}

func (h *AuthHandler) GetSettings(c *gin.Context) {
	res, err := h.authService.GetSystemSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Failed to retrieve settings",
			Data:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "System settings retrieved successfully",
		Data:    res,
	})
}

func (h *AuthHandler) UpdateSettings(c *gin.Context) {
	var req models.SystemSettingsDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid request payload",
			Data:    err.Error(),
		})
		return
	}

	err := h.authService.UpdateSystemSettings(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "System settings updated successfully",
	})
}

func (h *AuthHandler) UploadAvatar(c *gin.Context) {
	// 1. Validate auth token from context
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	_ = userIdStr

	// 2. Parse file from multipart form request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Failed to get file from request: " + err.Error(),
		})
		return
	}

	// 3. Validate file type (should be an image)
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.",
		})
		return
	}

	// 4. Generate unique filename to avoid overwrites
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join("uploads", filename)

	// 5. Save the file locally
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Failed to save file: " + err.Error(),
		})
		return
	}

	// 6. Construct public URL using the request host
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if proto := c.GetHeader("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}
	
	fileURL := fmt.Sprintf("%s://%s/uploads/%s", scheme, c.Request.Host, filename)

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "File uploaded successfully",
		Data:    fileURL,
	})
}

func (h *AuthHandler) GetEmployees(c *gin.Context) {
	// 1. Retrieve current user's role and unitId from context
	roleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusForbidden, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized: Role not found in context",
		})
		return
	}
	currentUserRole := roleVal.(models.Role)

	unitIDVal, _ := c.Get("unitId")
	currentUserUnitID, _ := unitIDVal.(*uuid.UUID)

	// 2. Parse filter unit_id from query parameter (if any)
	var filterUnitID *uuid.UUID
	unitQuery := c.Query("unit_id")
	if unitQuery != "" {
		parsedUUID, err := uuid.Parse(unitQuery)
		if err == nil {
			filterUnitID = &parsedUUID
		}
	}

	// 3. Retrieve list of employees
	employees, err := h.authService.ListEmployees(currentUserRole, currentUserUnitID, filterUnitID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Employees retrieved successfully",
		Data:    employees,
	})
}

func (h *AuthHandler) AssignEmployeesToUnit(c *gin.Context) {
	var req models.AssignEmployeesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	if err := h.authService.AssignEmployeesToUnit(req); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Karyawan berhasil ditugaskan ke unit kerja",
	})
}

