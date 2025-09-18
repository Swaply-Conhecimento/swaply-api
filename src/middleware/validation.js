const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Middleware para validar ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `ID inválido: ${paramName}`
      });
    }
    
    next();
  };
};

// Middleware para validar múltiplos ObjectIds
const validateObjectIds = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `ID inválido: ${paramName}`
        });
      }
    }
    
    next();
  };
};

// Middleware para sanitizar dados de entrada
const sanitizeInput = (req, res, next) => {
  // Remover campos vazios de strings
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        if (obj[key] === '') {
          delete obj[key];
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        sanitizeObject(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].filter(item => {
          if (typeof item === 'string') {
            return item.trim() !== '';
          }
          return true;
        }).map(item => {
          if (typeof item === 'string') {
            return item.trim();
          }
          return item;
        });
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

// Middleware para validar paginação
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Limitar valores máximos
  if (page < 1) {
    req.query.page = 1;
  } else if (page > 1000) {
    req.query.page = 1000;
  } else {
    req.query.page = page;
  }

  if (limit < 1) {
    req.query.limit = 1;
  } else if (limit > 100) {
    req.query.limit = 100;
  } else {
    req.query.limit = limit;
  }

  next();
};

// Middleware para validar filtros de busca
const validateSearchFilters = (req, res, next) => {
  const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'title', 'rating', 'price', 'date'];
  const allowedSortOrders = ['asc', 'desc', '1', '-1'];

  // Validar campo de ordenação
  if (req.query.sortBy && !allowedSortFields.includes(req.query.sortBy)) {
    return res.status(400).json({
      success: false,
      message: `Campo de ordenação inválido. Campos permitidos: ${allowedSortFields.join(', ')}`
    });
  }

  // Validar ordem de ordenação
  if (req.query.sortOrder && !allowedSortOrders.includes(req.query.sortOrder)) {
    return res.status(400).json({
      success: false,
      message: `Ordem de ordenação inválida. Valores permitidos: ${allowedSortOrders.join(', ')}`
    });
  }

  // Normalizar ordem de ordenação
  if (req.query.sortOrder === '1') req.query.sortOrder = 'asc';
  if (req.query.sortOrder === '-1') req.query.sortOrder = 'desc';

  next();
};

// Middleware para validar data
const validateDate = (fieldName, required = false) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName] || req.query[fieldName];

    if (!dateValue && required) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} é obrigatório`
      });
    }

    if (dateValue) {
      const date = new Date(dateValue);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} deve ser uma data válida`
        });
      }

      // Armazenar data normalizada
      if (req.body[fieldName]) {
        req.body[fieldName] = date;
      }
      if (req.query[fieldName]) {
        req.query[fieldName] = date;
      }
    }

    next();
  };
};

// Middleware para validar horário (HH:MM)
const validateTime = (fieldName, required = false) => {
  return (req, res, next) => {
    const timeValue = req.body[fieldName] || req.query[fieldName];

    if (!timeValue && required) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} é obrigatório`
      });
    }

    if (timeValue) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(timeValue)) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} deve estar no formato HH:MM`
        });
      }
    }

    next();
  };
};

// Middleware para validar enum
const validateEnum = (fieldName, allowedValues, required = false) => {
  return (req, res, next) => {
    const value = req.body[fieldName] || req.query[fieldName];

    if (!value && required) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} é obrigatório`
      });
    }

    if (value && !allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} deve ser um dos valores: ${allowedValues.join(', ')}`
      });
    }

    next();
  };
};

// Middleware para validar array
const validateArray = (fieldName, minLength = 0, maxLength = Infinity, required = false) => {
  return (req, res, next) => {
    const arrayValue = req.body[fieldName];

    if (!arrayValue && required) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} é obrigatório`
      });
    }

    if (arrayValue) {
      if (!Array.isArray(arrayValue)) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} deve ser um array`
        });
      }

      if (arrayValue.length < minLength) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} deve ter pelo menos ${minLength} item${minLength > 1 ? 's' : ''}`
        });
      }

      if (arrayValue.length > maxLength) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} pode ter no máximo ${maxLength} item${maxLength > 1 ? 's' : ''}`
        });
      }
    }

    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateObjectIds,
  sanitizeInput,
  validatePagination,
  validateSearchFilters,
  validateDate,
  validateTime,
  validateEnum,
  validateArray
};
