// Status de usuário
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// Tipos de usuário
const USER_TYPES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

// Status de curso
const COURSE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
};

// Níveis de curso
const COURSE_LEVELS = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado'
};

// Status de aula
const CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

// Tipos de pagamento
const PAYMENT_TYPES = {
  CREDIT_PURCHASE: 'credit_purchase',
  CREDIT_EARNED: 'credit_earned',
  CREDIT_SPENT: 'credit_spent',
  REFUND: 'refund'
};

// Status de pagamento
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Métodos de pagamento
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PIX: 'pix',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  INTERNAL: 'internal'
};

// Tipos de notificação
const NOTIFICATION_TYPES = {
  CLASS_REMINDER: 'class_reminder',
  CLASS_CANCELLED: 'class_cancelled',
  CLASS_CONFIRMED: 'class_confirmed',
  CLASS_COMPLETED: 'class_completed',
  NEW_COURSE: 'new_course',
  COURSE_UPDATED: 'course_updated',
  CREDIT_EARNED: 'credit_earned',
  CREDIT_SPENT: 'credit_spent',
  CREDIT_PURCHASED: 'credit_purchased',
  REVIEW_RECEIVED: 'review_received',
  ENROLLMENT_NEW: 'enrollment_new',
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance',
  PROMOTION: 'promotion'
};

// Prioridades de notificação
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Categorias de notificação
const NOTIFICATION_CATEGORIES = {
  ACADEMIC: 'academic',
  FINANCIAL: 'financial',
  SYSTEM: 'system',
  SOCIAL: 'social',
  PROMOTIONAL: 'promotional'
};

// Status de avaliação
const REVIEW_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted'
};

// Motivos de denúncia
const REPORT_REASONS = {
  INAPPROPRIATE: 'inappropriate',
  SPAM: 'spam',
  FAKE: 'fake',
  OFFENSIVE: 'offensive',
  OTHER: 'other'
};

// Categorias de curso
const COURSE_CATEGORIES = [
  'Tecnologia',
  'Design',
  'Marketing',
  'Negócios',
  'Empreendedorismo',
  'Idiomas',
  'Música',
  'Arte',
  'Fotografia',
  'Culinária',
  'Fitness',
  'Saúde',
  'Bem-estar',
  'Desenvolvimento Pessoal',
  'Educação',
  'Ciências',
  'Matemática',
  'História',
  'Literatura',
  'Filosofia',
  'Psicologia',
  'Direito',
  'Medicina',
  'Engenharia',
  'Arquitetura',
  'Agricultura',
  'Veterinária',
  'Meio Ambiente',
  'Sustentabilidade',
  'Outros'
];

// Subcategorias por categoria principal
const COURSE_SUBCATEGORIES = {
  'Tecnologia': [
    'Programação',
    'Desenvolvimento Web',
    'Desenvolvimento Mobile',
    'Data Science',
    'Inteligência Artificial',
    'Machine Learning',
    'Cybersecurity',
    'DevOps',
    'Cloud Computing',
    'Blockchain',
    'IoT',
    'Robótica'
  ],
  'Design': [
    'Design Gráfico',
    'UI/UX Design',
    'Web Design',
    'Design de Produto',
    'Ilustração',
    'Animação',
    'Motion Graphics',
    'Branding',
    'Design de Interiores'
  ],
  'Marketing': [
    'Marketing Digital',
    'SEO',
    'SEM',
    'Redes Sociais',
    'Content Marketing',
    'Email Marketing',
    'Copywriting',
    'Analytics',
    'Growth Hacking'
  ],
  'Negócios': [
    'Administração',
    'Finanças',
    'Contabilidade',
    'Recursos Humanos',
    'Vendas',
    'Liderança',
    'Gestão de Projetos',
    'Estratégia',
    'Consultoria'
  ]
};

// Idiomas suportados
const SUPPORTED_LANGUAGES = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Italiano',
  'Japonês',
  'Chinês',
  'Coreano',
  'Árabe',
  'Russo',
  'Hindi'
];

// Dias da semana
const WEEKDAYS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
];

// Fusos horários do Brasil
const BRAZIL_TIMEZONES = [
  { code: 'America/Sao_Paulo', name: 'Brasília (UTC-3)', offset: -3 },
  { code: 'America/Manaus', name: 'Manaus (UTC-4)', offset: -4 },
  { code: 'America/Rio_Branco', name: 'Rio Branco (UTC-5)', offset: -5 },
  { code: 'America/Noronha', name: 'Fernando de Noronha (UTC-2)', offset: -2 }
];

// Configurações de tema
const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Tamanhos de fonte
const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Configurações de acessibilidade
const ACCESSIBILITY_FEATURES = {
  FONT_SIZE_CONTROL: 'fontSizeControl',
  SCREEN_READER: 'screenReader',
  AUDIO_DESCRIPTION: 'audioDescription',
  VLIBRAS: 'vlibras'
};

