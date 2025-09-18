const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Criar avaliação
const createReview = asyncHandler(async (req, res) => {
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

  const { courseId, rating, comment, isAnonymous = false } = req.body;
  const studentId = req.user._id;

  // Verificar se o curso existe
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  // Verificar se o usuário está matriculado no curso
  if (!course.enrolledStudents.includes(studentId)) {
    return res.status(403).json(createApiResponse(
      false,
      'Você deve estar matriculado no curso para avaliá-lo'
    ));
  }

  // Verificar se já existe avaliação do usuário para este curso
  const existingReview = await Review.findOne({ courseId, studentId });
  if (existingReview) {
    return res.status(400).json(createApiResponse(
      false,
      'Você já avaliou este curso'
    ));
  }

  // Criar avaliação
  const review = new Review({
    courseId,
    studentId,
    instructorId: course.instructor,
    rating,
    comment: comment || '',
    isAnonymous
  });

  await review.save();

  // Buscar avaliação populada
  const populatedReview = await Review.findById(review._id)
    .populate('studentId', 'name avatar')
    .populate('courseId', 'title')
    .lean();

  // Se é anônima, remover dados do estudante
  if (populatedReview.isAnonymous) {
    populatedReview.studentId = {
      name: 'Usuário Anônimo',
      avatar: null
    };
  }

  res.status(201).json(createApiResponse(
    true,
    'Avaliação criada com sucesso',
    populatedReview
  ));
});

// Atualizar avaliação
const updateReview = asyncHandler(async (req, res) => {
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

  const { reviewId } = req.params;
  const { rating, comment, isAnonymous } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  // Verificar se o usuário é dono da avaliação
  if (review.studentId.toString() !== userId.toString()) {
    return res.status(403).json(createApiResponse(
      false,
      'Você só pode editar suas próprias avaliações'
    ));
  }

  // Atualizar campos
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

  await review.save();

  // Buscar avaliação populada
  const populatedReview = await Review.findById(review._id)
    .populate('studentId', 'name avatar')
    .populate('courseId', 'title')
    .lean();

  // Se é anônima, remover dados do estudante
  if (populatedReview.isAnonymous) {
    populatedReview.studentId = {
      name: 'Usuário Anônimo',
      avatar: null
    };
  }

  res.json(createApiResponse(
    true,
    'Avaliação atualizada com sucesso',
    populatedReview
  ));
});

// Deletar avaliação
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  // Verificar se o usuário é dono da avaliação ou instrutor do curso
  const course = await Course.findById(review.courseId);
  const isOwner = review.studentId.toString() === userId.toString();
  const isInstructor = course && course.instructor.toString() === userId.toString();

  if (!isOwner && !isInstructor) {
    return res.status(403).json(createApiResponse(
      false,
      'Você não tem permissão para deletar esta avaliação'
    ));
  }

  await Review.findByIdAndDelete(reviewId);

  res.json(createApiResponse(
    true,
    'Avaliação deletada com sucesso'
  ));
});

// Marcar avaliação como útil
const markReviewHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  try {
    await review.markHelpful(userId);

    res.json(createApiResponse(
      true,
      'Avaliação marcada como útil',
      { helpfulCount: review.helpfulCount }
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Desmarcar avaliação como útil
const unmarkReviewHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  try {
    await review.unmarkHelpful(userId);

    res.json(createApiResponse(
      true,
      'Avaliação desmarcada como útil',
      { helpfulCount: review.helpfulCount }
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Reportar avaliação
const reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason) {
    return res.status(400).json(createApiResponse(
      false,
      'Motivo da denúncia é obrigatório'
    ));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  try {
    await review.report(userId, reason);

    res.json(createApiResponse(
      true,
      'Avaliação reportada com sucesso'
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Responder avaliação (instrutor)
const respondToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { response } = req.body;
  const instructorId = req.user._id;

  if (!response || response.trim().length === 0) {
    return res.status(400).json(createApiResponse(
      false,
      'Resposta é obrigatória'
    ));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json(createApiResponse(
      false,
      'Avaliação não encontrada'
    ));
  }

  try {
    await review.respond(response.trim(), instructorId);

    const updatedReview = await Review.findById(reviewId)
      .populate('studentId', 'name avatar')
      .populate('courseId', 'title')
      .lean();

    // Se é anônima, remover dados do estudante
    if (updatedReview.isAnonymous) {
      updatedReview.studentId = {
        name: 'Usuário Anônimo',
        avatar: null
      };
    }

    res.json(createApiResponse(
      true,
      'Resposta adicionada com sucesso',
      updatedReview
    ));
  } catch (error) {
    return res.status(403).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Obter avaliações do usuário
const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  const total = await Review.countDocuments({
    studentId: userId,
    status: 'active'
  });

  const reviews = await Review.find({
    studentId: userId,
    status: 'active'
  })
    .populate('courseId', 'title image instructor')
    .populate({
      path: 'courseId',
      populate: {
        path: 'instructor',
        select: 'name avatar'
      }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  res.json(createApiResponse(
    true,
    'Avaliações do usuário obtidas com sucesso',
    reviews,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Obter avaliações recebidas (instrutor)
const getReceivedReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const instructorId = req.user._id;

  const total = await Review.countDocuments({
    instructorId,
    status: 'active'
  });

  const reviews = await Review.find({
    instructorId,
    status: 'active'
  })
    .populate('studentId', 'name avatar')
    .populate('courseId', 'title image')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Processar avaliações anônimas
  const processedReviews = reviews.map(review => {
    if (review.isAnonymous) {
      return {
        ...review,
        studentId: {
          name: 'Usuário Anônimo',
          avatar: null
        }
      };
    }
    return review;
  });

  res.json(createApiResponse(
    true,
    'Avaliações recebidas obtidas com sucesso',
    processedReviews,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Obter estatísticas de avaliações do instrutor
const getInstructorReviewStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  const stats = await Review.aggregate([
    {
      $match: {
        instructorId: instructorId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  let result = {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  if (stats.length > 0) {
    const stat = stats[0];
    result.totalReviews = stat.totalReviews;
    result.averageRating = Math.round(stat.averageRating * 10) / 10;

    // Calcular distribuição de ratings
    stat.ratingDistribution.forEach(rating => {
      result.ratingDistribution[rating]++;
    });
  }

  res.json(createApiResponse(
    true,
    'Estatísticas de avaliações obtidas com sucesso',
    result
  ));
});

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
  reportReview,
  respondToReview,
  getUserReviews,
  getReceivedReviews,
  getInstructorReviewStats
};
