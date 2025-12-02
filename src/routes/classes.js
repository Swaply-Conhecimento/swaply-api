const express = require("express");
const {
  scheduleClass,
  getScheduledClasses,
  getClassById,
  cancelClass,
  completeClass,
  markAttendance,
  rateClass,
  getUpcomingClasses,
  getClassHistory,
  getClassAccessLink,
  getInstructorAvailability,
  getCourseAvailability,
} = require("../controllers/classController");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  sanitizeInput,
} = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");
const { body, param, query } = require("express-validator");

const router = express.Router();

// Aplicar autenticação para todas as rotas abaixo
router.use(authenticate);

/**
 * POST /classes/schedule
 * Agendar nova aula
 */
router.post(
  "/schedule",
  sanitizeInput,
  [
    body("courseId")
      .notEmpty()
      .withMessage("ID do curso é obrigatório")
      .isMongoId()
      .withMessage("ID do curso inválido"),
    body("date")
      .notEmpty()
      .withMessage("Data é obrigatória")
      .isISO8601()
      .withMessage("Data inválida"),
    body("time")
      .notEmpty()
      .withMessage("Horário é obrigatório")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Horário inválido (formato HH:MM)"),
    body("duration")
      .optional()
      .isFloat({ min: 0.5, max: 4 })
      .withMessage("Duração deve ser entre 0.5 e 4 horas"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notas não podem ter mais de 1000 caracteres"),
  ],
  handleValidationErrors,
  scheduleClass
);

/**
 * GET /classes/scheduled
 * Listar aulas agendadas do usuário
 */
router.get(
  "/scheduled",
  validatePagination,
  [
    query("status")
      .optional()
      .isIn(["scheduled", "in_progress", "completed", "cancelled", "missed"])
      .withMessage("Status inválido"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Data inicial inválida"),
    query("endDate").optional().isISO8601().withMessage("Data final inválida"),
    query("courseId")
      .optional()
      .isMongoId()
      .withMessage("ID do curso inválido"),
  ],
  handleValidationErrors,
  getScheduledClasses
);

/**
 * GET /classes/upcoming
 * Obter próximas aulas
 */
router.get(
  "/upcoming",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limite deve ser entre 1 e 20"),
  ],
  handleValidationErrors,
  getUpcomingClasses
);

/**
 * GET /classes/history
 * Obter histórico de aulas
 */
router.get("/history", validatePagination, getClassHistory);

/**
 * GET /classes/:id
 * Obter detalhes de uma aula específica
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("ID da aula inválido")],
  handleValidationErrors,
  getClassById
);

/**
 * DELETE /classes/:id/cancel
 * Cancelar aula
 */
router.delete(
  "/:id/cancel",
  sanitizeInput,
  [
    param("id").isMongoId().withMessage("ID da aula inválido"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Motivo não pode ter mais de 500 caracteres"),
  ],
  handleValidationErrors,
  cancelClass
);

/**
 * PUT /classes/:id/cancel
 * Cancelar aula (alternativa com PUT)
 */
router.put(
  "/:id/cancel",
  sanitizeInput,
  [
    param("id").isMongoId().withMessage("ID da aula inválido"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Motivo não pode ter mais de 500 caracteres"),
  ],
  handleValidationErrors,
  cancelClass
);

/**
 * PUT /classes/:id/complete
 * Marcar aula como concluída
 */
router.put(
  "/:id/complete",
  [param("id").isMongoId().withMessage("ID da aula inválido")],
  handleValidationErrors,
  completeClass
);

/**
 * POST /classes/:id/attendance
 * Marcar presença
 */
router.post(
  "/:id/attendance",
  [param("id").isMongoId().withMessage("ID da aula inválido")],
  handleValidationErrors,
  markAttendance
);

/**
 * PUT /classes/:id/rating
 * Avaliar aula
 */
router.put(
  "/:id/rating",
  sanitizeInput,
  [
    param("id").isMongoId().withMessage("ID da aula inválido"),
    body("rating")
      .notEmpty()
      .withMessage("Avaliação é obrigatória")
      .isInt({ min: 1, max: 5 })
      .withMessage("Avaliação deve ser entre 1 e 5"),
    body("feedback")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Feedback não pode ter mais de 500 caracteres"),
  ],
  handleValidationErrors,
  rateClass
);

/**
 * GET /classes/:id/access
 * Obter link de acesso à sala virtual
 */
router.get(
  "/:id/access",
  [param("id").isMongoId().withMessage("ID da aula inválido")],
  handleValidationErrors,
  getClassAccessLink
);

/**
 * GET /classes/instructor/:instructorId/availability
 * Obter disponibilidade do instrutor
 */
router.get(
  "/instructor/:instructorId/availability",
  [
    param("instructorId").isMongoId().withMessage("ID do instrutor inválido"),
    query("startDate")
      .notEmpty()
      .withMessage("Data inicial é obrigatória")
      .isISO8601()
      .withMessage("Data inicial inválida"),
    query("endDate")
      .notEmpty()
      .withMessage("Data final é obrigatória")
      .isISO8601()
      .withMessage("Data final inválida"),
  ],
  handleValidationErrors,
  getInstructorAvailability
);

/**
 * GET /classes/course/:courseId/availability
 * Obter disponibilidade do curso
 */
router.get(
  "/course/:courseId/availability",
  [
    param("courseId").isMongoId().withMessage("ID do curso inválido"),
    query("startDate")
      .notEmpty()
      .withMessage("Data inicial é obrigatória")
      .isISO8601()
      .withMessage("Data inicial inválida"),
    query("endDate")
      .notEmpty()
      .withMessage("Data final é obrigatória")
      .isISO8601()
      .withMessage("Data final inválida"),
  ],
  handleValidationErrors,
  getCourseAvailability
);

module.exports = router;
