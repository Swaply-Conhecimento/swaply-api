const express = require("express");
const passport = require("passport");
const { body } = require("express-validator");
const {
  register,
  login,
  googleCallback,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyToken,
  logout,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

// Validações
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),

  body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirmação de senha é obrigatória"),
];

const loginValidation = [
  body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),

  body("password").notEmpty().withMessage("Senha é obrigatória"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token é obrigatório"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirmação de senha é obrigatória"),
];

// Rotas públicas
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/refresh-token", refreshToken);

// Google OAuth - apenas se configurado
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    }),
    googleCallback
  );
} else {
  // Rotas alternativas se Google OAuth não estiver configurado
  router.get("/google", (req, res) => {
    res.status(501).json({
      success: false,
      message: "Login com Google não configurado",
    });
  });

  router.get("/google/callback", (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_not_configured`
    );
  });
}

// Rotas protegidas
router.get("/verify-token", authenticate, verifyToken);
router.post("/logout", authenticate, logout);

module.exports = router;
