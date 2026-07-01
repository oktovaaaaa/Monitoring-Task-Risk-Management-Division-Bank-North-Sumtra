package service

import (
	"backend/internal/models"
	"backend/internal/repository"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(req models.LoginRequest) (*models.AuthResponse, error)
	Register(req models.RegisterRequest, creatorRole models.Role, creatorUnitID *uuid.UUID) (*models.User, error)
	GenerateCaptcha() (*models.CaptchaResponse, error)
	UpdateProfile(userID uuid.UUID, req models.ProfileUpdateRequest) error
	GetSystemSettings() (*models.SystemSettingsDTO, error)
	UpdateSystemSettings(req models.SystemSettingsDTO) error
	ListEmployees(currentUserRole models.Role, currentUserUnitID *uuid.UUID, filterUnitID *uuid.UUID) ([]models.User, error)
	AssignEmployeesToUnit(req models.AssignEmployeesRequest) error
}

type authService struct {
	userRepo    repository.UserRepository
	unitRepo    repository.UnitRepository
	captchaRepo repository.CaptchaRepository
	settingRepo repository.SettingRepository
	jwtSecret   []byte
}

func NewAuthService(
	userRepo repository.UserRepository,
	unitRepo repository.UnitRepository,
	captchaRepo repository.CaptchaRepository,
	settingRepo repository.SettingRepository,
	jwtSecret []byte,
) AuthService {
	return &authService{
		userRepo:    userRepo,
		unitRepo:    unitRepo,
		captchaRepo: captchaRepo,
		settingRepo: settingRepo,
		jwtSecret:   jwtSecret,
	}
}

func (s *authService) GenerateCaptcha() (*models.CaptchaResponse, error) {
	_ = s.captchaRepo.CleanExpired()

	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := fmt.Sprintf("%03d", r.Intn(1000))

	captcha := &models.Captcha{
		Code:      code,
		ExpiredAt: time.Now().Add(time.Minute * 2),
	}

	err := s.captchaRepo.Create(captcha)
	if err != nil {
		return nil, err
	}

	return &models.CaptchaResponse{
		CaptchaID:   captcha.ID,
		CaptchaCode: captcha.Code,
	}, nil
}

func (s *authService) Login(req models.LoginRequest) (*models.AuthResponse, error) {
	_ = s.captchaRepo.CleanExpired()

	// 1. Verify captcha
	captcha, err := s.captchaRepo.FindByID(req.CaptchaID)
	if err != nil {
		return nil, errors.New("captcha not found or has expired")
	}

	_ = s.captchaRepo.Delete(captcha.ID)

	if time.Now().After(captcha.ExpiredAt) {
		return nil, errors.New("captcha has expired")
	}

	if captcha.Code != req.CaptchaAnswer {
		return nil, errors.New("incorrect captcha answer")
	}

	// 2. Find user by email or username
	user, err := s.userRepo.FindByEmailOrUsername(req.Email)
	if err != nil {
		return nil, errors.New("invalid email/username or password")
	}

	// Compare password hash
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email/username or password")
	}

	// Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       user.ID.String(),
		"email":     user.Email,
		"role":      string(user.Role),
		"unit_id":   getUUIDString(user.UnitID),
		"exp":       time.Now().Add(time.Hour * 24).Unix(), // 24 hours
		"issued_at": time.Now().Unix(),
	})

	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: tokenString,
		User:  *user,
	}, nil
}

func (s *authService) Register(req models.RegisterRequest, creatorRole models.Role, creatorUnitID *uuid.UUID) (*models.User, error) {
	var assignedUnitID *uuid.UUID

	switch creatorRole {
	case models.RoleSuperAdmin:
		if req.Role == models.RoleUnitAdmin {
			if req.UnitID == nil {
				return nil, errors.New("unit_id is required when creating a unit_admin")
			}
			_, err := s.unitRepo.FindByID(*req.UnitID)
			if err != nil {
				return nil, errors.New("specified unit does not exist")
			}
			assignedUnitID = req.UnitID
		} else if req.Role == models.RoleSuperAdmin {
			assignedUnitID = nil
		} else {
			// Super admin registers employee
			if req.UnitID != nil {
				_, err := s.unitRepo.FindByID(*req.UnitID)
				if err != nil {
					return nil, errors.New("specified unit does not exist")
				}
				assignedUnitID = req.UnitID
			}
		}

	case models.RoleUnitAdmin:
		if req.Role != models.RoleEmployee {
			return nil, errors.New("unit_admin can only register employee")
		}
		if creatorUnitID == nil {
			return nil, errors.New("unit_admin must be associated with a unit to register employees")
		}
		assignedUnitID = creatorUnitID

	default:
		return nil, errors.New("unauthorized to register users")
	}

	// Check if email already exists
	existingUser, _ := s.userRepo.FindByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("email is already registered")
	}

	// Check if username already exists
	if req.Username != nil && *req.Username != "" {
		existingUserByUsername, _ := s.userRepo.FindByEmailOrUsername(*req.Username)
		if existingUserByUsername != nil {
			return nil, errors.New("username is already taken")
		}
	}

	// Check if NPP already exists
	if req.NPP != nil && *req.NPP != "" {
		existingNppUser, _ := s.userRepo.FindByNPP(*req.NPP)
		if existingNppUser != nil {
			return nil, errors.New("NPP is already taken by another user")
		}
	}

	// Determine final password to use
	passwordToHash := req.Password
	useDefaultVal, _ := s.settingRepo.Get("use_default_password")
	if useDefaultVal == "true" {
		defaultPassword, err := s.settingRepo.Get("default_password")
		if err == nil && defaultPassword != "" {
			passwordToHash = defaultPassword
		}
	}

	if passwordToHash == "" {
		return nil, errors.New("password is required (default password is disabled)")
	}

	if len(passwordToHash) < 6 {
		return nil, errors.New("password must be at least 6 characters")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(passwordToHash), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create new user entity
	newUser := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		NPP:          req.NPP,
		PasswordHash: string(hashedPassword),
		FullName:     req.FullName,
		Role:         req.Role,
		UnitID:       assignedUnitID,
	}

	err = s.userRepo.Create(newUser)
	if err != nil {
		return nil, err
	}

	// Load relationships if any
	if newUser.UnitID != nil {
		unit, _ := s.unitRepo.FindByID(*newUser.UnitID)
		newUser.Unit = unit
	}

	return newUser, nil
}

