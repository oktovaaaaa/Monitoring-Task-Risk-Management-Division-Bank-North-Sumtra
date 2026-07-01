package service

import (
	"backend/internal/models"
	"backend/internal/repository"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type TaskService interface {
	CreateTask(title, description string, unitID uuid.UUID) error
	GetTasks(userRole models.Role, userUnitID *uuid.UUID, filterUnitID *uuid.UUID) ([]models.Task, error)
	SubmitTask(taskID, userID uuid.UUID, description, fileURL string) error
	ReviewTask(taskID, adminID uuid.UUID, action string, rejectionReason string) error
}

type taskService struct {
	taskRepo  repository.TaskRepository
	unitRepo  repository.UnitRepository
	userRepo  repository.UserRepository
	notifRepo repository.NotificationRepository
}

func NewTaskService(
	taskRepo repository.TaskRepository,
	unitRepo repository.UnitRepository,
	userRepo repository.UserRepository,
	notifRepo repository.NotificationRepository,
) TaskService {
	return &taskService{
		taskRepo:  taskRepo,
		unitRepo:  unitRepo,
		userRepo:  userRepo,
		notifRepo: notifRepo,
	}
}

func (s *taskService) CreateTask(title, description string, unitID uuid.UUID) error {
	if title == "" {
		return errors.New("judul tugas wajib diisi")
	}

	// Verify that the Unit exists
	_, err := s.unitRepo.FindByID(unitID)
	if err != nil {
		return errors.New("unit tidak ditemukan")
	}

	task := &models.Task{
		Title:       title,
		Description: description,
		UnitID:      unitID,
		Status:      "open",
	}

	return s.taskRepo.Create(task)
}

func (s *taskService) GetTasks(userRole models.Role, userUnitID *uuid.UUID, filterUnitID *uuid.UUID) ([]models.Task, error) {
	// If user is Employee, they only see tasks from their own unit
	if userRole == models.RoleEmployee {
		if userUnitID == nil {
			return []models.Task{}, nil // No unit assigned
		}
		return s.taskRepo.FindByUnit(*userUnitID)
	}

	// Super Admin or Unit Admin can filter or list all
	if filterUnitID != nil && *filterUnitID != uuid.Nil {
		return s.taskRepo.FindByUnit(*filterUnitID)
	}

	// Unit Admin might be restricted to their own unit if not filtering, but let's allow them to see all if no filter
	if userRole == models.RoleUnitAdmin && userUnitID != nil && filterUnitID == nil {
		return s.taskRepo.FindByUnit(*userUnitID)
	}

	return s.taskRepo.FindAll()
}

func (s *taskService) SubmitTask(taskID, userID uuid.UUID, description, fileURL string) error {
	// Fetch task
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return errors.New("tugas tidak ditemukan")
	}

	// If approved, lock the task
	if task.Status == "approved" {
		return errors.New("tugas sudah selesai disetujui dan terkunci")
	}

	// Verify user is in the correct unit
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	if user.UnitID == nil || *user.UnitID != task.UnitID {
		return errors.New("anda bukan bagian dari divisi penerima tugas ini")
	}

	// Update task with submission details
	now := time.Now()
	task.SubmissionDescription = description
	task.SubmissionFileURL = fileURL
	task.SubmittedByID = &userID
	task.SubmittedAt = &now
	task.Status = "pending"
	task.RejectionReason = "" // Clear previous reason if any

	err = s.taskRepo.Update(task)
	if err == nil {
		// Notify Admins
		admins, errAdmins := s.userRepo.FindAllAdmins()
		if errAdmins == nil {
			var senderAvatar string
			if user.AvatarURL != nil {
				senderAvatar = *user.AvatarURL
			}
			var unitName string
			if user.Unit != nil {
				unitName = user.Unit.Name
			} else {
				unit, _ := s.unitRepo.FindByID(task.UnitID)
				if unit != nil {
					unitName = unit.Name
				}
			}
			for _, admin := range admins {
				notif := &models.Notification{
					UserID:       admin.ID,
					Title:        "Tugas Unit Dikumpulkan",
					Message:      fmt.Sprintf("Tugas unit %s telah dikumpulkan oleh %s", unitName, user.FullName),
					SenderName:   user.FullName,
					SenderAvatar: senderAvatar,
				}
				_ = s.notifRepo.Create(notif)
			}
		}
	}
	return err
}

func (s *taskService) ReviewTask(taskID, adminID uuid.UUID, action string, rejectionReason string) error {
	// Fetch task
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return errors.New("tugas tidak ditemukan")
	}

	if task.Status != "pending" {
		return errors.New("tugas harus berstatus pending agar bisa di-review")
	}

	now := time.Now()
	task.ReviewedByID = &adminID
	task.ReviewedAt = &now

	if action == "approve" {
		task.Status = "approved"
	} else if action == "reject" {
		task.Status = "rejected"
		task.RejectionReason = rejectionReason
	} else {
		return errors.New("aksi tidak valid. Hanya setujui (approve) atau tolak (reject)")
	}

	err = s.taskRepo.Update(task)
	if err == nil {
		// Notify Employees in the Unit
		employees, errEmployees := s.userRepo.FindEmployeesByUnit(task.UnitID)
		if errEmployees == nil {
			adminUser, errAdmin := s.userRepo.FindByID(adminID)
			var senderName string = "Admin"
			var senderAvatar string
			if errAdmin == nil {
				senderName = adminUser.FullName
				if adminUser.AvatarURL != nil {
					senderAvatar = *adminUser.AvatarURL
				}
			}

			var employeeName string = "Karyawan"
			if task.SubmittedByID != nil {
				subUser, _ := s.userRepo.FindByID(*task.SubmittedByID)
				if subUser != nil {
					employeeName = subUser.FullName
				}
			}

			var unitName string
			unit, _ := s.unitRepo.FindByID(task.UnitID)
			if unit != nil {
				unitName = unit.Name
			}

			var titleNotif string
			var msg string
			if action == "approve" {
				titleNotif = "Tugas Unit Disetujui"
				msg = fmt.Sprintf("Tugas unit %s yang dikumpulkan oleh %s telah DISETUJUI oleh Admin", unitName, employeeName)
			} else {
				titleNotif = "Tugas Unit Ditolak"
				msg = fmt.Sprintf("Tugas unit %s yang dikumpulkan oleh %s telah DITOLAK oleh Admin: %s", unitName, employeeName, rejectionReason)
			}

			for _, emp := range employees {
				notif := &models.Notification{
					UserID:       emp.ID,
					Title:        titleNotif,
					Message:      msg,
					SenderName:   senderName,
					SenderAvatar: senderAvatar,
				}
				_ = s.notifRepo.Create(notif)
			}
		}
	}
	return err
}
