package handler

import (
	"backend/internal/models"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CyberHandler struct {
	db *gorm.DB
}

func NewCyberHandler(db *gorm.DB) *CyberHandler {
	return &CyberHandler{db: db}
}

// GetSubmissions retrieves all cyber risk assessments
func (h *CyberHandler) GetSubmissions(c *gin.Context) {
	var submissions []models.CyberSubmission
	err := h.db.Order("year desc").Find(&submissions).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil diambil",
		Data:    submissions,
	})
}

// GetSubmissionByYear retrieves a single cyber risk assessment by year
func (h *CyberHandler) GetSubmissionByYear(c *gin.Context) {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Tahun tidak valid",
		})
		return
	}

	var submission models.CyberSubmission
	err = h.db.Where("year = ?", year).First(&submission).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.CommonResponse{
				Status:  "error",
				Message: "Data tidak ditemukan untuk tahun tersebut",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil diambil",
		Data:    submission,
	})
}

type SaveCyberSubmissionReq struct {
	Year     int    `json:"year" binding:"required"`
	BankName string `json:"bank_name" binding:"required"`
	Assessor string `json:"assessor" binding:"required"`
	Scores   string `json:"scores"`
	Refs     string `json:"refs"`
	Units    string `json:"units"`
	Anz      string `json:"anz"`
	AnzEd    string `json:"anz_ed"`
	Matrices string `json:"matrices"`
}

// SaveSubmission inserts or updates a cyber risk assessment for a specific year
func (h *CyberHandler) SaveSubmission(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var req SaveCyberSubmissionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Format data tidak valid: " + err.Error(),
		})
		return
	}

	var submission models.CyberSubmission
	err := h.db.Where("year = ?", req.Year).First(&submission).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new record
			submission = models.CyberSubmission{
				Year:      req.Year,
				BankName:  req.BankName,
				Assessor:  req.Assessor,
				Scores:    req.Scores,
				Refs:      req.Refs,
				Units:     req.Units,
				Anz:       req.Anz,
				AnzEd:     req.AnzEd,
				Matrices:  req.Matrices,
				UserID:    userID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := h.db.Create(&submission).Error; err != nil {
				c.JSON(http.StatusInternalServerError, models.CommonResponse{
					Status:  "error",
					Message: "Gagal menyimpan data baru: " + err.Error(),
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, models.CommonResponse{
				Status:  "error",
				Message: "Gagal memeriksa data: " + err.Error(),
			})
			return
		}
	} else {
		// Update existing record
		submission.BankName = req.BankName
		submission.Assessor = req.Assessor
		submission.Scores = req.Scores
		submission.Refs = req.Refs
		submission.Units = req.Units
		submission.Anz = req.Anz
		submission.AnzEd = req.AnzEd
		submission.Matrices = req.Matrices
		submission.UserID = userID
		submission.UpdatedAt = time.Now()

		if err := h.db.Save(&submission).Error; err != nil {
			c.JSON(http.StatusInternalServerError, models.CommonResponse{
				Status:  "error",
				Message: "Gagal memperbarui data: " + err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil disimpan",
		Data:    submission,
	})
}

// DeleteSubmission deletes a cyber risk assessment by year
func (h *CyberHandler) DeleteSubmission(c *gin.Context) {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Tahun tidak valid",
		})
		return
	}

	var submission models.CyberSubmission
	err = h.db.Where("year = ?", year).First(&submission).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.CommonResponse{
				Status:  "error",
				Message: "Data tidak ditemukan untuk tahun tersebut",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal memproses penghapusan: " + err.Error(),
		})
		return
	}

	if err := h.db.Delete(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal menghapus data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil dihapus",
	})
}

