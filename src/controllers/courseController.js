const Course = require('../models/Course');
const User = require('../models/User');
const Review = require('../models/Review');
const InstructorAvailability = require('../models/InstructorAvailability');
const { uploadImage, deleteFile } = require('../middleware/upload');
const { uploadImage: uploadImageToCloud, deleteImage } = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { COURSE_CATEGORIES, COURSE_SUBCATEGORIES } = require('../utils/constants');

// Helper para mapear courseLanguage para language (compatibilidade com frontend)
const mapCourseLanguage = (course) => {
  if (course && course.courseLanguage) {
    course.language = course.courseLanguage;
  }
  return course;
};

// Helper para sanitizar dados do curso antes de salvar
const sanitizeCourseData = (data) => {
  const sanitized = { ...data };

  // Sanitizar features: converter de array de objetos para array de strings
  if (sanitized.features && Array.isArray(sanitized.features)) {
    const processedFeatures = [];
    
    sanitized.features.forEach(feature => {
      if (typeof feature === 'string') {
        // Tentar desstringificar se for JSON string
        try {
          const parsed = JSON.parse(feature);
          if (Array.isArray(parsed)) {
            // Se for array, adicionar cada item
            parsed.forEach(item => {
              if (typeof item === 'string' && item.trim()) {
                processedFeatures.push(item.trim());
              }
            });
          } else if (typeof parsed === 'string' && parsed.trim()) {
            processedFeatures.push(parsed.trim());
          }
        } catch {
          // Se não for JSON válido, usar como string
          if (feature.trim()) {
            processedFeatures.push(feature.trim());
          }
        }
      } else if (typeof feature === 'object' && feature !== null) {
        // Se for objeto, processar title ou description
        const title = feature.title || feature.description || feature.name;
        if (title) {
          if (typeof title === 'string') {
            // Se title for uma string JSON stringificada, desstringificar
            try {
              const parsed = JSON.parse(title);
              if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                  if (typeof item === 'string' && item.trim()) {
                    processedFeatures.push(item.trim());
                  }
                });
              } else if (typeof parsed === 'string' && parsed.trim()) {
                processedFeatures.push(parsed.trim());
              }
            } catch {
              // Se não for JSON, usar como string
              if (title.trim()) {
                processedFeatures.push(title.trim());
              }
            }
          } else {
            processedFeatures.push(String(title).trim());
          }
        }
      } else if (feature !== null && feature !== undefined) {
        const str = String(feature).trim();
        if (str) {
          processedFeatures.push(str);
        }
      }
    });
    
    sanitized.features = processedFeatures.filter(f => f && f.trim() !== ''); // Remover vazios
  }

  // Helper para desstringificar arrays JSON aninhados
  const parseNestedArray = (value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // Se o array contém strings JSON stringificadas, desstringificar recursivamente
          return parsed.map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch {
                return item;
              }
            }
            return item;
          }).flat();
        }
        return [parsed];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  };

  // Sanitizar requirements: desstringificar se for JSON string
  if (sanitized.requirements && Array.isArray(sanitized.requirements)) {
    sanitized.requirements = sanitized.requirements
      .map(req => parseNestedArray(req))
      .flat()
      .filter(r => r && String(r).trim() !== ''); // Remover vazios
  }

  // Sanitizar objectives: desstringificar se for JSON string
  if (sanitized.objectives && Array.isArray(sanitized.objectives)) {
    sanitized.objectives = sanitized.objectives
      .map(obj => parseNestedArray(obj))
      .flat()
      .filter(o => o && String(o).trim() !== ''); // Remover vazios
  }

  // Sanitizar tags: desstringificar se for JSON string
  if (sanitized.tags && Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags
      .map(tag => parseNestedArray(tag))
      .flat()
      .filter(t => t && String(t).trim() !== '') // Remover vazios
      .map(t => String(t).toLowerCase().trim()); // Normalizar para lowercase
  }

  return sanitized;
};

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

  // Preparar set de favoritos do usuário, se houver
  const favoriteSet = new Set((req.user && Array.isArray(req.user.favorites))
    ? req.user.favorites.map(f => f.toString())
    : []);

  // Adicionar informações calculadas
  const coursesWithInfo = courses.map(course => {
    const courseInfo = {
      ...course,
      totalPrice: course.pricePerHour * course.totalHours,
      spotsAvailable: course.maxStudents - course.currentStudents,
      isFavorite: favoriteSet.has(course._id.toString())
    };
    return mapCourseLanguage(courseInfo);
  });

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

  const favoriteSet = new Set((req.user && Array.isArray(req.user.favorites))
    ? req.user.favorites.map(f => f.toString())
    : []);

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isFavorite: favoriteSet.has(course._id.toString())
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

  const favoriteSet = new Set((req.user && Array.isArray(req.user.favorites))
    ? req.user.favorites.map(f => f.toString())
    : []);

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isFavorite: favoriteSet.has(course._id.toString())
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

  const favoriteSet = new Set((req.user && Array.isArray(req.user.favorites))
    ? req.user.favorites.map(f => f.toString())
    : []);

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isFavorite: favoriteSet.has(course._id.toString())
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

  // If requester is authenticated, build favorite set
  const favoriteSet = new Set((req.user && Array.isArray(req.user.favorites))
    ? req.user.favorites.map(f => f.toString())
    : []);

  const coursesWithInfo = courses.map(course => ({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isFavorite: favoriteSet.has(course._id.toString())
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

  // Buscar disponibilidade do curso
  let availability = null;
  try {
    availability = await InstructorAvailability.findOne({
      instructor: course.instructor._id,
      course: course._id
    }).lean();
  } catch (err) {
    console.warn('Erro ao buscar disponibilidade do curso:', err.message);
  }

  // Adicionar informações calculadas
  const courseWithInfo = mapCourseLanguage({
    ...course,
    totalPrice: course.pricePerHour * course.totalHours,
    spotsAvailable: course.maxStudents - course.currentStudents,
    isEnrolled: req.user ? course.enrolledStudents.some(
      student => student._id.toString() === req.user._id.toString()
    ) : false,
    isFavorite: req.user ? req.user.favorites.includes(course._id) : false,
    availability: availability ? {
      recurringAvailability: availability.recurringAvailability,
      specificSlots: availability.specificSlots,
      minAdvanceBooking: availability.minAdvanceBooking,
      maxAdvanceBooking: availability.maxAdvanceBooking,
      slotDuration: availability.slotDuration,
      bufferTime: availability.bufferTime,
      timezone: availability.timezone
    } : null
  });

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
    console.error('Erro na validação ao criar curso:', {
      userId: req.user._id,
      errors: errors.array()
    });
    return res.status(400).json(createApiResponse(
      false,
      'Dados inválidos',
      null,
      null,
      errors.array()
    ));
  }

  try {
    // Mapear 'language' para 'courseLanguage' para evitar conflito com MongoDB
    const { language, availability, ...restBody } = req.body;
    
    // Sanitizar dados antes de processar
    const sanitizedData = sanitizeCourseData(restBody);
    
    const courseData = {
      ...sanitizedData,
      instructor: req.user._id
    };
    
    // Se language foi enviado, mapear para courseLanguage
    if (language !== undefined) {
      courseData.courseLanguage = language;
    }

    // Upload de imagem se fornecida
    if (req.file) {
      try {
        const uploadResult = await uploadImageToCloud(req.file.path, 'swaply/courses');
        courseData.image = uploadResult.url;
      } catch (uploadError) {
        console.error('Erro ao fazer upload da imagem do curso:', {
          userId: req.user._id,
          courseTitle: req.body.title,
          error: uploadError.message
        });
        throw new Error('Erro ao fazer upload da imagem do curso');
      } finally {
        await deleteFile(req.file.path).catch(() => {});
      }
    }

    // Criar e salvar curso
    const course = new Course(courseData);
    try {
      await course.save();
    } catch (saveError) {
      console.error('Erro ao salvar curso no banco de dados:', {
        userId: req.user._id,
        courseTitle: req.body.title,
        error: saveError.message
      });
      throw saveError;
    }

    // Atualizar estatísticas do usuário
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.coursesTeaching': 1 },
        $set: { isInstructor: true }
      });
    } catch (statsError) {
      console.error('Erro ao atualizar estatísticas do usuário após criar curso:', {
        userId: req.user._id,
        courseId: course._id,
        error: statsError.message
      });
      // Não falha a criação do curso se a atualização de stats falhar
    }

    // Criar ou atualizar disponibilidade para o curso se fornecida
    if (availability) {
      try {
        // Usar findOneAndUpdate para evitar erro de chave duplicada
        await InstructorAvailability.findOneAndUpdate(
          {
            instructor: req.user._id,
            course: course._id
          },
          {
            $set: {
              instructor: req.user._id,
              course: course._id,
              recurringAvailability: availability.recurringAvailability || [],
              specificSlots: availability.specificSlots || [],
              minAdvanceBooking: availability.minAdvanceBooking || 2,
              maxAdvanceBooking: availability.maxAdvanceBooking || 60,
              slotDuration: availability.slotDuration || 1,
              bufferTime: availability.bufferTime || 0,
              timezone: availability.timezone || 'America/Sao_Paulo',
              isActive: true
            }
          },
          {
            upsert: true, // Criar se não existir, atualizar se existir
            new: true,
            setDefaultsOnInsert: true
          }
        );
      } catch (availabilityError) {
        console.warn('Erro ao criar/atualizar disponibilidade do curso:', {
          courseId: course._id,
          error: availabilityError.message
        });
        // Não falha a criação do curso se a disponibilidade falhar
      }
    }

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name avatar')
      .lean();

    res.status(201).json(createApiResponse(
      true,
      'Curso criado com sucesso',
      mapCourseLanguage(populatedCourse)
    ));
  } catch (error) {
    console.error('Erro ao criar curso:', {
      userId: req.user._id,
      courseTitle: req.body.title,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
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

  // Sanitizar dados antes de processar
  const { availability, language, ...restBody } = req.body;
  const sanitizedData = sanitizeCourseData(restBody);

  // Atualizar campos permitidos
  const allowedFields = [
    'title', 'description', 'category', 'subcategory', 'level',
    'pricePerHour', 'totalHours', 'maxStudents', 'pricing',
    'features', 'curriculum', 'schedule', 'requirements',
    'objectives', 'tags', 'status'
  ];

  allowedFields.forEach(field => {
    if (sanitizedData[field] !== undefined) {
      course[field] = sanitizedData[field];
    }
  });
  
  // Mapear 'language' para 'courseLanguage'
  if (language !== undefined) {
    course.courseLanguage = language;
  }

  // Upload de imagem se fornecida
  if (req.file) {
    try {
      // Deletar imagem anterior se existir
      if (course.image) {
        try {
          const publicId = course.image.split('/').pop().split('.')[0];
          await deleteImage(`swaply/courses/${publicId}`);
        } catch (deleteError) {
          // Erro ao deletar imagem anterior - silencioso
          console.warn('Erro ao deletar imagem anterior:', deleteError.message);
        }
      }

      const uploadResult = await uploadImageToCloud(req.file.path, 'swaply/courses');
      course.image = uploadResult.url;
    } catch (uploadError) {
      console.error('Erro ao fazer upload da imagem do curso:', {
        userId: req.user._id,
        courseId: course._id,
        error: uploadError.message
      });
      throw new Error('Erro ao fazer upload da imagem do curso');
    } finally {
      await deleteFile(req.file.path).catch(() => {});
    }
  }

  await course.save();

  // Atualizar disponibilidade do curso se fornecida
  if (availability) {
    try {
      // Construir objeto de atualização apenas com campos fornecidos
      const updateData = {
        instructor: req.user._id,
        course: course._id,
        isActive: true
      };

      if (availability.recurringAvailability !== undefined) {
        updateData.recurringAvailability = availability.recurringAvailability;
      }
      if (availability.specificSlots !== undefined) {
        updateData.specificSlots = availability.specificSlots;
      }
      if (availability.minAdvanceBooking !== undefined) {
        updateData.minAdvanceBooking = availability.minAdvanceBooking;
      }
      if (availability.maxAdvanceBooking !== undefined) {
        updateData.maxAdvanceBooking = availability.maxAdvanceBooking;
      }
      if (availability.slotDuration !== undefined) {
        updateData.slotDuration = availability.slotDuration;
      }
      if (availability.bufferTime !== undefined) {
        updateData.bufferTime = availability.bufferTime;
      }
      if (availability.timezone !== undefined) {
        updateData.timezone = availability.timezone;
      }

      // Usar findOneAndUpdate para evitar erro de chave duplicada
      await InstructorAvailability.findOneAndUpdate(
        {
          instructor: req.user._id,
          course: course._id
        },
        { $set: updateData },
        {
          upsert: true, // Criar se não existir, atualizar se existir
          new: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (availabilityError) {
      console.warn('Erro ao atualizar disponibilidade do curso:', {
        courseId: course._id,
        error: availabilityError.message
      });
      // Não falha a atualização do curso se a disponibilidade falhar
    }
  }

  const populatedCourse = await Course.findById(course._id)
    .populate('instructor', 'name avatar')
    .lean();

  res.json(createApiResponse(
    true,
    'Curso atualizado com sucesso',
    mapCourseLanguage(populatedCourse)
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
        // Erro ao deletar imagem anterior - silencioso
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
