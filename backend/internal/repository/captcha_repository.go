package repository

import (
	"backend/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CaptchaRepository interface {
	Create(captcha *models.Captcha) error
	FindByID(id uuid.UUID) (*models.Captcha, error)
	Delete(id uuid.UUID) error
	CleanExpired() error
}

type captchaRepository struct {
	db *gorm.DB
}

func NewCaptchaRepository(db *gorm.DB) CaptchaRepository {
	return &captchaRepository{db: db}
}

func (r *captchaRepository) Create(captcha *models.Captcha) error {
	return r.db.Create(captcha).Error
}

func (r *captchaRepository) FindByID(id uuid.UUID) (*models.Captcha, error) {
	var captcha models.Captcha
	err := r.db.Where("id = ?", id).First(&captcha).Error
	if err != nil {
		return nil, err
	}
	return &captcha, nil
}

func (r *captchaRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Captcha{}, id).Error
}

func (r *captchaRepository) CleanExpired() error {
	return r.db.Where("expired_at < ?", time.Now()).Delete(&models.Captcha{}).Error
}