// ExportSubmission generates a styled Excel file by invoking the Python exporter script
func (h *CyberHandler) ExportSubmission(c *gin.Context) {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Tahun tidak valid",
		})
		return
	}

	var submission models.CyberSubmission
	err = h.db.Where("year = ?", year).First(&submission).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.CommonResponse{
				Status:  "error",
				Message: "Data tidak ditemukan untuk tahun tersebut",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	// Prepare data to send to Python script
	type ExportData struct {
		BankName   string                 `json:"bank_name"`
		ActiveYear int                    `json:"active_year"`
		Scores     map[string]interface{} `json:"scores"`
		Refs       map[string]string      `json:"refs"`
		Units      map[string]string      `json:"units"`
		Anz        map[string]string      `json:"anz"`
	}

	var scores map[string]interface{}
	var refs map[string]string
	var units map[string]string
	var anz map[string]string

	json.Unmarshal([]byte(submission.Scores), &scores)
	json.Unmarshal([]byte(submission.Refs), &refs)
	json.Unmarshal([]byte(submission.Units), &units)
	json.Unmarshal([]byte(submission.Anz), &anz)

	data := ExportData{
		BankName:   submission.BankName,
		ActiveYear: submission.Year,
		Scores:     scores,
		Refs:       refs,
		Units:      units,
		Anz:        anz,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal memproses serialisasi data: " + err.Error(),
		})
		return
	}

	// Generate temporary file paths
	tempDir := os.TempDir()
	tempFileName := "Laporan_Maturitas_Siber_PT_Bank_Sumut_" + yearStr + ".xls"
	outputPath := filepath.Join(tempDir, tempFileName)

	templatePath := filepath.Join("templates", "Laporan_Maturitas_Siber_Template.xls")

	// Call python script
	cmd := exec.Command("python", "scripts/export_excel.py", templatePath, outputPath, string(jsonData))
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengekspor berkas Excel via Python: " + err.Error() + " | Output: " + string(output),
		})
		return
	}

	// Read output file
	fileBytes, err := os.ReadFile(outputPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal membaca berkas Excel hasil ekspor: " + err.Error(),
		})
		return
	}

	// Set headers for download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+tempFileName)
	c.Header("Content-Type", "application/vnd.ms-excel")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Expires", "0")
	c.Header("Cache-Control", "must-revalidate")
	c.Header("Pragma", "public")

	c.Data(http.StatusOK, "application/vnd.ms-excel", fileBytes)

	// Clean up temp file in background
	go os.Remove(outputPath)
}

// ExportPDF generates a styled PDF report by invoking the Python PDF exporter script
func (h *CyberHandler) ExportPDF(c *gin.Context) {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{
			Status:  "error",
			Message: "Tahun tidak valid",
		})
		return
	}

	var submission models.CyberSubmission
	err = h.db.Where("year = ?", year).First(&submission).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.CommonResponse{
				Status:  "error",
				Message: "Data tidak ditemukan untuk tahun tersebut",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	// Prepare data to send to Python script
	type ExportData struct {
		BankName   string                 `json:"bank_name"`
		ActiveYear int                    `json:"active_year"`
		Assessor   string                 `json:"assessor"`
		Scores     map[string]interface{} `json:"scores"`
		Anz        map[string]string      `json:"anz"`
	}

	var scores map[string]interface{}
	var anz map[string]string

	json.Unmarshal([]byte(submission.Scores), &scores)
	json.Unmarshal([]byte(submission.Anz), &anz)

	data := ExportData{
		BankName:   submission.BankName,
		ActiveYear: submission.Year,
		Assessor:   submission.Assessor,
		Scores:     scores,
		Anz:        anz,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal memproses serialisasi data: " + err.Error(),
		})
		return
	}

	// Generate temporary file paths
	tempDir := os.TempDir()
	tempFileName := "Laporan_Hasil_Penilaian_Risiko_Siber_PT_Bank_Sumut_" + yearStr + ".pdf"
	outputPath := filepath.Join(tempDir, tempFileName)

	// Call python script
	cmd := exec.Command("python", "scripts/export_pdf.py", outputPath, string(jsonData))
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengekspor berkas PDF via Python: " + err.Error() + " | Output: " + string(output),
		})
		return
	}

	// Read output file
	fileBytes, err := os.ReadFile(outputPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal membaca berkas PDF hasil ekspor: " + err.Error(),
		})
		return
	}

	// Set headers for download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+tempFileName)
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Expires", "0")
	c.Header("Cache-Control", "must-revalidate")
	c.Header("Pragma", "public")

	c.Data(http.StatusOK, "application/pdf", fileBytes)

	// Clean up temp file in background
	go os.Remove(outputPath)
}

