const Course = require('../models/Course');
const User = require('../models/User');
const Review = require('../models/Review');
const { uploadImage, deleteFile } = require('../middleware/upload');
const { uploadImage: uploadImageToCloud, deleteImage } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { COURSE_CATEGORIES, COURSE_SUBCATEGORIES } = require('../utils/constants');

// Listar todos os cursos com filtros
const getAllCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    subcategory,
    level,
    minPrice,
    maxPrice,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    instructor,
    status = 'active'
  } = req.query;

  // Construir query
  const query = { status };

  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (level) query.level = level;
  if (instructor) query.instructor = instructor;

  // Filtro de preço
  if (minPrice || maxPrice) {
    query.pricePerHour = {};
    if (minPrice) query.pricePerHour.$gte = parseInt(minPrice);
    if (maxPrice) query.pricePerHour.$lte = parseInt(maxPrice);
  }

  // Busca por texto
  if (search) {
    query.$text = { $search: search };
  }

  // Ordenação
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate('instructor', 'name avatar')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Adicionar informações calculadas
  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents
  }));

  res.json(createApiResponse(
    true,
    'Cursos obtidos com sucesso',
    coursesWithInfo,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Buscar cursos
const searchCourses = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, ...filters } = req.query;

  if (!q) {
    return res.status(400).json(createApiResponse(
      false,
      'Termo de busca é obrigatório'
    ));
  }

  const query = {
    status: 'active',
    $text: { $search: q },
    ...filters
  };

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query, { score: { $meta: 'textScore' } })
    .populate('instructor', 'name avatar')
    .sort({ score: { $meta: 'textScore' }, rating: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents
  }));

  res.json(createApiResponse(
    true,
    'Busca realizada com sucesso',
    coursesWithInfo,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      searchTerm: q
    }
  ));
});

// Obter categorias
const getCategories = asyncHandler(async (req, res) => {
  const categories = COURSE_CATEGORIES.map(category => ({
    name: category,
    subcategories: COURSE_SUBCATEGORIES[category] || []
  }));

  res.json(createApiResponse(
    true,
    'Categorias obtidas com sucesso',
    categories
  ));
});

// Obter cursos em destaque
const getFeaturedCourses = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const courses = await Course.find({ 
    status: 'active',
    rating: { $gte: 4.0 },
    currentStudents: { $gte: 5 }
  })
    .populate('instructor', 'name avatar')
    .sort({ rating: -1, currentStudents: -1 })
    .limit(parseInt(limit))
    .lean();

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents
  }));

  res.json(createApiResponse(
    true,
    'Cursos em destaque obtidos com sucesso',
    coursesWithInfo
  ));
});

// Obter cursos populares
const getPopularCourses = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const courses = await Course.find({ status: 'active' })
    .populate('instructor', 'name avatar')
    .sort({ currentStudents: -1, rating: -1 })
    .limit(parseInt(limit))
    .lean();

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents
  }));

  res.json(createApiResponse(
    true,
    'Cursos populares obtidos com sucesso',
    coursesWithInfo
  ));
});

// Obter cursos recomendados
const getRecommendedCourses = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 6 } = req.query;

  const user = await User.findById(userId).populate('favorites');
  
  if (!user) {
    return res.status(404).json(createApiResponse(
      false,
      'Usuário não encontrado'
    ));
  }

  // Obter categorias dos cursos favoritos
  const favoriteCategories = user.favorites.map(course => course.category);
  const uniqueCategories = [...new Set(favoriteCategories)];

  let query = { status: 'active' };
  
  if (uniqueCategories.length > 0) {
    query.category = { $in: uniqueCategories };
    query._id = { $nin: user.favorites.map(course => course._id) };
  }

  const courses = await Course.find(query)
    .populate('instructor', 'name avatar')
    .sort({ rating: -1, currentStudents: -1 })
    .limit(parseInt(limit))
    .lean();

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents
  }));

  res.json(createApiResponse(
    true,
    'Cursos recomendados obtidos com sucesso',
    coursesWithInfo
  ));
});

// Obter curso por ID
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id)
    .populate('instructor', 'name avatar bio stats')
    .populate('enrolledStudents', 'name avatar')
    .lean();

  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  // Adicionar informações calculadas
  const courseWithInfo = {
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isEnrolled: req.user ? course.enrolledStudents.some(
      student => student._id.toString() === req.user._id.toString()
    ) : false,
    isFavorite: req.user ? req.user.favorites.includes(course._id) : false
  };

  res.json(createApiResponse(
    true,
    'Curso obtido com sucesso',
    courseWithInfo
  ));
});