func (s *authService) UpdateProfile(userID uuid.UUID, req models.ProfileUpdateRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Check NPP uniqueness if changing
	if req.NPP != nil && *req.NPP != "" {
		existingNppUser, _ := s.userRepo.FindByNPP(*req.NPP)
		if existingNppUser != nil && existingNppUser.ID != userID {
			return errors.New("NPP is already taken by another user")
		}
	}

	user.FullName = req.FullName
	user.NPP = req.NPP
	user.AvatarURL = req.AvatarURL

	// Password change logic
	if req.NewPassword != "" {
		if req.OldPassword == "" {
			return errors.New("old password is required to set a new password")
		}

		// Verify old password
		err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword))
		if err != nil {
			return errors.New("incorrect old password")
		}

		if len(req.NewPassword) < 6 {
			return errors.New("new password must be at least 6 characters")
		}

		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.PasswordHash = string(hashedPassword)
	}

	user.UpdatedAt = time.Now()
	return s.userRepo.Update(user)
}

func (s *authService) GetSystemSettings() (*models.SystemSettingsDTO, error) {
	useDefaultStr, err := s.settingRepo.Get("use_default_password")
	if err != nil {
		useDefaultStr = "false"
	}

	defaultPassword, err := s.settingRepo.Get("default_password")
	if err != nil {
		defaultPassword = "Karyawan123!"
	}

	return &models.SystemSettingsDTO{
		UseDefaultPassword: useDefaultStr == "true",
		DefaultPassword:    defaultPassword,
	}, nil
}

func (s *authService) UpdateSystemSettings(req models.SystemSettingsDTO) error {
	useDefaultVal := "false"
	if req.UseDefaultPassword {
		useDefaultVal = "true"
	}

	err := s.settingRepo.Set("use_default_password", useDefaultVal)
	if err != nil {
		return err
	}

	if req.DefaultPassword != "" {
		if len(req.DefaultPassword) < 6 {
			return errors.New("default password must be at least 6 characters")
		}
		err = s.settingRepo.Set("default_password", req.DefaultPassword)
		if err != nil {
			return err
		}
	}

	return nil
}

func getUUIDString(u *uuid.UUID) string {
	if u == nil {
		return ""
	}
	return u.String()
}

func (s *authService) ListEmployees(currentUserRole models.Role, currentUserUnitID *uuid.UUID, filterUnitID *uuid.UUID) ([]models.User, error) {
	if currentUserRole == models.RoleSuperAdmin {
		if filterUnitID != nil && *filterUnitID != uuid.Nil {
			return s.userRepo.FindEmployeesByUnit(*filterUnitID)
		}
		return s.userRepo.FindAllEmployees()
	}

	if currentUserRole == models.RoleUnitAdmin {
		if currentUserUnitID == nil {
			return nil, errors.New("unit admin must be associated with a unit to list employees")
		}
		return s.userRepo.FindEmployeesByUnit(*currentUserUnitID)
	}

	return nil, errors.New("unauthorized to list employees")
}

func (s *authService) AssignEmployeesToUnit(req models.AssignEmployeesRequest) error {
	// 1. Verify that the Unit exists
	_, err := s.unitRepo.FindByID(req.UnitID)
	if err != nil {
		return errors.New("unit tidak ditemukan")
	}

	// 2. Perform bulk assignment
	return s.userRepo.AssignUsersToUnit(req.UserIDs, req.UnitID)
}
