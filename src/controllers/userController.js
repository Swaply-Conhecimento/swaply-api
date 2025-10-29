const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const { uploadAvatar, deleteFile } = require('../middleware/upload');
const { uploadAvatar: uploadAvatarToCloud, deleteImage } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { paymentService } = require('../services/paymentService');
const { sendAccountDeletedEmail } = require('../services/emailService');
const schedulingService = require('../services/schedulingService');
const { asyncHandler } = require('../middleware/errorHandler');

// Obter perfil do usuário
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user.getPublicProfile();
  
  res.json(createApiResponse(
    true,
    'Perfil obtido com sucesso',
    user
  ));
});

// Atualizar perfil do usuário
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiResponse(
      false,
      'Dados inválidos',
      null,
      null,
      errors.array()
    ));
  }

  const { name, bio, skills } = req.body;
  const user = req.user;

  // Atualizar campos permitidos
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (skills && Array.isArray(skills)) user.skills = skills;

  await user.save();

  res.json(createApiResponse(
    true,
    'Perfil atualizado com sucesso',
    user.getPublicProfile()
  ));
});

// Upload de avatar
const uploadUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(createApiResponse(
      false,
      'Nenhum arquivo foi enviado'
    ));
  }

  const user = req.user;

  try {
    // Upload para Cloudinary
    const result = await uploadAvatarToCloud(req.file.path);

    // Deletar avatar anterior se existir
    if (user.avatar) {
      try {
        // Extrair public_id do URL do Cloudinary
        const publicId = user.avatar.split('/').pop().split('.')[0];
        await deleteImage(`swaply/avatars/${publicId}`);
      } catch (deleteError) {
        console.error('Erro ao deletar avatar anterior:', deleteError);
      }
    }

    // Atualizar usuário
    user.avatar = result.url;
    await user.save();

    // Limpar arquivo temporário
    await deleteFile(req.file.path);

    res.json(createApiResponse(
      true,
      'Avatar atualizado com sucesso',
      { avatar: user.avatar }
    ));

  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    await deleteFile(req.file.path);
    throw error;
  }
});

// Remover avatar
const removeAvatar = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.avatar) {
    return res.status(400).json(createApiResponse(
      false,
      'Usuário não possui avatar'
    ));
  }

  try {
    // Deletar do Cloudinary
    const publicId = user.avatar.split('/').pop().split('.')[0];
    await deleteImage(`swaply/avatars/${publicId}`);
  } catch (error) {
    console.error('Erro ao deletar avatar do Cloudinary:', error);
  }

  // Remover do usuário
  user.avatar = null;
  await user.save();

  res.json(createApiResponse(
    true,
    'Avatar removido com sucesso'
  ));
});

// Obter configurações do usuário
const getSettings = asyncHandler(async (req, res) => {
  const user = req.user;
  
  res.json(createApiResponse(
    true,
    'Configurações obtidas com sucesso',
    user.settings
  ));
});

// Atualizar configurações do usuário
const updateSettings = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiResponse(
      false,
      'Dados inválidos',
      null,
      null,
      errors.array()
    ));
  }

  const user = req.user;
  const { theme, fontSize, accessibility, notifications } = req.body;

  // Atualizar configurações
  if (theme) user.settings.theme = theme;
  if (fontSize) user.settings.fontSize = fontSize;
  
  if (accessibility) {
    user.settings.accessibility = {
      ...user.settings.accessibility,
      ...accessibility
    };
  }
  
  if (notifications) {
    user.settings.notifications = {
      ...user.settings.notifications,
      ...notifications
    };
  }

  await user.save();

  res.json(createApiResponse(
    true,
    'Configurações atualizadas com sucesso',
    user.settings
  ));
});

// Obter histórico de créditos
const getCreditsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, startDate, endDate } = req.query;
  
  const history = await paymentService.getPaymentHistory(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    type,
    startDate,
    endDate
  });

  res.json(createApiResponse(
    true,
    'Histórico de créditos obtido com sucesso',
    history.data.payments,
    history.data.pagination
  ));
});

// Comprar créditos (sistema interno - sem pagamento real)
const purchaseCredits = asyncHandler(async (req, res) => {
  // Para sistema de moedas virtuais, você pode:
  // 1. Dar créditos por atividades
  // 2. Dar créditos por conquistas
  // 3. Dar créditos por tempo no app
  
  return res.status(400).json(createApiResponse(
    false,
    'Créditos são ganhos apenas através de atividades no app (ensinar, completar cursos, etc.)'
  ));
});

// Obter estatísticas do usuário
const getStats = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Obter cursos matriculados
  const enrolledCourses = await Course.find({
    enrolledStudents: user._id,
    status: 'active'
  }).countDocuments();

  // Obter cursos ensinando
  const teachingCourses = await Course.find({
    instructor: user._id,
    status: 'active'
  }).countDocuments();

  // Obter resumo financeiro
  const financialSummary = await paymentService.getFinancialSummary(user._id);

  const stats = {
    ...user.stats.toObject(),
    enrolledCourses,
    teachingCourses,
    currentCredits: user.credits,
    financialSummary: financialSummary.data
  };

  res.json(createApiResponse(
    true,
    'Estatísticas obtidas com sucesso',
    stats
  ));
});

// Obter cursos favoritos
const getFavorites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const user = await User.findById(req.user._id)
    .populate({
      path: 'favorites',
      populate: {
        path: 'instructor',
        select: 'name avatar'
      },
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit)
      }
    });

  const total = user.favorites.length;

  res.json(createApiResponse(
    true,
    'Favoritos obtidos com sucesso',
    user.favorites,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Adicionar curso aos favoritos
const addToFavorites = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user;

  // Verificar se curso existe
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  // Verificar se já está nos favoritos
  if (user.favorites.includes(courseId)) {
    return res.status(400).json(createApiResponse(
      false,
      'Curso já está nos favoritos'
    ));
  }

  user.favorites.push(courseId);
  await user.save();

  res.json(createApiResponse(
    true,
    'Curso adicionado aos favoritos com sucesso'
  ));
});

