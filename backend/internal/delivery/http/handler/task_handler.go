package handler

import (
	"backend/internal/models"
	"backend/internal/service"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TaskHandler struct {
	taskService service.TaskService
}

func NewTaskHandler(ts service.TaskService) *TaskHandler {
	return &TaskHandler{taskService: ts}
}

type CreateSubTaskDTO struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type" binding:"required,oneof=link file table"`
}

type CreateTaskRequest struct {
	Title       string             `json:"title" binding:"required"`
	Description string             `json:"description"`
	UnitID      uuid.UUID          `json:"unit_id" binding:"required"`
	SubTasks    []CreateSubTaskDTO `json:"sub_tasks"`
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	var subTasks []models.SubTask
	for i, st := range req.SubTasks {
		subTasks = append(subTasks, models.SubTask{
			Title:       st.Title,
			Description: st.Description,
			Type:        st.Type,
			Order:       i,
		})
	}

	if err := h.taskService.CreateTask(req.Title, req.Description, req.UnitID, subTasks); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Tugas berhasil dibuat untuk divisi kerja",
	})
}

type UpdateSubTaskDTO struct {
	ID          *uuid.UUID `json:"id"`
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Type        string     `json:"type" binding:"required,oneof=link file table"`
}

type UpdateTaskRequest struct {
	Title       string             `json:"title" binding:"required"`
	Description string             `json:"description"`
	UnitID      uuid.UUID          `json:"unit_id" binding:"required"`
	SubTasks    []UpdateSubTaskDTO `json:"sub_tasks"`
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	idStr := c.Param("id")
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID tugas tidak valid",
		})
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	var subTasks []models.SubTask
	for i, st := range req.SubTasks {
		var subTaskID uuid.UUID
		if st.ID != nil {
			subTaskID = *st.ID
		}
		subTasks = append(subTasks, models.SubTask{
			ID:          subTaskID,
			Title:       st.Title,
			Description: st.Description,
			Type:        st.Type,
			Order:       i,
		})
	}

	if err := h.taskService.UpdateTask(taskID, req.Title, req.Description, req.UnitID, subTasks); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Tugas berhasil diperbarui",
	})
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	// Parse current user context
	roleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	var userRole models.Role
	if r, ok := roleVal.(models.Role); ok {
		userRole = r
	} else if rStr, ok := roleVal.(string); ok {
		userRole = models.Role(rStr)
	} else {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Format role tidak valid",
		})
		return
	}

	var userUnitID *uuid.UUID
	if unitIDVal, exists := c.Get("unitId"); exists {
		if uidPtr, ok := unitIDVal.(*uuid.UUID); ok {
			userUnitID = uidPtr
		}
	}

	// Parse optional query filter
	var filterUnitID *uuid.UUID
	if unitQuery := c.Query("unit_id"); unitQuery != "" {
		if uid, err := uuid.Parse(unitQuery); err == nil {
			filterUnitID = &uid
		}
	}

	tasks, err := h.taskService.GetTasks(userRole, userUnitID, filterUnitID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Daftar tugas berhasil diambil",
		Data:    tasks,
	})
}

type SubmitTaskRequest struct {
	SubmissionDescription string `json:"submission_description" binding:"required"`
	SubmissionFileURL     string `json:"submission_file_url" binding:"required"`
}

func (h *TaskHandler) SubmitTask(c *gin.Context) {
	taskIDStr := c.Param("id")
	taskID, err := uuid.Parse(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID tugas tidak valid",
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

	var req SubmitTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	if err := h.taskService.SubmitTask(taskID, userID, req.SubmissionDescription, req.SubmissionFileURL); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Tugas berhasil dikirim dan menunggu review",
	})
}

type ReviewTaskRequest struct {
	Action          string `json:"action" binding:"required"` // approve, reject
	RejectionReason string `json:"rejection_reason"`
}

func (h *TaskHandler) ReviewTask(c *gin.Context) {
	taskIDStr := c.Param("id")
	taskID, err := uuid.Parse(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID tugas tidak valid",
		})
		return
	}

	adminIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	adminID, _ := uuid.Parse(adminIdStr.(string))

	var req ReviewTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	if err := h.taskService.ReviewTask(taskID, adminID, req.Action, req.RejectionReason); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	statusMsg := "disetujui"
	if req.Action == "reject" {
		statusMsg = "ditolak"
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Status tugas berhasil diperbarui menjadi " + statusMsg,
	})
}

func (h *TaskHandler) UploadTaskFile(c *gin.Context) {
	// Validate token presence (auth check)
	_, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}

	// 1. Retrieve the file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil file dari form request: " + err.Error(),
		})
		return
	}

	// 2. Validate maximum file size = 25MB
	const maxFileSize = 25 * 1024 * 1024 // 25 Megabytes
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Ukuran berkas melebihi batas maksimal 25MB",
		})
		return
	}

	// 3. Generate unique filename to avoid conflict
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("task_%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join("uploads", filename)

	// 4. Save file
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal menyimpan berkas ke server: " + err.Error(),
		})
		return
	}

	// 5. Construct public download URL
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if proto := c.GetHeader("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}
	
	fileURL := fmt.Sprintf("%s://%s/uploads/%s", scheme, c.Request.Host, filename)

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Berkas berhasil diunggah",
		Data: gin.H{
			"file_url":  fileURL,
			"file_name": file.Filename,
		},
	})
}

type SubmitSubTaskRequest struct {
	LinkValue string `json:"link_value"`
	FileURL   string `json:"file_url"`
	TableData string `json:"table_data"`
}

func (h *TaskHandler) SubmitSubTask(c *gin.Context) {
	subTaskIDStr := c.Param("subtaskId")
	subTaskID, err := uuid.Parse(subTaskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID sub-task tidak valid",
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

	var req SubmitSubTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	if err := h.taskService.SubmitSubTask(subTaskID, userID, req.LinkValue, req.FileURL, req.TableData); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Pekerjaan sub-task berhasil dikirim",
	})
}

type ReviewSubTaskRequest struct {
	SubmissionID    uuid.UUID `json:"submission_id" binding:"required"`
	Action          string    `json:"action" binding:"required"` // approve, reject
	RejectionReason string    `json:"rejection_reason"`
}

func (h *TaskHandler) ReviewSubTask(c *gin.Context) {
	subTaskIDStr := c.Param("subtaskId")
	subTaskID, err := uuid.Parse(subTaskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "ID sub-task tidak valid",
		})
		return
	}

	adminIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	adminID, _ := uuid.Parse(adminIdStr.(string))

	var req ReviewSubTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	if err := h.taskService.ReviewSubTask(subTaskID, adminID, req.SubmissionID, req.Action, req.RejectionReason); err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Review sub-task berhasil disimpan",
	})
}
