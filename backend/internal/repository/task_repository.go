package repository

import (
	"backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskRepository interface {
	Create(task *models.Task) error
	FindByID(id uuid.UUID) (*models.Task, error)
	FindAll() ([]models.Task, error)
	FindByUnit(unitID uuid.UUID) ([]models.Task, error)
	Update(task *models.Task) error
}

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

func (r *taskRepository) FindByID(id uuid.UUID) (*models.Task, error) {
	var task models.Task
	err := r.db.Preload("Unit").Preload("SubmittedBy").Preload("ReviewedBy").First(&task, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) FindAll() ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Preload("Unit").Preload("SubmittedBy").Preload("ReviewedBy").Order("created_at desc").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) FindByUnit(unitID uuid.UUID) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Preload("Unit").Preload("SubmittedBy").Preload("ReviewedBy").Where("unit_id = ?", unitID).Order("created_at desc").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) Update(task *models.Task) error {
	return r.db.Save(task).Error
}