// Criar novo curso
const createCourse = asyncHandler(async (req, res) => {
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

  const courseData = {
    ...req.body,
    instructor: req.user._id
  };

  const course = new Course(courseData);
  await course.save();

  // Atualizar estatísticas do usuário
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.coursesTeaching': 1 },
    $set: { isInstructor: true } // Garantir que está marcado (redundante mas seguro)
  });

  const populatedCourse = await Course.findById(course._id)
    .populate('instructor', 'name avatar');

  res.status(201).json(createApiResponse(
    true,
    'Curso criado com sucesso',
    populatedCourse
  ));
});

// Atualizar curso
const updateCourse = asyncHandler(async (req, res) => {
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

  const { id } = req.params;
  const course = req.course; // Vem do middleware requireCourseOwnership

  // Atualizar campos permitidos
  const allowedFields = [
    'title', 'description', 'category', 'subcategory', 'level',
    'language', 'pricePerHour', 'totalHours', 'maxStudents',
    'features', 'curriculum', 'schedule', 'requirements',
    'objectives', 'tags', 'status'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  await course.save();

  const populatedCourse = await Course.findById(course._id)
    .populate('instructor', 'name avatar');

  res.json(createApiResponse(
    true,
    'Curso atualizado com sucesso',
    populatedCourse
  ));
});

// Deletar curso
const deleteCourse = asyncHandler(async (req, res) => {
  const course = req.course; // Vem do middleware requireCourseOwnership

  // Verificar se há estudantes matriculados
  if (course.currentStudents > 0) {
    return res.status(400).json(createApiResponse(
      false,
      'Não é possível deletar curso com estudantes matriculados'
    ));
  }

  await Course.findByIdAndDelete(course._id);

  // Atualizar estatísticas do instrutor
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.coursesTeaching': -1 }
  });

  res.json(createApiResponse(
    true,
    'Curso deletado com sucesso'
  ));
});

// Matricular-se no curso
const enrollInCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  if (course.status !== 'active') {
    return res.status(400).json(createApiResponse(
      false,
      'Curso não está ativo'
    ));
  }

  if (course.instructor.toString() === user._id.toString()) {
    return res.status(400).json(createApiResponse(
      false,
      'Você não pode se matricular no seu próprio curso'
    ));
  }

  try {
    await course.enrollStudent(user._id);

    res.json(createApiResponse(
      true,
      'Matrícula realizada com sucesso'
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Cancelar matrícula
const unenrollFromCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  try {
    await course.unenrollStudent(user._id);

    res.json(createApiResponse(
      true,
      'Matrícula cancelada com sucesso'
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

// Listar estudantes do curso
const getCourseStudents = asyncHandler(async (req, res) => {
  const course = req.course; // Vem do middleware requireCourseOwnership
  const { page = 1, limit = 10 } = req.query;

  const total = course.enrolledStudents.length;
  const students = await User.find({
    _id: { $in: course.enrolledStudents }
  })
    .select('name avatar joinDate stats')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  res.json(createApiResponse(
    true,
    'Estudantes do curso obtidos com sucesso',
    students,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

// Upload de imagem do curso
const uploadCourseImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(createApiResponse(
      false,
      'Nenhum arquivo foi enviado'
    ));
  }

  const course = req.course; // Vem do middleware requireCourseOwnership

  try {
    // Upload para Cloudinary
    const result = await uploadImageToCloud(req.file.path, 'swaply/courses');

    // Deletar imagem anterior se existir
    if (course.image) {
      try {
        const publicId = course.image.split('/').pop().split('.')[0];
        await deleteImage(`swaply/courses/${publicId}`);
      } catch (deleteError) {
        console.error('Erro ao deletar imagem anterior:', deleteError);
      }
    }

    // Atualizar curso
    course.image = result.url;
    await course.save();

    // Limpar arquivo temporário
    await deleteFile(req.file.path);

    res.json(createApiResponse(
      true,
      'Imagem do curso atualizada com sucesso',
      { image: course.image }
    ));

  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    await deleteFile(req.file.path);
    throw error;
  }
});

// Obter avaliações do curso
const getCourseReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const total = await Review.countDocuments({ 
    courseId: id, 
    status: 'active' 
  });

  const reviews = await Review.find({ 
    courseId: id, 
    status: 'active' 
  })
    .populate('studentId', 'name avatar')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Obter estatísticas das avaliações
  const stats = await Review.getCourseStats(id);

  res.json(createApiResponse(
    true,
    'Avaliações do curso obtidas com sucesso',
    {
      reviews,
      stats
    },
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

module.exports = {
  getAllCourses,
  searchCourses,
  getCategories,
  getFeaturedCourses,
  getPopularCourses,
  getRecommendedCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
  getCourseStudents,
  uploadCourseImage,
  getCourseReviews
};
