package repository

import (
	"backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	FindByEmail(email string) (*models.User, error)
	FindByEmailOrUsername(identifier string) (*models.User, error)
	FindByNPP(npp string) (*models.User, error)
	FindByID(id uuid.UUID) (*models.User, error)
	FindAllEmployees() ([]models.User, error)
	FindEmployeesByUnit(unitID uuid.UUID) ([]models.User, error)
	Create(user *models.User) error
	Update(user *models.User) error
	AssignUsersToUnit(userIDs []uuid.UUID, unitID uuid.UUID) error
	FindAllAdmins() ([]models.User, error)
	Delete(id uuid.UUID) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Unit").Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmailOrUsername(identifier string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Unit").Where("email = ? OR username = ?", identifier, identifier).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByNPP(npp string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Unit").Where("npp = ?", npp).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Unit").Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) FindAllEmployees() ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("Unit").Where("role IN ?", []models.Role{models.RoleEmployee, models.RoleMarketLiquidityRisk}).Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) FindEmployeesByUnit(unitID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("Unit").Where("role IN ? AND unit_id = ?", []models.Role{models.RoleEmployee, models.RoleMarketLiquidityRisk}, unitID).Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) AssignUsersToUnit(userIDs []uuid.UUID, unitID uuid.UUID) error {
	tx := r.db.Begin()
	allowedRoles := []models.Role{models.RoleEmployee, models.RoleMarketLiquidityRisk}
	if err := tx.Model(&models.User{}).Where("unit_id = ? AND role IN ?", unitID, allowedRoles).Update("unit_id", nil).Error; err != nil {
		tx.Rollback()
		return err
	}
	if len(userIDs) > 0 {
		if err := tx.Model(&models.User{}).Where("id IN ? AND role IN ?", userIDs, allowedRoles).Update("unit_id", unitID).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit().Error
}

func (r *userRepository) FindAllAdmins() ([]models.User, error) {
	var users []models.User
	err := r.db.Where("role = ? OR role = ?", models.RoleSuperAdmin, models.RoleUnitAdmin).Find(&users).Error
	return users, err
}

func (r *userRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}
