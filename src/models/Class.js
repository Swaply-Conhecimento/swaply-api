const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'ID do curso é obrigatório']
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do instrutor é obrigatório']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do estudante é obrigatório']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Data deve ser no futuro'
    }
  },
  time: {
    type: String,
    required: [true, 'Horário é obrigatório'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  duration: {
    type: Number,
    default: 1,
    min: [0.5, 'Duração mínima é 0.5 horas'],
    max: [4, 'Duração máxima é 4 horas']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  zoomLink: {
    type: String,
    default: null
  },
  zoomMeetingId: {
    type: String,
    default: null
  },
  zoomPassword: {
    type: String,
    default: null
  },
  recordingUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notas não podem ter mais de 1000 caracteres'],
    default: ''
  },
  creditsUsed: {
    type: Number,
    required: [true, 'Créditos utilizados é obrigatório'],
    min: [1, 'Mínimo de 1 crédito']
  },
  feedback: {
    instructor: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Comentário não pode ter mais de 500 caracteres']
      }
    },
    student: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: [500, 'Comentário não pode ter mais de 500 caracteres']
      }
    }
  }
}, {
  timestamps: true
});

// Índices
classSchema.index({ instructorId: 1, date: 1 });
classSchema.index({ studentId: 1, date: 1 });
classSchema.index({ courseId: 1 });
classSchema.index({ status: 1 });
classSchema.index({ date: 1 });

// Virtual para data e hora combinadas
classSchema.virtual('dateTime').get(function() {
  const [hours, minutes] = this.time.split(':');
  const dateTime = new Date(this.date);
  dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return dateTime;
});

// Virtual para data de fim da aula
classSchema.virtual('endDateTime').get(function() {
  const startDateTime = this.dateTime;
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + this.duration);
  return endDateTime;
});

// Método para verificar conflito de horário
classSchema.statics.hasConflict = async function(instructorId, date, time, duration, excludeId = null) {
  const [hours, minutes] = time.split(':');
  const startDateTime = new Date(date);
  startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + duration);

  const query = {
    instructorId,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [
      {
        // Aula existente começa durante a nova aula
        $expr: {
          $and: [
            { $gte: ['$dateTime', startDateTime] },
            { $lt: ['$dateTime', endDateTime] }
          ]
        }
      },
      {
        // Aula existente termina durante a nova aula
        $expr: {
          $and: [
            { $gt: ['$endDateTime', startDateTime] },
            { $lte: ['$endDateTime', endDateTime] }
          ]
        }
      },
      {
        // Nova aula está contida na aula existente
        $expr: {
          $and: [
            { $lte: ['$dateTime', startDateTime] },
            { $gte: ['$endDateTime', endDateTime] }
          ]
        }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflictingClass = await this.findOne(query);
  return !!conflictingClass;
};

// Método para confirmar aula
classSchema.methods.confirm = async function() {
  if (this.status !== 'scheduled') {
    throw new Error('Apenas aulas agendadas podem ser confirmadas');
  }
  
  this.status = 'confirmed';
  await this.save();
};

// Método para completar aula
classSchema.methods.complete = async function() {
  if (this.status !== 'confirmed') {
    throw new Error('Apenas aulas confirmadas podem ser completadas');
  }
  
  this.status = 'completed';
  await this.save();
  
  // Atualizar estatísticas dos usuários
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.instructorId, {
    $inc: { 
      'stats.totalHours': this.duration,
      'stats.totalEarnings': this.creditsUsed,
      credits: this.creditsUsed
    }
  });
  
  await User.findByIdAndUpdate(this.studentId, {
    $inc: { 'stats.totalHours': this.duration }
  });
};

// Método para cancelar aula
classSchema.methods.cancel = async function(refund = false) {
  if (this.status === 'completed') {
    throw new Error('Aulas completadas não podem ser canceladas');
  }
  
  this.status = 'cancelled';
  await this.save();
  
  // Reembolsar créditos se necessário
  if (refund) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.studentId, {
      $inc: { credits: this.creditsUsed }
    });
  }
};

module.exports = mongoose.model('Class', classSchema);
