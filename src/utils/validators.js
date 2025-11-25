const { body, query, param } = require("express-validator");
const {
  COURSE_LEVELS,
  COURSE_CATEGORIES,
  SUPPORTED_LANGUAGES,
  WEEKDAYS,
  THEME_OPTIONS,
  FONT_SIZES,
  CLASS_STATUS,
  PAYMENT_METHODS,
  SYSTEM_LIMITS,
} = require("./constants");

// Validadores para autenticação
const authValidators = {
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Nome é obrigatório")
      .isLength({ min: 2, max: 100 })
      .withMessage("Nome deve ter entre 2 e 100 caracteres")
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage("Nome deve conter apenas letras e espaços"),

    body("email")
      .isEmail()
      .withMessage("E-mail inválido")
      .normalizeEmail()
      .custom(async (email) => {
        const User = require("../models/User");
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error("E-mail já está em uso");
        }
      }),

    body("password")
      .isLength({ min: 6, max: 50 })
      .withMessage("Senha deve ter entre 6 e 50 caracteres"),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirmação de senha não confere");
      }
      return true;
    }),
  ],

  login: [
    body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),

    body("password").notEmpty().withMessage("Senha é obrigatória"),
  ],

  forgotPassword: [
    body("email").isEmail().withMessage("E-mail inválido").normalizeEmail(),
  ],

  resetPassword: [
    body("token").notEmpty().withMessage("Token é obrigatório"),

    body("password")
      .isLength({ min: 6, max: 50 })
      .withMessage("Senha deve ter entre 6 e 50 caracteres"),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirmação de senha não confere");
      }
      return true;
    }),
  ],
};

