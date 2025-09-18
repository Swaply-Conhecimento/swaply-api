const cloudinary = require('cloudinary').v2;

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Função para upload de imagem
const uploadImage = async (filePath, folder = 'swaply') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });
    
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    throw new Error(`Erro no upload da imagem: ${error.message}`);
  }
};

// Função para upload de avatar
const uploadAvatar = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'swaply/avatars',
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });
    
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    throw new Error(`Erro no upload do avatar: ${error.message}`);
  }
};

// Função para deletar imagem
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Erro ao deletar imagem: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadAvatar,
  deleteImage
};
