const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do armazenamento temporário
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/temp';
    
    // Criar pasta se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro para tipos de arquivo
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Configurações para diferentes tipos de upload
const uploadConfigs = {
  image: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1
  },
  avatar: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1
  },
  courseImage: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1
  },
  document: {
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }
};

// Função para criar middleware de upload
const createUploadMiddleware = (configName, fieldName = 'file') => {
  const config = uploadConfigs[configName];
  
  if (!config) {
    throw new Error(`Configuração de upload não encontrada: ${configName}`);
  }

  const upload = multer({
    storage,
    fileFilter: fileFilter(config.allowedTypes),
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles
    }
  });

  return (req, res, next) => {
    const uploadHandler = config.maxFiles === 1 ? 
      upload.single(fieldName) : 
      upload.array(fieldName, config.maxFiles);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        let message = 'Erro no upload do arquivo';
        
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            message = `Arquivo muito grande. Tamanho máximo: ${(config.maxSize / (1024 * 1024)).toFixed(1)}MB`;
            break;
          case 'LIMIT_FILE_COUNT':
            message = `Muitos arquivos. Máximo permitido: ${config.maxFiles}`;
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            message = `Campo de arquivo inesperado: ${err.field}`;
            break;
        }
        
        return res.status(400).json({
          success: false,
          message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Middleware para upload de avatar
const uploadAvatar = createUploadMiddleware('avatar', 'avatar');

// Middleware para upload de imagem de curso
const uploadCourseImage = createUploadMiddleware('courseImage', 'image');

// Middleware para upload de imagem genérica
const uploadImage = createUploadMiddleware('image', 'image');

// Middleware para upload de documentos
const uploadDocument = createUploadMiddleware('document', 'documents');

// Middleware para limpeza de arquivos temporários
const cleanupTempFiles = (req, res, next) => {
  const cleanup = () => {
    const files = req.files || (req.file ? [req.file] : []);
    
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          // Erro ao deletar arquivo temporário - silencioso
        }
      }
    });
  };

  // Cleanup quando resposta é enviada
  res.on('finish', cleanup);
  res.on('close', cleanup);

  next();
};

// Middleware para validar se arquivo foi enviado
const requireFile = (fieldName = 'file') => {
  return (req, res, next) => {
    const hasFile = req.file || (req.files && req.files.length > 0);
    
    if (!hasFile) {
      return res.status(400).json({
        success: false,
        message: `Arquivo é obrigatório: ${fieldName}`
      });
    }
    
    next();
  };
};

// Middleware para validar dimensões de imagem (requer sharp)
const validateImageDimensions = (minWidth = 0, minHeight = 0, maxWidth = Infinity, maxHeight = Infinity) => {
  return async (req, res, next) => {
    try {
      const file = req.file;
      
      if (!file) {
        return next();
      }

      // Verificar se é imagem
      if (!file.mimetype.startsWith('image/')) {
        return next();
      }

      const sharp = require('sharp');
      const metadata = await sharp(file.path).metadata();

      if (metadata.width < minWidth || metadata.height < minHeight) {
        return res.status(400).json({
          success: false,
          message: `Imagem muito pequena. Dimensões mínimas: ${minWidth}x${minHeight}px`
        });
      }

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        return res.status(400).json({
          success: false,
          message: `Imagem muito grande. Dimensões máximas: ${maxWidth}x${maxHeight}px`
        });
      }

      // Adicionar metadados à requisição
      req.imageMetadata = metadata;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao processar imagem'
      });
    }
  };
};

// Função utilitária para deletar arquivo
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  uploadAvatar,
  uploadCourseImage,
  uploadImage,
  uploadDocument,
  cleanupTempFiles,
  requireFile,
  validateImageDimensions,
  deleteFile,
  uploadConfigs
};
