const mongoose = require('mongoose');

const platformFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  rating: {
    type: Number,
    required: [true, 'Avaliação geral é obrigatória'],
    min: [1, 'Avaliação mínima é 1'],
    max: [5, 'Avaliação máxima é 5']
  },
  categories: {
    usability: {
      type: Number,
      min: [0, 'Avaliação mínima é 0'],
      max: [5, 'Avaliação máxima é 5'],
      default: 0
    },
    design: {
      type: Number,
      min: [0, 'Avaliação mínima é 0'],
      max: [5, 'Avaliação máxima é 5'],
      default: 0
    },
    performance: {
      type: Number,
      min: [0, 'Avaliação mínima é 0'],
      max: [5, 'Avaliação máxima é 5'],
      default: 0
    },
    support: {
      type: Number,
      min: [0, 'Avaliação mínima é 0'],
      max: [5, 'Avaliação máxima é 5'],
      default: 0
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [2000, 'Comentário não pode ter mais de 2000 caracteres'],
    default: ''
  },
  suggestions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Sugestões não podem ter mais de 2000 caracteres'],
    default: ''
  },
  wouldRecommend: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'archived'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Índices
platformFeedbackSchema.index({ userId: 1, createdAt: -1 });
platformFeedbackSchema.index({ rating: -1 });
platformFeedbackSchema.index({ status: 1 });
platformFeedbackSchema.index({ createdAt: -1 });

// Método estático para obter estatísticas agregadas
platformFeedbackSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        averageUsability: { $avg: '$categories.usability' },
        averageDesign: { $avg: '$categories.design' },
        averagePerformance: { $avg: '$categories.performance' },
        averageSupport: { $avg: '$categories.support' },
        wouldRecommendCount: {
          $sum: {
            $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0]
          }
        },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      averageUsability: 0,
      averageDesign: 0,
      averagePerformance: 0,
      averageSupport: 0,
      wouldRecommendCount: 0,
      wouldRecommendPercentage: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const stat = stats[0];
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  stat.ratingDistribution.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
    }
  });

  return {
    totalFeedback: stat.totalFeedback,
    averageRating: Math.round(stat.averageRating * 10) / 10,
    averageUsability: Math.round(stat.averageUsability * 10) / 10,
    averageDesign: Math.round(stat.averageDesign * 10) / 10,
    averagePerformance: Math.round(stat.averagePerformance * 10) / 10,
    averageSupport: Math.round(stat.averageSupport * 10) / 10,
    wouldRecommendCount: stat.wouldRecommendCount,
    wouldRecommendPercentage: stat.totalFeedback > 0 
      ? Math.round((stat.wouldRecommendCount / stat.totalFeedback) * 100) 
      : 0,
    ratingDistribution
  };
};

module.exports = mongoose.model('PlatformFeedback', platformFeedbackSchema);

