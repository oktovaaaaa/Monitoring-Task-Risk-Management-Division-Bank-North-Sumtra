package handler

import (
	"backend/internal/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MacroHandler struct {
	db *gorm.DB
}

func NewMacroHandler(db *gorm.DB) *MacroHandler {
	return &MacroHandler{db: db}
}

// GET /api/macro-data
// Optional query params: data_type, from_date (YYYY-MM-DD), to_date (YYYY-MM-DD), years (e.g. "5")
func (h *MacroHandler) GetDataPoints(c *gin.Context) {
	query := h.db.Model(&models.MacroDataPoint{}).Order("data_date asc")

	if dt := c.Query("data_type"); dt != "" {
		query = query.Where("data_type = ?", dt)
	}
	if from := c.Query("from_date"); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err == nil {
			query = query.Where("data_date >= ?", t)
		}
	}
	if to := c.Query("to_date"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err == nil {
			query = query.Where("data_date <= ?", t.Add(24*time.Hour-time.Second))
		}
	}
	if yrs := c.Query("years"); yrs != "" {
		var numYears int
		if _, err := parseIntParam(yrs, &numYears); err == nil && numYears > 0 {
			cutoff := time.Now().AddDate(-numYears, 0, 0)
			query = query.Where("data_date >= ?", cutoff)
		}
	}

	var points []models.MacroDataPoint
	if err := query.Find(&points).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{
			Status:  "error",
			Message: "Gagal mengambil data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{
		Status:  "success",
		Message: "Data berhasil diambil",
		Data:    points,
	})
}

type UpsertMacroDataPointReq struct {
	DataType   string `json:"data_type" binding:"required"`
	DataDate   string `json:"data_date" binding:"required"` // RFC3339 or YYYY-MM-DD
	Value      string `json:"value" binding:"required"`
	IsAutoDate bool   `json:"is_auto_date"`
}

// POST /api/macro-data
func (h *MacroHandler) CreateDataPoint(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{Status: "error", Message: "Unauthorized"})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var req UpsertMacroDataPointReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Format data tidak valid: " + err.Error()})
		return
	}

	dataDate, err := parseDateParam(req.DataDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Format tanggal tidak valid, gunakan YYYY-MM-DD atau RFC3339"})
		return
	}

	point := models.MacroDataPoint{
		DataType:   req.DataType,
		DataDate:   dataDate,
		Value:      req.Value,
		IsAutoDate: req.IsAutoDate,
		CreatedBy:  userID,
	}

	if err := h.db.Create(&point).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{Status: "error", Message: "Gagal menyimpan data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{Status: "success", Message: "Data berhasil disimpan", Data: point})
}

// POST /api/macro-data/batch — simpan banyak titik data sekaligus
type BatchUpsertReq struct {
	Points []UpsertMacroDataPointReq `json:"points" binding:"required"`
}

func (h *MacroHandler) BatchUpsertDataPoints(c *gin.Context) {
	userIdStr, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.CommonResponse{Status: "error", Message: "Unauthorized"})
		return
	}
	userID, _ := uuid.Parse(userIdStr.(string))

	var req BatchUpsertReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Format data tidak valid: " + err.Error()})
		return
	}

	var points []models.MacroDataPoint
	for _, p := range req.Points {
		dataDate, err := parseDateParam(p.DataDate)
		if err != nil {
			continue
		}
		points = append(points, models.MacroDataPoint{
			DataType:   p.DataType,
			DataDate:   dataDate,
			Value:      p.Value,
			IsAutoDate: p.IsAutoDate,
			CreatedBy:  userID,
		})
	}

	if len(points) == 0 {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Tidak ada data yang valid untuk disimpan"})
		return
	}

	if err := h.db.Create(&points).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{Status: "error", Message: "Gagal menyimpan data batch: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{Status: "success", Message: "Data batch berhasil disimpan", Data: points})
}

// PUT /api/macro-data/:id
func (h *MacroHandler) UpdateDataPoint(c *gin.Context) {
	idStr := c.Param("id")
	pointID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "ID tidak valid"})
		return
	}

	var req UpsertMacroDataPointReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Format data tidak valid: " + err.Error()})
		return
	}

	var point models.MacroDataPoint
	if err := h.db.First(&point, "id = ?", pointID).Error; err != nil {
		c.JSON(http.StatusNotFound, models.CommonResponse{Status: "error", Message: "Data tidak ditemukan"})
		return
	}

	dataDate, err := parseDateParam(req.DataDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "Format tanggal tidak valid"})
		return
	}

	point.DataType = req.DataType
	point.DataDate = dataDate
	point.Value = req.Value
	point.IsAutoDate = req.IsAutoDate
	point.UpdatedAt = time.Now()

	if err := h.db.Save(&point).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{Status: "error", Message: "Gagal memperbarui data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{Status: "success", Message: "Data berhasil diperbarui", Data: point})
}

// DELETE /api/macro-data/:id
func (h *MacroHandler) DeleteDataPoint(c *gin.Context) {
	idStr := c.Param("id")
	pointID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.CommonResponse{Status: "error", Message: "ID tidak valid"})
		return
	}

	if err := h.db.Delete(&models.MacroDataPoint{}, "id = ?", pointID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{Status: "error", Message: "Gagal menghapus data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CommonResponse{Status: "success", Message: "Data berhasil dihapus"})
}

// GET /api/macro-data/types — ambil daftar unik data_type yang tersedia
func (h *MacroHandler) GetDataTypes(c *gin.Context) {
	var types []string
	if err := h.db.Model(&models.MacroDataPoint{}).Distinct("data_type").Pluck("data_type", &types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.CommonResponse{Status: "error", Message: "Gagal mengambil tipe data"})
		return
	}
	c.JSON(http.StatusOK, models.CommonResponse{Status: "success", Message: "Tipe data berhasil diambil", Data: types})
}

// Helper: parse date string supporting YYYY-MM-DD and RFC3339
func parseDateParam(s string) (time.Time, error) {
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02", s)
}

func parseIntParam(s string, out *int) (string, error) {
	_, err := fmt.Sscanf(s, "%d", out)
	return s, err
}
