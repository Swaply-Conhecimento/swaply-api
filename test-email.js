require('dotenv').config();
const { testEmailConfiguration, sendCustomEmail } = require('./src/services/emailService');

const testEmail = async () => {
  try {
    console.log('🔄 Testando configuração de email...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass:', process.env.EMAIL_PASS ? '***configurado***' : '❌ não configurado');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Credenciais de email não configuradas no .env');
      console.log('💡 Configure EMAIL_USER e EMAIL_PASS no arquivo .env');
      return;
    }
    
    // Testar configuração
    console.log('\n🔍 Testando conexão SMTP...');
    const isValid = await testEmailConfiguration();
    
    if (isValid) {
      console.log('✅ Conexão SMTP válida!');
      
      // Enviar email de teste
      console.log('\n📧 Enviando email de teste...');
      await sendCustomEmail({
        to: process.env.EMAIL_USER, // Enviar para o próprio email
        subject: 'Teste - Swaply API',
        html: `
          <h2>🎉 Email Configurado com Sucesso!</h2>
          <p>Se você está recebendo este email, significa que o sistema de emails da Swaply API está funcionando perfeitamente!</p>
          <hr>
          <p><strong>Configurações:</strong></p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>User: ${process.env.EMAIL_USER}</li>
          </ul>
          <hr>
          <p>Agora você pode usar:</p>
          <ul>
            <li>✅ Reset de senha por email</li>
            <li>✅ Lembretes de aula</li>
            <li>✅ Confirmações de matrícula</li>
            <li>✅ Notificações por email</li>
          </ul>
          <p><em>Este é um email de teste automático da Swaply API.</em></p>
        `,
        text: 'Email de teste da Swaply API - Sistema funcionando!'
      });
      
      console.log('✅ Email de teste enviado com sucesso!');
      console.log('📬 Verifique sua caixa de entrada (e spam)');
      console.log('\n🎉 Sistema de emails configurado e funcionando!');
      
    } else {
      console.log('❌ Falha na conexão SMTP');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de email:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 Dica: Verifique se a senha de app está correta');
      console.log('💡 Certifique-se que a verificação em 2 etapas está ativa');
    }
    
    if (error.message.includes('EAUTH')) {
      console.log('💡 Dica: Problema de autenticação');
      console.log('💡 Verifique EMAIL_USER e EMAIL_PASS no .env');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Dica: Problema de conexão');
      console.log('💡 Verifique EMAIL_HOST no .env');
    }
  }
};

testEmail();
