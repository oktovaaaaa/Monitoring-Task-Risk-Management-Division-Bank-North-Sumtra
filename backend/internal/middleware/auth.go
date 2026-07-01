package middleware

import (
	"backend/internal/config"
	"backend/internal/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.CommonResponse{
				Status:  "error",
				Message: "Authorization header is required",
			})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.CommonResponse{
				Status:  "error",
				Message: "Authorization header format must be Bearer <token>",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return config.AppConfig.JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.CommonResponse{
				Status:  "error",
				Message: "Invalid or expired token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, models.CommonResponse{
				Status:  "error",
				Message: "Invalid token claims",
			})
			c.Abort()
			return
		}

		// Inject properties to Gin context
		c.Set("userId", claims["sub"].(string))
		c.Set("email", claims["email"].(string))
		c.Set("role", models.Role(claims["role"].(string)))

		if unitIDStr, exists := claims["unit_id"]; exists && unitIDStr != "" {
			uID, err := uuid.Parse(unitIDStr.(string))
			if err == nil {
				c.Set("unitId", &uID)
			} else {
				c.Set("unitId", (*uuid.UUID)(nil))
			}
		} else {
			c.Set("unitId", (*uuid.UUID)(nil))
		}

		c.Next()
	}
}

func RequireRole(allowedRoles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, models.CommonResponse{
				Status:  "error",
				Message: "Access denied. Role not identified.",
			})
			c.Abort()
			return
		}

		userRole := roleVal.(models.Role)
		isAllowed := false
		for _, r := range allowedRoles {
			if userRole == r {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, models.CommonResponse{
				Status:  "error",
				Message: "Access denied. Insufficient permissions.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
