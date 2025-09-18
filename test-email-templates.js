require('dotenv').config();
const { 
  sendAccountCreatedEmail, 
  sendAccountDeletedEmail,
  sendCustomEmail 
} = require('./src/services/emailService');

const testEmailTemplates = async () => {
  try {
    console.log('🧪 Testando novos templates de email...\n');

    // Dados de exemplo para os testes
    const testUser = {
      name: 'João Silva',
      email: 'swaply.contact@gmail.com', // Usando o email configurado
      createdAt: new Date(),
      joinDate: new Date(),
      stats: {
        coursesCompleted: 3,
        totalHours: 25
      }
    };

    // 1. Testar template de conta criada
    console.log('📧 1. Testando template de conta criada...');
    try {
      await sendAccountCreatedEmail(testUser);
      console.log('✅ Email de conta criada enviado com sucesso!');
    } catch (error) {
      console.log('❌ Erro no email de conta criada:', error.message);
    }

    // Aguardar um pouco antes do próximo email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Testar template de conta deletada
    console.log('\n📧 2. Testando template de conta deletada...');
    try {
      await sendAccountDeletedEmail(testUser);
      console.log('✅ Email de conta deletada enviado com sucesso!');
    } catch (error) {
      console.log('❌ Erro no email de conta deletada:', error.message);
    }

    // Aguardar um pouco antes do próximo email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Testar notificação entre usuários por email
    console.log('\n📧 3. Testando email de notificação entre usuários...');
    try {
      await sendCustomEmail({
        to: testUser.email,
        subject: '💬 Nova mensagem no Swaply',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💬 Nova Mensagem</h1>
              <p style="color: white; margin: 10px 0 0 0;">Você recebeu uma mensagem no Swaply</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <h2 style="color: #333; margin-bottom: 20px;">Olá, ${testUser.name}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                <strong>Maria Santos</strong> enviou uma mensagem para você:
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #333; font-style: italic; margin: 0;">
                  "Olá! Vi que você está interessado no curso de JavaScript. Tenho algumas dicas que podem te ajudar. Que tal conversarmos?"
                </p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL}/messages" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Ver Mensagem
                </a>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
              </p>
            </div>
          </div>
        `
      });
      console.log('✅ Email de notificação entre usuários enviado com sucesso!');
    } catch (error) {
      console.log('❌ Erro no email de notificação:', error.message);
    }

    console.log('\n🎉 Teste de templates concluído!');
    console.log('📬 Verifique a caixa de entrada de:', testUser.email);
    console.log('💡 Os emails podem estar na pasta SPAM se for a primeira vez');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
};

testEmailTemplates();
