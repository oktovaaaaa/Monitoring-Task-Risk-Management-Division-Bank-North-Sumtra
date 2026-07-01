package repository

import (
	"backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UnitRepository interface {
	FindByID(id uuid.UUID) (*models.Unit, error)
	Create(unit *models.Unit) error
	FindAll() ([]models.Unit, error)
}

type unitRepository struct {
	db *gorm.DB
}

func NewUnitRepository(db *gorm.DB) UnitRepository {
	return &unitRepository{db: db}
}

func (r *unitRepository) FindByID(id uuid.UUID) (*models.Unit, error) {
	var unit models.Unit
	err := r.db.Where("id = ?", id).First(&unit).Error
	if err != nil {
		return nil, err
	}
	return &unit, nil
}

func (r *unitRepository) Create(unit *models.Unit) error {
	return r.db.Create(unit).Error
}

func (r *unitRepository) FindAll() ([]models.Unit, error) {
	var units []models.Unit
	err := r.db.Find(&units).Error
	return units, err
}
