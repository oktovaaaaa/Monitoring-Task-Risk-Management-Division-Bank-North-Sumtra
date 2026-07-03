package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleSuperAdmin Role = "super_admin"
	RoleUnitAdmin  Role = "unit_admin"
	RoleEmployee   Role = "employee"
)

type Unit struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null;unique" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Email        *string        `gorm:"type:varchar(100);unique;index" json:"email"`
	Username     *string        `gorm:"type:varchar(50);index" json:"username"`
	NPP          string         `gorm:"type:varchar(50);not null;unique;index" json:"npp"`
	AvatarURL    *string        `gorm:"type:text" json:"avatar_url"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	FullName     string         `gorm:"type:varchar(100);not null" json:"full_name"`
	Role         Role           `gorm:"type:varchar(20);not null" json:"role"`
	UnitID       *uuid.UUID     `gorm:"type:uuid" json:"unit_id"`
	Unit         *Unit          `gorm:"foreignKey:UnitID" json:"unit,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate hook to generate UUIDs automatically
func (u *Unit) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

type Captcha struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	Code      string    `gorm:"type:varchar(10);not null" json:"-"`
	ExpiredAt time.Time `gorm:"not null" json:"-"`
}

func (c *Captcha) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

type Setting struct {
	Key   string `gorm:"primaryKey;type:varchar(100)" json:"key"`
	Value string `gorm:"type:text" json:"value"`
}

type Task struct {
	ID                    uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Title                 string         `gorm:"type:varchar(150);not null" json:"title"`
	Description           string         `gorm:"type:text" json:"description"`
	UnitID                uuid.UUID      `gorm:"type:uuid;not null;index" json:"unit_id"`
	Unit                  *Unit          `gorm:"foreignKey:UnitID" json:"unit,omitempty"`
	Status                string         `gorm:"type:varchar(20);not null;default:'open'" json:"status"` // open, pending, approved, rejected
	SubmissionDescription string         `gorm:"type:text" json:"submission_description"`
	SubmissionFileURL     string         `gorm:"type:text" json:"submission_file_url"`
	SubmittedByID         *uuid.UUID     `gorm:"type:uuid" json:"submitted_by_id"`
	SubmittedBy           *User          `gorm:"foreignKey:SubmittedByID" json:"submitted_by,omitempty"`
	SubmittedAt           *time.Time     `json:"submitted_at"`
	ReviewedByID          *uuid.UUID     `gorm:"type:uuid" json:"reviewed_by_id"`
	ReviewedBy            *User          `gorm:"foreignKey:ReviewedByID" json:"reviewed_by,omitempty"`
	ReviewedAt            *time.Time     `json:"reviewed_at"`
	RejectionReason       string         `gorm:"type:text" json:"rejection_reason"`
	CreatedAt             time.Time      `json:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at"`
	DeletedAt             gorm.DeletedAt `gorm:"index" json:"-"`
	SubTasks              []SubTask      `gorm:"foreignKey:TaskID;constraint:OnDelete:CASCADE" json:"sub_tasks,omitempty"`
}

func (t *Task) BeforeCreate(tx *gorm.DB) (err error) {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return
}

type SubTask struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	TaskID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"task_id"`
	Title       string         `gorm:"type:varchar(150);not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Type        string         `gorm:"type:varchar(20);not null" json:"type"` // "link", "file", "table"
	Order       int            `gorm:"type:integer;not null;default:0" json:"order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Submissions []SubTaskSubmission `gorm:"foreignKey:SubTaskID;constraint:OnDelete:CASCADE" json:"submissions,omitempty"`
}

func (st *SubTask) BeforeCreate(tx *gorm.DB) (err error) {
	if st.ID == uuid.Nil {
		st.ID = uuid.New()
	}
	return
}

type SubTaskSubmission struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	SubTaskID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"sub_task_id"`
	SubmittedByID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"submitted_by_id"`
	SubmittedBy     *User          `gorm:"foreignKey:SubmittedByID" json:"submitted_by,omitempty"`
	SubmittedAt     time.Time      `json:"submitted_at"`
	Status          string         `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, approved, rejected
	LinkValue       string         `gorm:"type:text" json:"link_value"`
	FileURL         string         `gorm:"type:text" json:"file_url"`
	TableData       string         `gorm:"type:text" json:"table_data"` // JSON string of dynamic table content
	ReviewedByID    *uuid.UUID     `gorm:"type:uuid" json:"reviewed_by_id"`
	ReviewedBy      *User          `gorm:"foreignKey:ReviewedByID" json:"reviewed_by,omitempty"`
	ReviewedAt      *time.Time     `json:"reviewed_at"`
	RejectionReason string         `gorm:"type:text" json:"rejection_reason"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (sts *SubTaskSubmission) BeforeCreate(tx *gorm.DB) (err error) {
	if sts.ID == uuid.Nil {
		sts.ID = uuid.New()
	}
	return
}

type Notification struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	User         *User          `gorm:"foreignKey:UserID" json:"-"`
	Title        string         `gorm:"type:varchar(150);not null" json:"title"`
	Message      string         `gorm:"type:text;not null" json:"message"`
	IsRead       bool           `gorm:"type:boolean;not null;default:false" json:"is_read"`
	SenderName   string         `gorm:"type:varchar(100)" json:"sender_name"`
	SenderAvatar string         `gorm:"type:text" json:"sender_avatar"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) (err error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return
}


