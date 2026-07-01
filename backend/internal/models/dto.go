package models

import "github.com/google/uuid"

type RegisterRequest struct {
	Email    string     `json:"email" binding:"required,email"`
	Username *string    `json:"username"`
	NPP      *string    `json:"npp"`
	Password string     `json:"password"` // Optional if default password setting is active
	FullName string     `json:"full_name" binding:"required"`
	Role     Role       `json:"role" binding:"required,oneof=super_admin unit_admin employee"`
	UnitID   *uuid.UUID `json:"unit_id"` // Optional: used by super_admin when creating unit_admin
}

type LoginRequest struct {
	Email         string    `json:"email" binding:"required"` // Can be Email OR Username
	Password      string    `json:"password" binding:"required"`
	CaptchaID     uuid.UUID `json:"captcha_id" binding:"required"`
	CaptchaAnswer string    `json:"captcha_answer" binding:"required"`
}

type CaptchaResponse struct {
	CaptchaID   uuid.UUID `json:"captcha_id"`
	CaptchaCode string    `json:"captcha_code"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CommonResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ProfileUpdateRequest struct {
	FullName    string  `json:"full_name" binding:"required"`
	NPP         *string `json:"npp"`
	AvatarURL   *string `json:"avatar_url"`
	OldPassword string  `json:"old_password"`
	NewPassword string  `json:"new_password"`
}

type SystemSettingsDTO struct {
	UseDefaultPassword bool   `json:"use_default_password"`
	DefaultPassword    string `json:"default_password"`
}

type AssignEmployeesRequest struct {
	UnitID  uuid.UUID   `json:"unit_id" binding:"required"`
	UserIDs []uuid.UUID `json:"user_ids" binding:"required"`
}
