package handler

import (
	"backend/internal/models"
	"backend/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	notifRepo repository.NotificationRepository
}

func NewNotificationHandler(nr repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{notifRepo: nr}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, err := uuid.Parse(userIdStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID user tidak valid",
		})
		return
	}

	notifications, err := h.notifRepo.FindByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data notifikasi: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Notifikasi berhasil diambil",
		Data:    notifications,
	})
}

func (h *NotificationHandler) MarkNotificationsRead(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, err := uuid.Parse(userIdStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID user tidak valid",
		})
		return
	}

	if err := h.notifRepo.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal memperbarui status notifikasi: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Semua notifikasi ditandai telah dibaca",
	})
}