// Validadores para usuário
const userValidators = {
  updateProfile: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Nome deve ter entre 2 e 100 caracteres")
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage("Nome deve conter apenas letras e espaços"),

    body("bio")
      .optional()
      .trim()
      .isLength({ max: SYSTEM_LIMITS.MAX_USER_BIO_LENGTH })
      .withMessage(
        `Bio não pode ter mais de ${SYSTEM_LIMITS.MAX_USER_BIO_LENGTH} caracteres`
      ),

    body("skills")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_SKILLS_PER_USER })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_SKILLS_PER_USER} habilidades permitidas`
      ),

    body("skills.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Cada habilidade deve ter entre 1 e 50 caracteres"),
  ],

  updateSettings: [
    body("theme")
      .optional()
      .isIn(Object.values(THEME_OPTIONS))
      .withMessage(
        `Tema deve ser um dos valores: ${Object.values(THEME_OPTIONS).join(
          ", "
        )}`
      ),

    body("fontSize")
      .optional()
      .isIn(Object.values(FONT_SIZES))
      .withMessage(
        `Tamanho da fonte deve ser um dos valores: ${Object.values(
          FONT_SIZES
        ).join(", ")}`
      ),

    body("accessibility.fontSizeControl")
      .optional()
      .isBoolean()
      .withMessage("Controle de tamanho da fonte deve ser boolean"),

    body("accessibility.screenReader")
      .optional()
      .isBoolean()
      .withMessage("Leitor de tela deve ser boolean"),

    body("accessibility.audioDescription")
      .optional()
      .isBoolean()
      .withMessage("Audiodescrição deve ser boolean"),

    body("accessibility.vlibras")
      .optional()
      .isBoolean()
      .withMessage("VLibras deve ser boolean"),

    body("notifications.classNotifications")
      .optional()
      .isBoolean()
      .withMessage("Notificações de aula devem ser boolean"),

    body("notifications.interestNotifications")
      .optional()
      .isBoolean()
      .withMessage("Notificações de interesse devem ser boolean"),

    body("notifications.newCoursesNotifications")
      .optional()
      .isBoolean()
      .withMessage("Notificações de novos cursos devem ser boolean"),
  ],
};

// Validadores para curso
const courseValidators = {
  create: [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Título é obrigatório")
      .isLength({ min: 5, max: SYSTEM_LIMITS.MAX_COURSE_TITLE_LENGTH })
      .withMessage(
        `Título deve ter entre 5 e ${SYSTEM_LIMITS.MAX_COURSE_TITLE_LENGTH} caracteres`
      ),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Descrição é obrigatória")
      .isLength({ min: 20, max: SYSTEM_LIMITS.MAX_COURSE_DESCRIPTION_LENGTH })
      .withMessage(
        `Descrição deve ter entre 20 e ${SYSTEM_LIMITS.MAX_COURSE_DESCRIPTION_LENGTH} caracteres`
      ),

    body("category").notEmpty().withMessage("Categoria é obrigatória"),

    body("level")
      .notEmpty()
      .withMessage("Nível é obrigatório")
      .isIn(Object.values(COURSE_LEVELS))
      .withMessage(
        `Nível deve ser um dos valores: ${Object.values(COURSE_LEVELS).join(
          ", "
        )}`
      ),

    body("language")
      .optional()
      .isIn(SUPPORTED_LANGUAGES)
      .withMessage(
        `Idioma deve ser um dos valores: ${SUPPORTED_LANGUAGES.join(", ")}`
      ),

    body("pricePerHour")
      .isInt({
        min: SYSTEM_LIMITS.MIN_COURSE_PRICE,
        max: SYSTEM_LIMITS.MAX_COURSE_PRICE,
      })
      .withMessage(
        `Preço por hora deve ser entre ${SYSTEM_LIMITS.MIN_COURSE_PRICE} e ${SYSTEM_LIMITS.MAX_COURSE_PRICE} créditos`
      ),

    body("totalHours")
      .isInt({
        min: SYSTEM_LIMITS.MIN_COURSE_HOURS,
        max: SYSTEM_LIMITS.MAX_COURSE_HOURS,
      })
      .withMessage(
        `Total de horas deve ser entre ${SYSTEM_LIMITS.MIN_COURSE_HOURS} e ${SYSTEM_LIMITS.MAX_COURSE_HOURS} horas`
      ),

    // Validação de pricing
    body("pricing.singleClass")
      .isInt({ min: 1 })
      .withMessage("Preço da aula avulsa deve ser no mínimo 1 crédito"),

    body("pricing.fullCourse")
      .isInt({ min: 1 })
      .withMessage("Preço do curso completo deve ser no mínimo 1 crédito"),

    body("maxStudents")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Máximo de estudantes deve ser entre 1 e 1000"),

    body("features")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_FEATURES_PER_COURSE })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_FEATURES_PER_COURSE} características permitidas`
      ),

    body("features.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Cada característica deve ter entre 1 e 200 caracteres"),

    body("requirements")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_REQUIREMENTS_PER_COURSE })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_REQUIREMENTS_PER_COURSE} requisitos permitidos`
      ),

    body("requirements.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Cada requisito deve ter entre 1 e 200 caracteres"),

    body("objectives")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_OBJECTIVES_PER_COURSE })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_OBJECTIVES_PER_COURSE} objetivos permitidos`
      ),

    body("objectives.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Cada objetivo deve ter entre 1 e 200 caracteres"),

    body("curriculum")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_CURRICULUM_ITEMS })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_CURRICULUM_ITEMS} itens no currículo`
      ),

    body("curriculum.*.id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID do módulo deve ser um número inteiro positivo"),

    body("curriculum.*.title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Título do módulo é obrigatório")
      .isLength({ min: 1, max: 100 })
      .withMessage("Título do módulo deve ter entre 1 e 100 caracteres"),

    body("curriculum.*.duration")
      .optional()
      .isFloat({ min: 0.5 })
      .withMessage("Duração do módulo deve ser pelo menos 0.5 horas"),

    body("curriculum.*.lessons")
      .optional()
      .isArray()
      .withMessage("Lessons deve ser um array"),

    body("schedule")
      .optional()
      .isArray({ max: SYSTEM_LIMITS.MAX_SCHEDULE_SLOTS })
      .withMessage(
        `Máximo de ${SYSTEM_LIMITS.MAX_SCHEDULE_SLOTS} horários permitidos`
      ),

    body("schedule.*.day")
      .optional()
      .isIn(WEEKDAYS)
      .withMessage(`Dia deve ser um dos valores: ${WEEKDAYS.join(", ")}`),

    body("schedule.*.time")
      .optional()
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
      .withMessage("Horário deve estar no formato HH:MM-HH:MM"),
  ],

  update: [
    // Mesmas validações do create, mas todas opcionais
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: SYSTEM_LIMITS.MAX_COURSE_TITLE_LENGTH })
      .withMessage(
        `Título deve ter entre 5 e ${SYSTEM_LIMITS.MAX_COURSE_TITLE_LENGTH} caracteres`
      ),

    body("description")
      .optional()
      .trim()
      .isLength({ min: 20, max: SYSTEM_LIMITS.MAX_COURSE_DESCRIPTION_LENGTH })
      .withMessage(
        `Descrição deve ter entre 20 e ${SYSTEM_LIMITS.MAX_COURSE_DESCRIPTION_LENGTH} caracteres`
      ),

    body("category").optional(),

    body("level")
      .optional()
      .isIn(Object.values(COURSE_LEVELS))
      .withMessage(
        `Nível deve ser um dos valores: ${Object.values(COURSE_LEVELS).join(
          ", "
        )}`
      ),

    body("pricePerHour")
      .optional()
      .isInt({
        min: SYSTEM_LIMITS.MIN_COURSE_PRICE,
        max: SYSTEM_LIMITS.MAX_COURSE_PRICE,
      })
      .withMessage(
        `Preço por hora deve ser entre ${SYSTEM_LIMITS.MIN_COURSE_PRICE} e ${SYSTEM_LIMITS.MAX_COURSE_PRICE} créditos`
      ),

    body("totalHours")
      .optional()
      .isInt({
        min: SYSTEM_LIMITS.MIN_COURSE_HOURS,
        max: SYSTEM_LIMITS.MAX_COURSE_HOURS,
      })
      .withMessage(
        `Total de horas deve ser entre ${SYSTEM_LIMITS.MIN_COURSE_HOURS} e ${SYSTEM_LIMITS.MAX_COURSE_HOURS} horas`
      ),
  ],

  search: [
    query("q")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Termo de busca deve ter entre 1 e 100 caracteres"),

    query("category").optional(),

    query("level")
      .optional()
      .isIn(Object.values(COURSE_LEVELS))
      .withMessage("Nível inválido"),

    query("minPrice")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Preço mínimo deve ser um número positivo"),

    query("maxPrice")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Preço máximo deve ser um número positivo"),

    query("sortBy")
      .optional()
      .isIn(["createdAt", "rating", "price", "title", "students"])
      .withMessage("Campo de ordenação inválido"),

    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Ordem de classificação deve ser asc ou desc"),
  ],
};

// Validadores para aula
const classValidators = {
  schedule: [
    body("courseId")
      .notEmpty()
      .withMessage("ID do curso é obrigatório")
      .isMongoId()
      .withMessage("ID do curso inválido"),

    body("date")
      .notEmpty()
      .withMessage("Data é obrigatória")
      .isISO8601()
      .withMessage("Data deve estar no formato ISO 8601")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
          throw new Error("Data deve ser no futuro");
        }
        return true;
      }),

    body("time")
      .notEmpty()
      .withMessage("Horário é obrigatório")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Horário deve estar no formato HH:MM"),

    body("duration")
      .optional()
      .isFloat({
        min: SYSTEM_LIMITS.MIN_CLASS_DURATION,
        max: SYSTEM_LIMITS.MAX_CLASS_DURATION,
      })
      .withMessage(
        `Duração deve ser entre ${SYSTEM_LIMITS.MIN_CLASS_DURATION} e ${SYSTEM_LIMITS.MAX_CLASS_DURATION} horas`
      ),

    body("title")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Título não pode ter mais de 200 caracteres"),
  ],

  update: [
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Data deve estar no formato ISO 8601")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
          throw new Error("Data deve ser no futuro");
        }
        return true;
      }),

    body("time")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Horário deve estar no formato HH:MM"),

    body("duration")
      .optional()
      .isFloat({
        min: SYSTEM_LIMITS.MIN_CLASS_DURATION,
        max: SYSTEM_LIMITS.MAX_CLASS_DURATION,
      })
      .withMessage(
        `Duração deve ser entre ${SYSTEM_LIMITS.MIN_CLASS_DURATION} e ${SYSTEM_LIMITS.MAX_CLASS_DURATION} horas`
      ),

    body("status")
      .optional()
      .isIn(Object.values(CLASS_STATUS))
      .withMessage("Status de aula inválido"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: SYSTEM_LIMITS.MAX_CLASS_NOTES_LENGTH })
      .withMessage(
        `Notas não podem ter mais de ${SYSTEM_LIMITS.MAX_CLASS_NOTES_LENGTH} caracteres`
      ),
  ],
};

// Validadores para avaliação
const reviewValidators = {
  create: [
    body("courseId")
      .notEmpty()
      .withMessage("ID do curso é obrigatório")
      .isMongoId()
      .withMessage("ID do curso inválido"),

    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Avaliação deve ser entre 1 e 5"),

    body("comment")
      .optional()
      .trim()
      .isLength({ max: SYSTEM_LIMITS.MAX_REVIEW_COMMENT_LENGTH })
      .withMessage(
        `Comentário não pode ter mais de ${SYSTEM_LIMITS.MAX_REVIEW_COMMENT_LENGTH} caracteres`
      ),

    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("Campo anônimo deve ser boolean"),
  ],

  update: [
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Avaliação deve ser entre 1 e 5"),

    body("comment")
      .optional()
      .trim()
      .isLength({ max: SYSTEM_LIMITS.MAX_REVIEW_COMMENT_LENGTH })
      .withMessage(
        `Comentário não pode ter mais de ${SYSTEM_LIMITS.MAX_REVIEW_COMMENT_LENGTH} caracteres`
      ),

    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("Campo anônimo deve ser boolean"),
  ],
};

// Validadores para pagamento
const paymentValidators = {
  purchaseCredits: [
    body("credits")
      .isInt({
        min: SYSTEM_LIMITS.MIN_CREDITS_PURCHASE,
        max: SYSTEM_LIMITS.MAX_CREDITS_PURCHASE,
      })
      .withMessage(
        `Quantidade de créditos deve ser entre ${SYSTEM_LIMITS.MIN_CREDITS_PURCHASE} e ${SYSTEM_LIMITS.MAX_CREDITS_PURCHASE}`
      ),

    body("paymentMethod")
      .notEmpty()
      .withMessage("Método de pagamento é obrigatório")
      .isIn(Object.values(PAYMENT_METHODS))
      .withMessage("Método de pagamento inválido"),
  ],
};

// Validadores para parâmetros de rota
const paramValidators = {
  id: param("id").isMongoId().withMessage("ID inválido"),
  courseId: param("courseId").isMongoId().withMessage("ID do curso inválido"),
  classId: param("classId").isMongoId().withMessage("ID da aula inválido"),
  userId: param("userId").isMongoId().withMessage("ID do usuário inválido"),
  reviewId: param("reviewId")
    .isMongoId()
    .withMessage("ID da avaliação inválido"),
  notificationId: param("notificationId")
    .isMongoId()
    .withMessage("ID da notificação inválido"),
};

// Validadores para query de paginação
const paginationValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Página deve ser um número positivo"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: SYSTEM_LIMITS.MAX_PAGE_SIZE })
    .withMessage(`Limite deve ser entre 1 e ${SYSTEM_LIMITS.MAX_PAGE_SIZE}`),
];

module.exports = {
  authValidators,
  userValidators,
  courseValidators,
  classValidators,
  reviewValidators,
  paymentValidators,
  paramValidators,
  paginationValidators,
};
