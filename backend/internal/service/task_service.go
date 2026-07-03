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
	CreateTask(title, description string, unitID uuid.UUID, subTasks []models.SubTask) error
	UpdateTask(taskID uuid.UUID, title, description string, unitID uuid.UUID, subTasks []models.SubTask) error
	GetTasks(userRole models.Role, userUnitID *uuid.UUID, filterUnitID *uuid.UUID) ([]models.Task, error)
	SubmitTask(taskID, userID uuid.UUID, description, fileURL string) error
	ReviewTask(taskID, adminID uuid.UUID, action string, rejectionReason string) error
	SubmitSubTask(subTaskID, userID uuid.UUID, linkValue, fileURL, tableData string) error
	ReviewSubTask(subTaskID, adminID uuid.UUID, submissionID uuid.UUID, action string, rejectionReason string) error
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

func (s *taskService) CreateTask(title, description string, unitID uuid.UUID, subTasks []models.SubTask) error {
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
		SubTasks:    subTasks,
	}

	return s.taskRepo.Create(task)
}

func (s *taskService) UpdateTask(taskID uuid.UUID, title, description string, unitID uuid.UUID, subTasks []models.SubTask) error {
	if title == "" {
		return errors.New("judul tugas wajib diisi")
	}

	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return errors.New("tugas tidak ditemukan")
	}

	_, err = s.unitRepo.FindByID(unitID)
	if err != nil {
		return errors.New("unit tidak ditemukan")
	}

	task.Title = title
	task.Description = description
	task.UnitID = unitID

	incomingIDs := make(map[uuid.UUID]bool)
	for _, st := range subTasks {
		if st.ID != uuid.Nil {
			incomingIDs[st.ID] = true
		}
	}

	for _, est := range task.SubTasks {
		if !incomingIDs[est.ID] {
			_ = s.taskRepo.DeleteSubTaskSubmissions(est.ID)
			_ = s.taskRepo.DeleteSubTask(est.ID)
		}
	}

	for i, st := range subTasks {
		st.TaskID = taskID
		st.Order = i
		if st.ID == uuid.Nil {
			st.ID = uuid.New()
			_ = s.taskRepo.CreateSubTask(&st)
		} else {
			_ = s.taskRepo.UpdateSubTask(&st)
		}
	}

	updatedTask, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return err
	}

	updatedTask.Title = title
	updatedTask.Description = description
	updatedTask.UnitID = unitID
	updatedTask.Unit = nil
	updatedTask.SubmittedBy = nil
	updatedTask.ReviewedBy = nil

	if len(updatedTask.SubTasks) > 0 {
		allApproved := true
		anyPending := false
		anyRejected := false

		for _, st := range updatedTask.SubTasks {
			stApproved := false
			stPending := false
			stRejected := false
			for _, subm := range st.Submissions {
				if subm.Status == "approved" {
					stApproved = true
					break
				}
				if subm.Status == "pending" {
					stPending = true
				}
				if subm.Status == "rejected" {
					stRejected = true
				}
			}

			if !stApproved {
				allApproved = false
			}
			if stPending {
				anyPending = true
			}
			if stRejected && !stApproved && !stPending {
				anyRejected = true
			}
		}

		if allApproved {
			updatedTask.Status = "approved"
		} else if anyPending {
			updatedTask.Status = "pending"
		} else if anyRejected {
			updatedTask.Status = "rejected"
		} else {
			updatedTask.Status = "open"
		}
	} else {
		if updatedTask.SubmittedByID != nil {
			if updatedTask.Status == "approved" || updatedTask.Status == "rejected" || updatedTask.Status == "pending" {
				// keep it
			} else {
				updatedTask.Status = "pending"
			}
		} else {
			updatedTask.Status = "open"
		}
	}

	return s.taskRepo.Update(updatedTask)
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

