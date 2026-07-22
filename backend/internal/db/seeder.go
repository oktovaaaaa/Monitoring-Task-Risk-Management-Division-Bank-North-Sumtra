package db

import (
	"backend/internal/models"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) {
	// Update existing users with NULL NPP to prevent migration failure
	if db.Migrator().HasTable(&models.User{}) {
		_ = db.Migrator().AlterColumn(&models.User{}, "Role")
		db.Exec("UPDATE users SET npp = 'NPP-' || substring(id::text, 1, 8) WHERE npp IS NULL OR npp = ''")
		db.Exec("UPDATE users SET role = 'market_liquidity_risk' WHERE role = 'imam'")
	}

	log.Println("Running AutoMigrations...")
	err := db.AutoMigrate(&models.Unit{}, &models.User{}, &models.Captcha{}, &models.Setting{}, &models.Task{}, &models.Notification{}, &models.SubTask{}, &models.SubTaskSubmission{}, &models.ImamSubmission{}, &models.MacroDataPoint{}, &models.CyberSubmission{})
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

	// Seed/Update default Super Admin
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Osvald8080"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash default admin password: %v", err)
	}

	var superAdmin models.User
	err = db.Where("role = ?", models.RoleSuperAdmin).First(&superAdmin).Error
	if err != nil {
		// Not found, create it
		usernameVal := "supe"
		superAdmin = models.User{
			NPP:          "superadmin",
			Username:     &usernameVal,
			PasswordHash: string(hashedPassword),
			FullName:     "Super Admin",
			Role:         models.RoleSuperAdmin,
			UnitID:       nil,
		}
		if err := db.Create(&superAdmin).Error; err != nil {
			log.Printf("Failed to seed default admin: %v", err)
		} else {
			log.Println("Default Super Admin seeded successfully (NPP: superadmin, Password: Osvald8080)")
		}
	} else {
		// Found, update its NPP and password to match new requirement
		superAdmin.NPP = "superadmin"
		usernameVal := "supe"
		superAdmin.Username = &usernameVal
		superAdmin.PasswordHash = string(hashedPassword)
		if err := db.Save(&superAdmin).Error; err != nil {
			log.Printf("Failed to update super admin: %v", err)
		} else {
			log.Println("Super Admin credentials updated successfully (NPP: superadmin, Password: Osvald8080)")
		}
	}
}
