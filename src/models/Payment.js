const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  type: {
    type: String,
    enum: ['credit_purchase', 'credit_earned', 'credit_spent', 'refund'],
    required: [true, 'Tipo de transação é obrigatório']
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor não pode ser negativo']
  },
  credits: {
    type: Number,
    required: [true, 'Quantidade de créditos é obrigatória'],
    min: [0, 'Créditos não podem ser negativos']
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [200, 'Descrição não pode ter mais de 200 caracteres']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'pix', 'paypal', 'stripe', 'internal'],
    default: 'internal'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processedAt: {
    type: Date,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// Middleware para gerar transactionId único
paymentSchema.pre('save', function(next) {
  if (!this.transactionId && this.isNew) {
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Método para processar pagamento
paymentSchema.methods.process = async function() {
  if (this.status !== 'pending') {
    throw new Error('Apenas transações pendentes podem ser processadas');
  }
  
  this.status = 'completed';
  this.processedAt = new Date();
  
  // Atualizar créditos do usuário
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  switch (this.type) {
    case 'credit_purchase':
      user.credits += this.credits;
      break;
    case 'credit_earned':
      user.credits += this.credits;
      break;
    case 'credit_spent':
      if (user.credits < this.credits) {
        throw new Error('Créditos insuficientes');
      }
      user.credits -= this.credits;
      break;
    case 'refund':
      user.credits += this.credits;
      break;
  }
  
  await user.save();
  await this.save();
};

// Método para falhar pagamento
paymentSchema.methods.fail = async function(reason = 'Falha no processamento') {
  if (this.status !== 'pending') {
    throw new Error('Apenas transações pendentes podem falhar');
  }
  
  this.status = 'failed';
  this.metadata.failureReason = reason;
  this.processedAt = new Date();
  
  await this.save();
};

// Método para reembolsar
paymentSchema.methods.refund = async function(amount = null) {
  if (this.status !== 'completed') {
    throw new Error('Apenas transações completadas podem ser reembolsadas');
  }
  
  const refundAmount = amount || this.amount;
  const refundCredits = Math.floor((refundAmount / this.amount) * this.credits);
  
  if (refundAmount > this.amount) {
    throw new Error('Valor do reembolso não pode ser maior que o valor original');
  }
  
  // Criar transação de reembolso
  const Payment = this.constructor;
  const refundPayment = new Payment({
    userId: this.userId,
    type: 'refund',
    amount: refundAmount,
    credits: refundCredits,
    description: `Reembolso - ${this.description}`,
    courseId: this.courseId,
    classId: this.classId,
    paymentMethod: this.paymentMethod,
    status: 'completed',
    processedAt: new Date(),
    metadata: {
      originalTransactionId: this.transactionId
    }
  });
  
  await refundPayment.save();
  await refundPayment.process();
  
  // Atualizar transação original
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundAmount = refundAmount;
  
  await this.save();
  
  return refundPayment;
};

// Método estático para obter resumo financeiro do usuário
paymentSchema.statics.getUserSummary = async function(userId, startDate = null, endDate = null) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'completed'
  };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalCredits: { $sum: '$credits' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    credit_purchase: { totalAmount: 0, totalCredits: 0, count: 0 },
    credit_earned: { totalAmount: 0, totalCredits: 0, count: 0 },
    credit_spent: { totalAmount: 0, totalCredits: 0, count: 0 },
    refund: { totalAmount: 0, totalCredits: 0, count: 0 }
  };
  
  summary.forEach(item => {
    result[item._id] = {
      totalAmount: item.totalAmount,
      totalCredits: item.totalCredits,
      count: item.count
    };
  });
  
  return result;
};

module.exports = mongoose.model('Payment', paymentSchema);
