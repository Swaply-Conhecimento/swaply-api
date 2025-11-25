const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: [0.5, 'Duração mínima é 0.5 horas']
  },
  lessons: [{
    type: String,
    trim: true
  }]
});

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  },
  time: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM-HH:MM)']
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [2000, 'Descrição não pode ter mais de 2000 caracteres']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instrutor é obrigatório']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    required: [true, 'Nível é obrigatório'],
    enum: ['Iniciante', 'Intermediário', 'Avançado']
  },
  courseLanguage: {
    type: String,
    default: 'Português'
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Preço por hora é obrigatório'],
    min: [1, 'Preço mínimo é 1 crédito por hora']
  },
  totalHours: {
    type: Number,
    required: [true, 'Total de horas é obrigatório'],
    min: [1, 'Mínimo de 1 hora']
  },
  // Preços
  pricing: {
    singleClass: {
      type: Number,
      required: [true, 'Preço da aula avulsa é obrigatório'],
      min: [1, 'Preço mínimo é 1 crédito']
    },
    fullCourse: {
      type: Number,
      required: [true, 'Preço do curso completo é obrigatório'],
      min: [1, 'Preço mínimo é 1 crédito']
    }
  },
  maxStudents: {
    type: Number,
    default: 50,
    min: [1, 'Mínimo de 1 estudante']
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: null
  },
  features: [{
    type: String,
    trim: true
  }],
  curriculum: [curriculumSchema],
  schedule: [scheduleSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  objectives: [{
    type: String,
    trim: true
  }],
  isLive: {
    type: Boolean,
    default: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Índices
courseSchema.index({ title: 'text', description: 'text', tags: 'text' }, {
  default_language: 'portuguese',
  language_override: 'none' // Impede que o campo 'language' do documento seja usado
});
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ currentStudents: -1 });
courseSchema.index({ createdAt: -1 });

// Virtual para preço total do curso
courseSchema.virtual('totalPrice').get(function() {
  return this.pricePerHour * this.totalHours;
});

// Método para atualizar rating
courseSchema.methods.updateRating = async function(newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newTotal = currentTotal + newRating;
  
  this.rating = Math.round((newTotal / totalRatings) * 10) / 10; // 1 casa decimal
  this.totalRatings = totalRatings;
  
  await this.save();
};

// Método para matricular estudante
courseSchema.methods.enrollStudent = async function(studentId) {
  if (this.currentStudents >= this.maxStudents) {
    throw new Error('Curso lotado');
  }
  
  if (this.enrolledStudents.includes(studentId)) {
    throw new Error('Estudante já matriculado');
  }
  
  this.enrolledStudents.push(studentId);
  this.currentStudents += 1;
  
  await this.save();
};

// Método para desmatricular estudante
courseSchema.methods.unenrollStudent = async function(studentId) {
  const index = this.enrolledStudents.indexOf(studentId);
  if (index === -1) {
    throw new Error('Estudante não está matriculado');
  }
  
  this.enrolledStudents.splice(index, 1);
  this.currentStudents -= 1;
  
  await this.save();
};

module.exports = mongoose.model('Course', courseSchema);
