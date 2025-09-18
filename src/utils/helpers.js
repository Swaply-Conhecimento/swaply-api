const crypto = require('crypto');
const moment = require('moment');

// Função para gerar ID único
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${randomStr}`.toUpperCase();
};

// Função para gerar hash
const generateHash = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

// Função para gerar token aleatório
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Função para capitalizar primeira letra
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Função para formatar nome
const formatName = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Função para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para validar telefone brasileiro
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?)\s?\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone);
};

// Função para limpar telefone (apenas números)
const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Função para formatar moeda (BRL)
const formatCurrency = (value, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(value);
};

// Função para formatar data
const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  return moment(date).format(format);
};

// Função para formatar data e hora
const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '';
  return moment(date).format(format);
};

// Função para calcular idade
const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  return moment().diff(moment(birthDate), 'years');
};

// Função para calcular diferença em dias
const daysDifference = (date1, date2) => {
  return moment(date1).diff(moment(date2), 'days');
};

// Função para verificar se data é no futuro
const isFutureDate = (date) => {
  return moment(date).isAfter(moment());
};

// Função para verificar se data é no passado
const isPastDate = (date) => {
  return moment(date).isBefore(moment());
};

// Função para obter início do dia
const startOfDay = (date = new Date()) => {
  return moment(date).startOf('day').toDate();
};

// Função para obter fim do dia
const endOfDay = (date = new Date()) => {
  return moment(date).endOf('day').toDate();
};

// Função para gerar slug
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim('-'); // Remove hífens das extremidades
};

// Função para truncar texto
const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength - suffix.length) + suffix;
};

// Função para extrair iniciais do nome
const getInitials = (name, maxInitials = 2) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

// Função para gerar cor baseada em string
const generateColorFromString = (str) => {
  if (!str) return '#000000';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = Math.abs(hash).toString(16).substring(0, 6);
  return `#${'000000'.substring(0, 6 - color.length) + color}`;
};

// Função para validar CPF
const isValidCPF = (cpf) => {
  if (!cpf) return false;
  
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

// Função para validar CNPJ
const isValidCNPJ = (cnpj) => {
  if (!cnpj) return false;
  
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  // Validação dos dígitos verificadores
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  let digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

// Função para mascarar dados sensíveis
const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return data;
  
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
};

// Função para gerar senha aleatória
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Função para calcular força da senha
const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  
  let score = 0;
  
  // Comprimento
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Caracteres
  if (/[a-z]/.test(password)) score += 1; // Minúsculas
  if (/[A-Z]/.test(password)) score += 1; // Maiúsculas
  if (/[0-9]/.test(password)) score += 1; // Números
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Especiais
  
  return Math.min(score, 5);
};

// Função para paginar array
const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit)
    }
  };
};

// Função para criar resposta padrão da API
const createApiResponse = (success = true, message = '', data = null, pagination = null) => {
  const response = {
    success,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

module.exports = {
  generateUniqueId,
  generateHash,
  generateRandomToken,
  capitalize,
  formatName,
  isValidEmail,
  isValidPhone,
  cleanPhone,
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateAge,
  daysDifference,
  isFutureDate,
  isPastDate,
  startOfDay,
  endOfDay,
  generateSlug,
  truncateText,
  getInitials,
  generateColorFromString,
  isValidCPF,
  isValidCNPJ,
  maskSensitiveData,
  generateRandomPassword,
  calculatePasswordStrength,
  paginateArray,
  createApiResponse
};
