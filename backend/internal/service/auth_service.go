package service

import (
	"backend/internal/models"
	"backend/internal/repository"
	"bytes"
	"encoding/base64"
	"errors"
	"time"

	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/steambap/captcha"
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

	img, err := captcha.New(200, 64, func(opts *captcha.Options) {
		opts.CharPreset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
		opts.TextLength = 5
	})
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	err = img.WriteImage(&buf)
	if err != nil {
		return nil, err
	}
	base64Str := base64.StdEncoding.EncodeToString(buf.Bytes())
	base64DataURI := "data:image/png;base64," + base64Str

	capObj := &models.Captcha{
		Code:      img.Text,
		ExpiredAt: time.Now().Add(time.Minute * 2),
	}

	err = s.captchaRepo.Create(capObj)
	if err != nil {
		return nil, err
	}

	return &models.CaptchaResponse{
		CaptchaID:    capObj.ID,
		CaptchaCode:  capObj.Code,
		CaptchaImage: base64DataURI,
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

	if !strings.EqualFold(captcha.Code, req.CaptchaAnswer) {
		return nil, errors.New("incorrect captcha answer")
	}

	// 2. Find user by NPP
	user, err := s.userRepo.FindByNPP(req.NPP)
	if err != nil {
		return nil, errors.New("invalid NPP or password")
	}

	// Compare password hash
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid NPP or password")
	}

	// Generate JWT Token
	emailVal := ""
	if user.Email != nil {
		emailVal = *user.Email
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       user.ID.String(),
		"email":     emailVal,
		"npp":       user.NPP,
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
		if req.Role != models.RoleEmployee && req.Role != models.RoleMarketLiquidityRisk && req.Role != models.RoleCyber {
			return nil, errors.New("unit_admin can only register employee, market_liquidity_risk, or cyber roles")
		}
		if creatorUnitID == nil {
			return nil, errors.New("unit_admin must be associated with a unit to register employees")
		}
		assignedUnitID = creatorUnitID

	default:
		return nil, errors.New("unauthorized to register users")
	}

	// Check if email already exists
	if req.Email != nil && *req.Email != "" {
		existingUser, _ := s.userRepo.FindByEmail(*req.Email)
		if existingUser != nil {
			return nil, errors.New("email is already registered")
		}
	}

	// Auto-generate username from NPP (first 4 characters)
	usernameVal := req.NPP
	if len(req.NPP) >= 4 {
		usernameVal = req.NPP[:4]
	}
	req.Username = &usernameVal

	// Check if NPP already exists
	if req.NPP != "" {
		existingNppUser, _ := s.userRepo.FindByNPP(req.NPP)
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
	if req.NPP == nil || *req.NPP == "" {
		return errors.New("NPP is required")
	}

	existingNppUser, _ := s.userRepo.FindByNPP(*req.NPP)
	if existingNppUser != nil && existingNppUser.ID != userID {
		return errors.New("NPP is already taken by another user")
	}

	user.FullName = req.FullName
	user.NPP = *req.NPP
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
