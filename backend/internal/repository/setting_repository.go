package repository

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type SettingRepository interface {
	Get(key string) (string, error)
	Set(key string, value string) error
}

type settingRepository struct {
	db *gorm.DB
}

func NewSettingRepository(db *gorm.DB) SettingRepository {
	return &settingRepository{db: db}
}

func (r *settingRepository) Get(key string) (string, error) {
	var setting models.Setting
	err := r.db.Where("key = ?", key).First(&setting).Error
	if err != nil {
		return "", err
	}
	return setting.Value, nil
}

func (r *settingRepository) Set(key string, value string) error {
	var setting models.Setting
	err := r.db.Where("key = ?", key).First(&setting).Error
	if err != nil {
		// If setting doesn't exist, create it
		if err == gorm.ErrRecordNotFound {
			newSetting := models.Setting{Key: key, Value: value}
			return r.db.Create(&newSetting).Error
		}
		return err
	}

	// Update existing setting value
	setting.Value = value
	return r.db.Save(&setting).Error
}