func (s *taskService) SubmitSubTask(subTaskID, userID uuid.UUID, linkValue, fileURL, tableData string) error {
	subTask, err := s.taskRepo.FindSubTaskByID(subTaskID)
	if err != nil {
		return errors.New("sub-task tidak ditemukan")
	}

	task, err := s.taskRepo.FindByID(subTask.TaskID)
	if err != nil {
		return errors.New("tugas induk tidak ditemukan")
	}

	if task.Status == "approved" {
		return errors.New("tugas induk sudah selesai disetujui")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	if user.UnitID == nil || *user.UnitID != task.UnitID {
		return errors.New("anda bukan bagian dari divisi penerima tugas ini")
	}

	// Check if there's already an active submission for this sub-task from this unit
	var activeSub *models.SubTaskSubmission
	for i := range subTask.Submissions {
		if subTask.Submissions[i].Status == "pending" || subTask.Submissions[i].Status == "approved" {
			activeSub = &subTask.Submissions[i]
			break
		}
	}

	if activeSub != nil {
		if activeSub.Status == "approved" {
			return errors.New("sub-task ini sudah selesai disetujui")
		}
		// Update existing pending submission
		activeSub.SubmittedByID = userID
		activeSub.SubmittedAt = time.Now()
		activeSub.LinkValue = linkValue
		activeSub.FileURL = fileURL
		activeSub.TableData = tableData
		activeSub.RejectionReason = ""
		err = s.taskRepo.UpdateSubTaskSubmission(activeSub)
	} else {
		// Create a new submission
		newSub := &models.SubTaskSubmission{
			SubTaskID:     subTaskID,
			SubmittedByID: userID,
			SubmittedAt:   time.Now(),
			Status:        "pending",
			LinkValue:     linkValue,
			FileURL:       fileURL,
			TableData:     tableData,
		}
		err = s.taskRepo.CreateSubTaskSubmission(newSub)
	}

	if err == nil {
		// Update parent task status to "pending" to notify admins that action is needed
		task.Status = "pending"
		_ = s.taskRepo.Update(task)
	}

	return err
}

func (s *taskService) ReviewSubTask(subTaskID, adminID uuid.UUID, submissionID uuid.UUID, action string, rejectionReason string) error {
	subTask, err := s.taskRepo.FindSubTaskByID(subTaskID)
	if err != nil {
		return errors.New("sub-task tidak ditemukan")
	}

	task, err := s.taskRepo.FindByID(subTask.TaskID)
	if err != nil {
		return errors.New("tugas induk tidak ditemukan")
	}

	submission, err := s.taskRepo.FindSubTaskSubmissionByID(submissionID)
	if err != nil {
		return errors.New("laporan pengerjaan sub-task tidak ditemukan")
	}

	if submission.Status != "pending" {
		return errors.New("laporan pengerjaan harus berstatus pending agar bisa di-review")
	}

	now := time.Now()
	submission.ReviewedByID = &adminID
	submission.ReviewedAt = &now

	if action == "approve" {
		submission.Status = "approved"
	} else if action == "reject" {
		submission.Status = "rejected"
		submission.RejectionReason = rejectionReason
	} else {
		return errors.New("aksi tidak valid. Hanya setujui (approve) atau tolak (reject)")
	}

	err = s.taskRepo.UpdateSubTaskSubmission(submission)
	if err != nil {
		return err
	}

	// Fetch task again with updated preloads to recalculate overall task status
	updatedTask, err := s.taskRepo.FindByID(task.ID)
	if err == nil {
		// Recalculate parent task status based on all subtasks status:
		// - If ALL subtasks are approved -> Task becomes approved
		// - If at least one subtask is pending -> Task becomes pending
		// - If any subtask is rejected and none are pending -> Task becomes rejected
		// - Otherwise (all open) -> Task becomes open
		allApproved := true
		anyPending := false
		anyRejected := false

		for _, st := range updatedTask.SubTasks {
			stApproved := false
			stPending := false
			stRejected := false
			for _, subm := range st.Submissions {
				if subm.Status == "approved" {
					stApproved = true
					break
				}
				if subm.Status == "pending" {
					stPending = true
				}
				if subm.Status == "rejected" {
					stRejected = true
				}
			}

			if !stApproved {
				allApproved = false
			}
			if stPending {
				anyPending = true
			}
			if stRejected && !stApproved && !stPending {
				anyRejected = true
			}
		}

		if allApproved {
			updatedTask.Status = "approved"
		} else if anyPending {
			updatedTask.Status = "pending"
		} else if anyRejected {
			updatedTask.Status = "rejected"
		} else {
			updatedTask.Status = "open"
		}
		_ = s.taskRepo.Update(updatedTask)
	}

	return nil
}
