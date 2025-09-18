require('dotenv').config();
const { cloudinary } = require('./src/config/cloudinary');

const testCloudinary = async () => {
  try {
    console.log('🔄 Testando configuração do Cloudinary...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY);
    
    // Testar configuração
    const config = cloudinary.config();
    console.log('✅ Cloudinary configurado com sucesso!');
    console.log('📊 Detalhes da configuração:');
    console.log(`   Cloud Name: ${config.cloud_name}`);
    console.log(`   API Key: ${config.api_key}`);
    console.log(`   Secure: ${config.secure || true}`);
    
    // Testar API (buscar informações da conta)
    console.log('\n🔍 Testando conexão com a API...');
    
    const result = await cloudinary.api.ping();
    console.log('✅ Ping bem-sucedido:', result.status);
    
    // Obter informações da conta
    const usage = await cloudinary.api.usage();
    console.log('✅ Informações da conta obtidas:');
    console.log(`   Plano: ${usage.plan}`);
    console.log(`   Créditos usados: ${usage.credits.used_percent}%`);
    console.log(`   Transformações este mês: ${usage.transformations.usage}`);
    console.log(`   Armazenamento usado: ${(usage.storage.used_bytes / (1024*1024)).toFixed(2)} MB`);
    
    console.log('\n🎉 Cloudinary está funcionando perfeitamente!');
    console.log('🚀 Você pode fazer upload de imagens agora!');
    
  } catch (error) {
    console.error('❌ Erro no Cloudinary:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('💡 Dica: Verifique se a API Key está correta');
    }
    
    if (error.message.includes('Invalid cloud name')) {
      console.log('💡 Dica: Verifique se o Cloud Name está correto');
    }
    
    if (error.message.includes('Invalid API secret')) {
      console.log('💡 Dica: Verifique se o API Secret está correto');
    }
    
    if (error.message.includes('Unauthorized')) {
      console.log('💡 Dica: Verifique todas as credenciais no .env');
    }
    
    process.exit(1);
  }
};

testCloudinary();
