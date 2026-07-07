package handler

import (
	"backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImamHandler struct {
	db *gorm.DB
}

func NewImamHandler(db *gorm.DB) *ImamHandler {
	return &ImamHandler{db: db}
}

func (h *ImamHandler) GetSubmissions(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var submissions []models.ImamSubmission
	err := h.db.Where("user_id = ?", userID).Order("created_at desc").Find(&submissions).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil diambil",
		Data:    submissions,
	})
}

type CreateImamSubmissionReq struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	FileURL     string `json:"file_url"`
	FileName    string `json:"file_name"`
	TableData   string `json:"table_data"`
}

func (h *ImamHandler) CreateSubmission(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var req CreateImamSubmissionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	submission := models.ImamSubmission{
		Title:       req.Title,
		Description: req.Description,
		FileURL:     req.FileURL,
		FileName:    req.FileName,
		TableData:   req.TableData,
		UserID:      userID,
	}

	if err := h.db.Create(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal menyimpan data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil disimpan",
		Data:    submission,
	})
}

func (h *ImamHandler) UpdateSubmission(c *gin.Context) {
	idStr := c.Param("id")
	submissionID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID tidak valid",
		})
		return
	}

	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var req CreateImamSubmissionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	var submission models.ImamSubmission
	if err := h.db.Where("id = ? AND user_id = ?", submissionID, userID).First(&submission).Error; err != nil {
		c.JSON(http.StatusNotFound, models.CommonResponse{
			Status:  "error",
			Message: "Data tidak ditemukan atau Anda tidak berwenang",
		})
		return
	}

	submission.Title = req.Title
	submission.Description = req.Description
	submission.FileURL = req.FileURL
	submission.FileName = req.FileName
	submission.TableData = req.TableData
	submission.UpdatedAt = time.Now()

	if err := h.db.Save(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal memperbarui data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil diperbarui",
		Data:    submission,
	})
}

func (h *ImamHandler) DeleteSubmission(c *gin.Context) {
	idStr := c.Param("id")
	submissionID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID tidak valid",
		})
		return
	}

	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var submission models.ImamSubmission
	if err := h.db.Where("id = ? AND user_id = ?", submissionID, userID).First(&submission).Error; err != nil {
		c.JSON(http.StatusNotFound, models.CommonResponse{
			Status:  "error",
			Message: "Data tidak ditemukan atau Anda tidak berwenang",
		})
		return
	}

	if err := h.db.Delete(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal menghapus data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil dihapus",
	})
}
