package repository

import (
	"backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notif *models.Notification) error
	FindByUser(userID uuid.UUID) ([]models.Notification, error)
	MarkAllRead(userID uuid.UUID) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notif *models.Notification) error {
	return r.db.Create(notif).Error
}

func (r *notificationRepository) FindByUser(userID uuid.UUID) ([]models.Notification, error) {
	var notifs []models.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(30).Find(&notifs).Error
	if err != nil {
		return nil, err
	}
	return notifs, nil
}

func (r *notificationRepository) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&models.Notification{}).Where("user_id = ?", userID).Update("is_read", true).Error
}
