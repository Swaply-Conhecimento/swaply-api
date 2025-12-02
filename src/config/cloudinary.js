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

// Função para extrair public_id de uma URL do Cloudinary
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // URL do Cloudinary tem formato:
    // https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    // ou
    // https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{ext}
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Encontrar o índice de 'upload'
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Pegar tudo após 'upload' (pode ter 'v{version}' ou ir direto para o folder)
    const afterUpload = pathParts.slice(uploadIndex + 1);
    
    // Se o primeiro elemento após 'upload' começa com 'v', é a versão, então pular
    let startIndex = 0;
    if (afterUpload[0] && afterUpload[0].startsWith('v')) {
      startIndex = 1;
    }
    
    // Juntar o resto (folder + public_id) e remover a extensão
    const folderAndId = afterUpload.slice(startIndex).join('/');
    const publicId = folderAndId.replace(/\.[^/.]+$/, ''); // Remove extensão
    
    return publicId;
  } catch (error) {
    console.warn('Erro ao extrair public_id da URL:', error.message);
    return null;
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
  deleteImage,
  extractPublicIdFromUrl
};