// Limites do sistema
const SYSTEM_LIMITS = {
  MAX_COURSE_TITLE_LENGTH: 200,
  MAX_COURSE_DESCRIPTION_LENGTH: 2000,
  MAX_USER_BIO_LENGTH: 500,
  MAX_REVIEW_COMMENT_LENGTH: 1000,
  MAX_CLASS_NOTES_LENGTH: 1000,
  MAX_NOTIFICATION_TITLE_LENGTH: 100,
  MAX_NOTIFICATION_MESSAGE_LENGTH: 500,
  
  MAX_SKILLS_PER_USER: 20,
  MAX_FEATURES_PER_COURSE: 10,
  MAX_REQUIREMENTS_PER_COURSE: 10,
  MAX_OBJECTIVES_PER_COURSE: 10,
  MAX_CURRICULUM_ITEMS: 50,
  MAX_SCHEDULE_SLOTS: 14,
  
  MIN_COURSE_PRICE: 1,
  MAX_COURSE_PRICE: 100,
  MIN_COURSE_HOURS: 1,
  MAX_COURSE_HOURS: 100,
  MIN_CLASS_DURATION: 0.5,
  MAX_CLASS_DURATION: 4,
  
  DEFAULT_CREDITS: 10,
  MAX_CREDITS_PURCHASE: 1000,
  MIN_CREDITS_PURCHASE: 1,
  
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  FILE_SIZE_LIMITS: {
    AVATAR: 2 * 1024 * 1024, // 2MB
    COURSE_IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 10 * 1024 * 1024 // 10MB
  }
};

// Códigos de erro personalizados
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

// Mensagens de sucesso padrão
const SUCCESS_MESSAGES = {
  USER_CREATED: 'Usuário criado com sucesso',
  USER_UPDATED: 'Usuário atualizado com sucesso',
  USER_DELETED: 'Usuário deletado com sucesso',
  
  COURSE_CREATED: 'Curso criado com sucesso',
  COURSE_UPDATED: 'Curso atualizado com sucesso',
  COURSE_DELETED: 'Curso deletado com sucesso',
  COURSE_ENROLLED: 'Matrícula realizada com sucesso',
  COURSE_UNENROLLED: 'Matrícula cancelada com sucesso',
  
  CLASS_SCHEDULED: 'Aula agendada com sucesso',
  CLASS_UPDATED: 'Aula atualizada com sucesso',
  CLASS_CANCELLED: 'Aula cancelada com sucesso',
  CLASS_CONFIRMED: 'Aula confirmada com sucesso',
  CLASS_COMPLETED: 'Aula completada com sucesso',
  
  PAYMENT_PROCESSED: 'Pagamento processado com sucesso',
  CREDITS_PURCHASED: 'Créditos comprados com sucesso',
  
  REVIEW_CREATED: 'Avaliação criada com sucesso',
  REVIEW_UPDATED: 'Avaliação atualizada com sucesso',
  REVIEW_DELETED: 'Avaliação deletada com sucesso',
  
  NOTIFICATION_READ: 'Notificação marcada como lida',
  NOTIFICATIONS_READ_ALL: 'Todas as notificações marcadas como lidas',
  
  FILE_UPLOADED: 'Arquivo enviado com sucesso',
  FILE_DELETED: 'Arquivo deletado com sucesso',
  
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  PASSWORD_RESET: 'Senha resetada com sucesso',
  EMAIL_SENT: 'E-mail enviado com sucesso'
};

// URLs de API externas
const EXTERNAL_APIS = {
  ZOOM_BASE_URL: 'https://api.zoom.us/v2',
  STRIPE_BASE_URL: 'https://api.stripe.com/v1',
  GOOGLE_OAUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  CLOUDINARY_BASE_URL: 'https://api.cloudinary.com/v1_1'
};

// Configurações de rate limiting
const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 tentativas por 15 minutos
  REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 registros por hora
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 resets por hora
  API_GENERAL: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests por 15 minutos
  FILE_UPLOAD: { windowMs: 60 * 60 * 1000, max: 20 } // 20 uploads por hora
};

module.exports = {
  USER_STATUS,
  USER_TYPES,
  COURSE_STATUS,
  COURSE_LEVELS,
  CLASS_STATUS,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES,
  REVIEW_STATUS,
  REPORT_REASONS,
  COURSE_CATEGORIES,
  COURSE_SUBCATEGORIES,
  SUPPORTED_LANGUAGES,
  WEEKDAYS,
  BRAZIL_TIMEZONES,
  THEME_OPTIONS,
  FONT_SIZES,
  ACCESSIBILITY_FEATURES,
  SYSTEM_LIMITS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  EXTERNAL_APIS,
  RATE_LIMITS
};
