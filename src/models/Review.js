const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'ID do curso é obrigatório']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do estudante é obrigatório']
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do instrutor é obrigatório']
  },
  rating: {
    type: Number,
    required: [true, 'Avaliação é obrigatória'],
    min: [1, 'Avaliação mínima é 1'],
    max: [5, 'Avaliação máxima é 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comentário não pode ter mais de 1000 caracteres'],
    default: ''
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: [0, 'Contagem não pode ser negativa']
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  response: {
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Resposta não pode ter mais de 500 caracteres']
    },
    respondedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Índices
reviewSchema.index({ courseId: 1, createdAt: -1 });
reviewSchema.index({ studentId: 1 });
reviewSchema.index({ instructorId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ status: 1 });

// Índice composto para evitar avaliações duplicadas
reviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Método para marcar como útil
reviewSchema.methods.markHelpful = async function(userId) {
  if (this.helpfulUsers.includes(userId)) {
    throw new Error('Usuário já marcou esta avaliação como útil');
  }
  
  this.helpfulUsers.push(userId);
  this.helpfulCount += 1;
  
  await this.save();
};

// Método para desmarcar como útil
reviewSchema.methods.unmarkHelpful = async function(userId) {
  const index = this.helpfulUsers.indexOf(userId);
  if (index === -1) {
    throw new Error('Usuário não marcou esta avaliação como útil');
  }
  
  this.helpfulUsers.splice(index, 1);
  this.helpfulCount = Math.max(0, this.helpfulCount - 1);
  
  await this.save();
};

// Método para reportar avaliação
reviewSchema.methods.report = async function(userId, reason) {
  // Verificar se usuário já reportou
  const existingReport = this.reportedBy.find(report => 
    report.userId.toString() === userId.toString()
  );
  
  if (existingReport) {
    throw new Error('Usuário já reportou esta avaliação');
  }
  
  this.reportedBy.push({
    userId,
    reason,
    reportedAt: new Date()
  });
  
  this.reportCount += 1;
  this.isReported = true;
  
  // Se muitos reports, ocultar automaticamente
  if (this.reportCount >= 5) {
    this.status = 'hidden';
  }
  
  await this.save();
};

// Método para responder avaliação (instrutor)
reviewSchema.methods.respond = async function(responseText, instructorId) {
  if (this.instructorId.toString() !== instructorId.toString()) {
    throw new Error('Apenas o instrutor do curso pode responder');
  }
  
  this.response = {
    comment: responseText,
    respondedAt: new Date()
  };
  
  await this.save();
};

// Middleware para atualizar rating do curso após salvar
reviewSchema.post('save', async function(doc) {
  if (doc.status === 'active') {
    const Course = mongoose.model('Course');
    const course = await Course.findById(doc.courseId);
    
    if (course) {
      // Recalcular rating do curso
      const reviews = await mongoose.model('Review').find({
        courseId: doc.courseId,
        status: 'active'
      });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
        
        course.rating = averageRating;
        course.totalRatings = reviews.length;
        
        await course.save();
      }
    }
  }
});

// Middleware para atualizar rating do curso após remover
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'active') {
    const Course = mongoose.model('Course');
    const course = await Course.findById(doc.courseId);
    
    if (course) {
      // Recalcular rating do curso
      const reviews = await mongoose.model('Review').find({
        courseId: doc.courseId,
        status: 'active'
      });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
        
        course.rating = averageRating;
        course.totalRatings = reviews.length;
      } else {
        course.rating = 0;
        course.totalRatings = 0;
      }
      
      await course.save();
    }
  }
});

// Método estático para obter estatísticas de avaliações
reviewSchema.statics.getCourseStats = async function(courseId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        courseId: new mongoose.Types.ObjectId(courseId),
        status: 'active'
      } 
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
  
  const result = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    total: 0,
    average: 0
  };
  
  let totalReviews = 0;
  let totalRating = 0;
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    totalReviews += stat.count;
    totalRating += stat._id * stat.count;
  });
  
  result.total = totalReviews;
  result.average = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;
  
  return result;
};

module.exports = mongoose.model('Review', reviewSchema);
