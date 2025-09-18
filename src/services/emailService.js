const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Configuração do transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Templates de email
const emailTemplates = {
  resetPassword: {
    subject: 'Reset de Senha - Swaply',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swaply</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Plataforma de Troca de Conhecimentos</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{name}}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no Swaply.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Para criar uma nova senha, clique no botão abaixo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Este link expira em {{expiresIn}}. Se você não solicitou a redefinição de senha, ignore este e-mail.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <a href="{{resetUrl}}" style="color: #667eea; word-break: break-all;">{{resetUrl}}</a>
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Este é um e-mail automático, não responda a esta mensagem.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  welcome: {
    subject: 'Bem-vindo ao Swaply!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao Swaply!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Sua jornada de aprendizado começa aqui</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{name}}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Seja muito bem-vindo(a) ao Swaply, a plataforma que conecta pessoas dispostas a ensinar e aprender!
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Você começou com <strong>10 créditos gratuitos</strong> para explorar nossos cursos. Cada crédito vale 1 hora de aula!
          </p>
          
          <h3 style="color: #333; margin: 30px 0 15px 0;">O que você pode fazer agora:</h3>
          
          <ul style="color: #666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>Explore nosso catálogo de cursos</li>
            <li>Agende sua primeira aula</li>
            <li>Complete seu perfil</li>
            <li>Torne-se um instrutor e ganhe créditos ensinando</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Começar Agora
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
            Precisa de ajuda? Entre em contato conosco através do suporte.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  classReminder: {
    subject: 'Lembrete: Sua aula começará em breve!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Lembrete de Aula</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Sua aula está prestes a começar!</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{studentName}}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Sua aula <strong>{{courseTitle}}</strong> com {{instructorName}} começará em {{timeUntilClass}}.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Detalhes da Aula:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Data:</strong> {{classDate}}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Horário:</strong> {{classTime}}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Duração:</strong> {{classDuration}}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Instrutor:</strong> {{instructorName}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{zoomLink}}" style="background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block; margin-right: 10px;">
              📹 Entrar na Aula
            </a>
            <a href="{{classDetailsUrl}}" style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ver Detalhes
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
            Certifique-se de ter uma conexão estável com a internet e um ambiente tranquilo para o aprendizado.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  accountCreated: {
    subject: 'Bem-vindo ao Swaply! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Conta Criada!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Bem-vindo à comunidade Swaply</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{name}}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            🎊 Parabéns! Sua conta foi criada com sucesso na plataforma Swaply!
          </p>
          
          <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 18px;">🎁 Bônus de Boas-vindas</h3>
            <p style="margin: 5px 0; color: #2e7d32; font-size: 16px;"><strong>10 créditos gratuitos</strong> para você começar!</p>
            <p style="margin: 5px 0; color: #2e7d32;">Cada crédito = 1 hora de aula 📚</p>
          </div>
          
          <h3 style="color: #333; margin: 30px 0 15px 0;">O que você pode fazer agora:</h3>
          
          <div style="margin: 20px 0;">
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">📚</span>
              <span style="color: #666;">Explorar cursos em diversas categorias</span>
            </div>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">🎯</span>
              <span style="color: #666;">Agendar sua primeira aula</span>
            </div>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">👨‍🏫</span>
              <span style="color: #666;">Tornar-se instrutor e ganhar créditos</span>
            </div>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">⭐</span>
              <span style="color: #666;">Avaliar cursos e instrutores</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Começar Agora 🚀
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">📊 Seus Dados:</h4>
            <p style="margin: 5px 0; color: #666;">Email: {{email}}</p>
            <p style="margin: 5px 0; color: #666;">Data de cadastro: {{joinDate}}</p>
            <p style="margin: 5px 0; color: #666;">Créditos iniciais: 10</p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px;">
            Dúvidas? Entre em contato conosco através do suporte ou visite nossa central de ajuda.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  accountDeleted: {
    subject: 'Conta Desativada - Swaply',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">👋 Até Logo!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Sua conta foi desativada</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{name}}</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Confirmamos que sua conta no Swaply foi desativada conforme solicitado.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📋 Resumo da Conta</h3>
            <p style="margin: 5px 0; color: #856404;">Cursos completados: {{coursesCompleted}}</p>
            <p style="margin: 5px 0; color: #856404;">Horas de aprendizado: {{totalHours}}</p>
            <p style="margin: 5px 0; color: #856404;">Data de cadastro: {{joinDate}}</p>
            <p style="margin: 5px 0; color: #856404;">Data de desativação: {{deletionDate}}</p>
          </div>
          
          <h3 style="color: #333; margin: 30px 0 15px 0;">📝 Informações Importantes:</h3>
          
          <ul style="color: #666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>Seus dados pessoais foram anonimizados</li>
            <li>O histórico de aulas foi preservado para os instrutores</li>
            <li>Avaliações permanecem ativas (anonimamente)</li>
            <li>Créditos restantes foram perdidos</li>
          </ul>
          
          <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0;">💡 Quer Voltar?</h4>
            <p style="margin: 5px 0; color: #1976d2;">Você pode criar uma nova conta a qualquer momento!</p>
            <p style="margin: 5px 0; color: #1976d2;">Teremos prazer em tê-lo(a) de volta na comunidade Swaply.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{signupUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Criar Nova Conta
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
            Obrigado por fazer parte da comunidade Swaply! 💙
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Este é um email automático de confirmação de desativação de conta.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  },

  classConfirmation: {
    subject: 'Aula Confirmada - {{courseTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Aula Confirmada!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tudo pronto para sua aula</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá, {{studentName}}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Sua aula foi confirmada! O instrutor {{instructorName}} está aguardando por você.
          </p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #155724; margin: 0 0 15px 0; font-size: 18px;">📅 Informações da Aula:</h3>
            <p style="margin: 5px 0; color: #155724;"><strong>Curso:</strong> {{courseTitle}}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Data:</strong> {{classDate}}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Horário:</strong> {{classTime}}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Duração:</strong> {{classDuration}}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Créditos utilizados:</strong> {{creditsUsed}}</p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Você receberá um lembrete 30 minutos antes da aula começar.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{calendarUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ver no Calendário
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Swaply. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `
  }
};

// Função para substituir variáveis no template
const replaceTemplateVariables = (template, data) => {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
};

// Função principal para enviar email
const sendEmail = async ({ to, subject, template, data = {}, attachments = [] }) => {
  try {
    const transporter = createTransporter();
    
    // Verificar conexão
    await transporter.verify();
    
    let htmlContent = '';
    let emailSubject = subject;
    
    // Se template foi especificado, usar template pré-definido
    if (template && emailTemplates[template]) {
      const templateData = emailTemplates[template];
      htmlContent = replaceTemplateVariables(templateData.html, data);
      emailSubject = replaceTemplateVariables(templateData.subject, data);
    } else if (data.html) {
      htmlContent = data.html;
    }
    
    const mailOptions = {
      from: `"Swaply" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailSubject,
      html: htmlContent,
      attachments
    };
    
    // Adicionar texto plano se necessário
    if (data.text) {
      mailOptions.text = data.text;
    }
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email enviado com sucesso:', {
      to,
      subject: emailSubject,
      messageId: result.messageId
    });
    
    return {
      success: true,
      messageId: result.messageId,
      to,
      subject: emailSubject
    };
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};

// Função para enviar email de boas-vindas (DEPRECIADO - usar sendAccountCreatedEmail)
const sendWelcomeEmail = async (user) => {
  return await sendAccountCreatedEmail(user);
};

// Função para enviar email de conta criada
const sendAccountCreatedEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    template: 'accountCreated',
    data: {
      name: user.name,
      email: user.email,
      joinDate: new Date(user.joinDate || user.createdAt).toLocaleDateString('pt-BR'),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
    }
  });
};