// Remover curso dos favoritos
const removeFromFavorites = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user;

  const index = user.favorites.indexOf(courseId);
  if (index === -1) {
    return res.status(400).json(createApiResponse(
      false,
      'Curso não está nos favoritos'
    ));
  }

  user.favorites.splice(index, 1);
  await user.save();

  res.json(createApiResponse(
    true,
    'Curso removido dos favoritos com sucesso'
  ));
});

// Obter cursos matriculados
const getEnrolledCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { 
    enrolledStudents: req.user._id 
  };
  
  if (status) {
    query.status = status;
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate('instructor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json(createApiResponse(
    true,
    'Cursos matriculados obtidos com sucesso',
    courses,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Obter cursos sendo ensinados
const getTeachingCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { 
    instructor: req.user._id 
  };
  
  if (status) {
    query.status = status;
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json(createApiResponse(
    true,
    'Cursos sendo ensinados obtidos com sucesso',
    courses,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Tornar-se instrutor
// DEPRECIADO: Todos os usuários já são instrutores por padrão
// Mantido apenas para compatibilidade com frontend antigo
const becomeInstructor = asyncHandler(async (req, res) => {
  const user = req.user;

  // Como todos já são instrutores, apenas retornar sucesso
  if (!user.isInstructor) {
    user.isInstructor = true;
    await user.save();
  }

  res.json(createApiResponse(
    true,
    'Você já pode criar cursos! No Swaply, todos podem ensinar e aprender.',
    { 
      isInstructor: true,
      message: 'Ensine o que sabe, aprenda o que quer!'
    }
  ));
});

// Excluir conta
const deleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;

  // Verificar se usuário tem cursos ativos como instrutor
  const activeCourses = await Course.countDocuments({
    instructor: user._id,
    status: 'active'
  });

  if (activeCourses > 0) {
    return res.status(400).json(createApiResponse(
      false,
      'Não é possível excluir conta com cursos ativos. Finalize ou cancele seus cursos primeiro.'
    ));
  }

  // Enviar email de confirmação de exclusão antes de desativar
  try {
    await sendAccountDeletedEmail(user);
    console.log(`Email de conta deletada enviado para: ${user.email}`);
  } catch (emailError) {
    console.error('Erro ao enviar email de conta deletada:', emailError.message);
    // Continua com a exclusão mesmo se o email falhar
  }

  // Desativar conta em vez de deletar (soft delete)
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save();

  res.json(createApiResponse(
    true,
    'Conta desativada com sucesso'
  ));
});

// Obter saldo de créditos
const getCreditsBalance = asyncHandler(async (req, res) => {
  const user = req.user;
  
  res.json(createApiResponse(
    true,
    'Saldo de créditos obtido com sucesso',
    {
      credits: user.credits,
      creditPrice: paymentService.getCreditPrice()
    }
  ));
});

/**
 * GET /users/calendar
 * Obter calendário do usuário com suas aulas agendadas
 */
const getUserCalendar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json(createApiResponse(
      false,
      'Mês e ano são obrigatórios'
    ));
  }

  try {
    const calendar = await schedulingService.getUserCalendar(
      userId,
      parseInt(month),
      parseInt(year)
    );

    res.json(createApiResponse(
      true,
      'Calendário obtido com sucesso',
      calendar
    ));
  } catch (error) {
    return res.status(500).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * GET /instructors/:id/calendar
 * Obter calendário público de um instrutor
 */
const getInstructorCalendar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json(createApiResponse(
      false,
      'Mês e ano são obrigatórios'
    ));
  }

  try {
    const calendar = await schedulingService.getInstructorCalendar(
      id,
      parseInt(month),
      parseInt(year)
    );

    res.json(createApiResponse(
      true,
      'Calendário do instrutor obtido com sucesso',
      calendar
    ));
  } catch (error) {
    const statusCode = error.message.includes('não encontrado') ? 404 : 500;
    return res.status(statusCode).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * PUT /users/password
 * Alterar senha do usuário logado
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user._id;

  // Validações básicas
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json(createApiResponse(
      false,
      'Todos os campos são obrigatórios'
    ));
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json(createApiResponse(
      false,
      'A nova senha e a confirmação não coincidem'
    ));
  }

  if (newPassword.length < 6) {
    return res.status(400).json(createApiResponse(
      false,
      'A nova senha deve ter pelo menos 6 caracteres'
    ));
  }

  if (currentPassword === newPassword) {
    return res.status(400).json(createApiResponse(
      false,
      'A nova senha deve ser diferente da senha atual'
    ));
  }

  // Buscar usuário com senha
  const user = await User.findById(userId).select('+password');

  if (!user) {
    return res.status(404).json(createApiResponse(
      false,
      'Usuário não encontrado'
    ));
  }

  // Verificar se a senha atual está correta
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.status(401).json(createApiResponse(
      false,
      'Senha atual incorreta'
    ));
  }

  // Atualizar senha
  user.password = newPassword;
  await user.save();

  res.json(createApiResponse(
    true,
    'Senha alterada com sucesso'
  ));
});

module.exports = {
  getProfile,
  updateProfile,
  uploadUserAvatar,
  removeAvatar,
  getSettings,
  updateSettings,
  getCreditsHistory,
  purchaseCredits,
  getStats,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getEnrolledCourses,
  getTeachingCourses,
  becomeInstructor,
  deleteAccount,
  getCreditsBalance,
  getUserCalendar,
  getInstructorCalendar,
  changePassword
};
