const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio não pode ter mais de 500 caracteres'],
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  credits: {
    type: Number,
    default: 10,
    min: [0, 'Créditos não podem ser negativos']
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isInstructor: {
    type: Boolean,
    default: true  // Todos podem ensinar e aprender
  },
  stats: {
    coursesCompleted: {
      type: Number,
      default: 0
    },
    coursesTeaching: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    accessibility: {
      fontSizeControl: {
        type: Boolean,
        default: true
      },
      screenReader: {
        type: Boolean,
        default: false
      },
      audioDescription: {
        type: Boolean,
        default: false
      },
      vlibras: {
        type: Boolean,
        default: false
      }
    },
    notifications: {
      classNotifications: {
        type: Boolean,
        default: true
      },
      interestNotifications: {
        type: Boolean,
        default: true
      },
      newCoursesNotifications: {
        type: Boolean,
        default: true
      }
    }
  },
  googleId: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ isInstructor: 1 });

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obter dados públicos do usuário
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.googleId;
  return userObject;
};

// Método para atualizar estatísticas
userSchema.methods.updateStats = async function(field, value) {
  this.stats[field] += value;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