// Função para enviar email de conta deletada
const sendAccountDeletedEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    template: 'accountDeleted',
    data: {
      name: user.name,
      coursesCompleted: user.stats?.coursesCompleted || 0,
      totalHours: user.stats?.totalHours || 0,
      joinDate: new Date(user.joinDate || user.createdAt).toLocaleDateString('pt-BR'),
      deletionDate: new Date().toLocaleDateString('pt-BR'),
      signupUrl: `${process.env.FRONTEND_URL}/register`
    }
  });
};

// Função para enviar lembrete de aula
const sendClassReminder = async (classData, student, instructor) => {
  const classDateTime = new Date(classData.date);
  const [hours, minutes] = classData.time.split(':');
  classDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  const timeUntilClass = Math.ceil((classDateTime - new Date()) / (1000 * 60)); // em minutos
  const timeText = timeUntilClass <= 60 ? 
    `${timeUntilClass} minutos` : 
    `${Math.ceil(timeUntilClass / 60)} horas`;
  
  return await sendEmail({
    to: student.email,
    template: 'classReminder',
    data: {
      studentName: student.name,
      instructorName: instructor.name,
      courseTitle: classData.courseTitle || 'Aula Agendada',
      timeUntilClass: timeText,
      classDate: classDateTime.toLocaleDateString('pt-BR'),
      classTime: classData.time,
      classDuration: `${classData.duration} hora${classData.duration > 1 ? 's' : ''}`,
      zoomLink: classData.zoomLink || '#',
      classDetailsUrl: `${process.env.FRONTEND_URL}/dashboard/classes/${classData._id}`
    }
  });
};

// Função para enviar confirmação de aula
const sendClassConfirmation = async (classData, student, instructor) => {
  const classDateTime = new Date(classData.date);
  const [hours, minutes] = classData.time.split(':');
  classDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  return await sendEmail({
    to: student.email,
    template: 'classConfirmation',
    data: {
      studentName: student.name,
      instructorName: instructor.name,
      courseTitle: classData.courseTitle || 'Aula Agendada',
      classDate: classDateTime.toLocaleDateString('pt-BR'),
      classTime: classData.time,
      classDuration: `${classData.duration} hora${classData.duration > 1 ? 's' : ''}`,
      creditsUsed: classData.creditsUsed,
      calendarUrl: `${process.env.FRONTEND_URL}/dashboard/calendar`
    }
  });
};

// Função para enviar email personalizado
const sendCustomEmail = async ({ to, subject, html, text, attachments = [] }) => {
  return await sendEmail({
    to,
    subject,
    data: { html, text },
    attachments
  });
};

// Função para validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para testar configuração de email
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('Configuração de email válida');
    return true;
  } catch (error) {
    console.error('Erro na configuração de email:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAccountCreatedEmail,
  sendAccountDeletedEmail,
  sendClassReminder,
  sendClassConfirmation,
  sendCustomEmail,
  validateEmail,
  testEmailConfiguration,
  emailTemplates
};
