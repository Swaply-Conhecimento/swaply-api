const mongoose = require('mongoose');

/**
 * Schema para disponibilidade recorrente do instrutor
 * Define horários fixos por dia da semana
 */
const recurringAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0, // Domingo
    max: 6, // Sábado
    enum: [0, 1, 2, 3, 4, 5, 6]
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

/**
 * Schema para slots de disponibilidade específicos
 * Para datas específicas que sobrescrevem a disponibilidade recorrente
 */
const specificSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    trim: true
  }
});

/**
 * Schema principal de disponibilidade do instrutor
 */
const instructorAvailabilitySchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null // null = disponibilidade geral do instrutor
  },
  timezone: {
    type: String,
    default: 'America/Sao_Paulo'
  },
  
  // Disponibilidade recorrente (padrão semanal)
  recurringAvailability: [recurringAvailabilitySchema],
  
  // Slots específicos (sobrescrevem a disponibilidade recorrente)
  specificSlots: [specificSlotSchema],
  
  // Configurações gerais
  minAdvanceBooking: {
    type: Number,
    default: 2, // Horas mínimas de antecedência
    min: 0
  },
  maxAdvanceBooking: {
    type: Number,
    default: 60, // Dias máximos de antecedência
    min: 1
  },
  slotDuration: {
    type: Number,
    default: 1, // Duração padrão do slot em horas
    min: 0.5
  },
  bufferTime: {
    type: Number,
    default: 0, // Tempo de buffer entre aulas (em minutos)
    min: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
instructorAvailabilitySchema.index({ instructor: 1 });
instructorAvailabilitySchema.index({ course: 1 });
instructorAvailabilitySchema.index({ 'recurringAvailability.dayOfWeek': 1 });
instructorAvailabilitySchema.index({ 'specificSlots.date': 1 });

// Índice único composto: garante que cada instrutor tenha apenas:
// - Uma disponibilidade geral (course: null)
// - Uma disponibilidade específica por curso (course: ObjectId)
instructorAvailabilitySchema.index(
  { instructor: 1, course: 1 },
  { unique: true }
);

/**
 * Método para adicionar disponibilidade recorrente
 */
instructorAvailabilitySchema.methods.addRecurringSlot = function(dayOfWeek, startTime, endTime) {
  // Verificar se já existe
  const exists = this.recurringAvailability.some(slot => 
    slot.dayOfWeek === dayOfWeek && 
    slot.startTime === startTime && 
    slot.endTime === endTime
  );
  
  if (exists) {
    throw new Error('Este horário já existe na disponibilidade recorrente');
  }
  
  this.recurringAvailability.push({ dayOfWeek, startTime, endTime });
  return this.save();
};

/**
 * Método para remover disponibilidade recorrente
 */
instructorAvailabilitySchema.methods.removeRecurringSlot = function(slotId) {
  this.recurringAvailability.id(slotId).remove();
  return this.save();
};

/**
 * Método para adicionar slot específico
 */
instructorAvailabilitySchema.methods.addSpecificSlot = function(date, startTime, endTime, isAvailable = true, reason = '') {
  this.specificSlots.push({ date, startTime, endTime, isAvailable, reason });
  return this.save();
};

/**
 * Método para bloquear data específica
 */
instructorAvailabilitySchema.methods.blockDate = function(date, reason = 'Indisponível') {
  this.specificSlots.push({
    date,
    startTime: '00:00',
    endTime: '23:59',
    isAvailable: false,
    reason
  });
  return this.save();
};

/**
 * Método para obter disponibilidade em um período
 */
instructorAvailabilitySchema.methods.getAvailabilityForPeriod = function(startDate, endDate) {
  const slots = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Normalizar para início do dia
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Normalizar para fim do dia
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Usar formato YYYY-MM-DD para comparação (ignorando timezone)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Verificar se há slot específico para esta data
    const specificSlot = this.specificSlots.find(slot => {
      const slotDate = new Date(slot.date);
      const slotYear = slotDate.getFullYear();
      const slotMonth = String(slotDate.getMonth() + 1).padStart(2, '0');
      const slotDay = String(slotDate.getDate()).padStart(2, '0');
      const slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
      return slotDateStr === dateStr;
    });
    
    if (specificSlot) {
      // Usar slot específico
      if (specificSlot.isAvailable) {
        slots.push({
          date: currentDate.toISOString(),
          startTime: specificSlot.startTime,
          endTime: specificSlot.endTime,
          type: 'specific'
        });
      }
    } else {
      // Usar disponibilidade recorrente
      const recurringSlots = this.recurringAvailability.filter(slot => 
        slot.dayOfWeek === dayOfWeek && slot.isActive
      );
      
      recurringSlots.forEach(slot => {
        slots.push({
          date: currentDate.toISOString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: 'recurring'
        });
      });
    }
    
    // Próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
};

module.exports = mongoose.model('InstructorAvailability', instructorAvailabilitySchema);

