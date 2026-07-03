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
	FindSubTaskByID(id uuid.UUID) (*models.SubTask, error)
	CreateSubTaskSubmission(sub *models.SubTaskSubmission) error
	FindSubTaskSubmissionByID(id uuid.UUID) (*models.SubTaskSubmission, error)
	UpdateSubTaskSubmission(sub *models.SubTaskSubmission) error
	DeleteSubTaskSubmissions(subTaskID uuid.UUID) error
	DeleteSubTask(id uuid.UUID) error
	CreateSubTask(st *models.SubTask) error
	UpdateSubTask(st *models.SubTask) error
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
	err := r.db.Preload("Unit").
		Preload("SubmittedBy").
		Preload("ReviewedBy").
		Preload("SubTasks").
		Preload("SubTasks.Submissions").
		Preload("SubTasks.Submissions.SubmittedBy").
		Preload("SubTasks.Submissions.ReviewedBy").
		First(&task, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) FindAll() ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Preload("Unit").
		Preload("SubmittedBy").
		Preload("ReviewedBy").
		Preload("SubTasks").
		Preload("SubTasks.Submissions").
		Preload("SubTasks.Submissions.SubmittedBy").
		Preload("SubTasks.Submissions.ReviewedBy").
		Order("created_at desc").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) FindByUnit(unitID uuid.UUID) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.Preload("Unit").
		Preload("SubmittedBy").
		Preload("ReviewedBy").
		Preload("SubTasks").
		Preload("SubTasks.Submissions").
		Preload("SubTasks.Submissions.SubmittedBy").
		Preload("SubTasks.Submissions.ReviewedBy").
		Where("unit_id = ?", unitID).Order("created_at desc").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) Update(task *models.Task) error {
	return r.db.Save(task).Error
}

func (r *taskRepository) FindSubTaskByID(id uuid.UUID) (*models.SubTask, error) {
	var subTask models.SubTask
	err := r.db.Preload("Submissions").First(&subTask, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &subTask, nil
}

func (r *taskRepository) CreateSubTaskSubmission(sub *models.SubTaskSubmission) error {
	return r.db.Create(sub).Error
}

func (r *taskRepository) FindSubTaskSubmissionByID(id uuid.UUID) (*models.SubTaskSubmission, error) {
	var sub models.SubTaskSubmission
	err := r.db.Preload("SubmittedBy").First(&sub, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *taskRepository) UpdateSubTaskSubmission(sub *models.SubTaskSubmission) error {
	return r.db.Save(sub).Error
}

func (r *taskRepository) DeleteSubTaskSubmissions(subTaskID uuid.UUID) error {
	return r.db.Where("sub_task_id = ?", subTaskID).Delete(&models.SubTaskSubmission{}).Error
}

func (r *taskRepository) DeleteSubTask(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&models.SubTask{}).Error
}

func (r *taskRepository) CreateSubTask(st *models.SubTask) error {
	return r.db.Create(st).Error
}

func (r *taskRepository) UpdateSubTask(st *models.SubTask) error {
	return r.db.Model(&models.SubTask{}).Where("id = ?", st.ID).Updates(map[string]interface{}{
		"title":       st.Title,
		"description": st.Description,
		"type":        st.Type,
		"order":       st.Order,
	}).Error
}
