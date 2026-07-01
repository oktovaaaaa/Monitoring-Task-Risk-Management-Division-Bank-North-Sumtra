package db

import (
	"backend/internal/models"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) {
	log.Println("Running AutoMigrations...")
	err := db.AutoMigrate(&models.Unit{}, &models.User{}, &models.Captcha{}, &models.Setting{}, &models.Task{}, &models.Notification{})
	if err != nil {
		log.Fatalf("AutoMigration failed: %v", err)
	}
	log.Println("AutoMigrations completed successfully")

	// Seed default settings
	var settingCount int64
	db.Model(&models.Setting{}).Count(&settingCount)
	if settingCount == 0 {
		settings := []models.Setting{
			{Key: "use_default_password", Value: "false"},
			{Key: "default_password", Value: "Karyawan123!"},
		}
		for _, s := range settings {
			db.Create(&s)
		}
		log.Println("Default system settings seeded successfully")
	}

	// Seed default Unit
	var unitCount int64
	db.Model(&models.Unit{}).Count(&unitCount)
	var defaultUnit models.Unit
	if unitCount == 0 {
		defaultUnit = models.Unit{
			Name:        "IT Division",
			Description: "Information Technology Division",
		}
		if err := db.Create(&defaultUnit).Error; err != nil {
			log.Printf("Failed to seed default unit: %v", err)
		} else {
			log.Println("Default unit 'IT Division' seeded successfully")
		}
	} else {
		db.First(&defaultUnit)
	}

	// Seed default Super Admin
	var adminCount int64
	db.Model(&models.User{}).Where("role = ?", models.RoleSuperAdmin).Count(&adminCount)
	if adminCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash default admin password: %v", err)
		}

		admin := models.User{
			Email:        "superadmin@admin.com",
			PasswordHash: string(hashedPassword),
			FullName:     "Super Admin",
			Role:         models.RoleSuperAdmin,
			UnitID:       nil,
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed default admin: %v", err)
		} else {
			log.Println("Default Super Admin seeded successfully (Email: superadmin@admin.com, Password: Password123)")
		}
	}
}
