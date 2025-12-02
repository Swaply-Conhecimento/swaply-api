const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sendEmail, sendAccountCreatedEmail, sendPlatformReviewEmail } = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

// Registrar usuário
const register = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password, confirmPassword } = req.body;

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já está em uso'
      });
    }

    // Criar usuário
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Enviar email de boas-vindas e link para avaliação da plataforma
    try {
      await sendAccountCreatedEmail(user);
      await sendPlatformReviewEmail(user);
    } catch (emailError) {
      // Não falha o registro se o email não funcionar
    }

    // Criar notificação in-app para avaliação da plataforma (não bloqueante)
    try {
      await NotificationService.createSystemNotification(
        user._id,
        'Avalie a plataforma',
        'Conte para nós como está sendo sua experiência com o Swaply.',
        {
          url: '/feedback/plataforma',
          action: 'open_platform_review'
        }
      );
    } catch (notificationError) {
      // Notificação falhou, mas não deve impedir o cadastro
    }

    // Gerar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remover senha da resposta
    const userResponse = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário com senha
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remover senha da resposta
    const userResponse = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Login com Google (callback)
const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Gerar tokens
    const token = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);

    // Redirecionar para frontend com tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refresh=${refreshToken}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// Solicitar reset de senha
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutos

    await user.save();

    // Enviar email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset de Senha - Swaply',
        template: 'resetPassword',
        data: {
          name: user.name,
          resetUrl,
          expiresIn: '10 minutos'
        }
      });

      res.json({
        success: true,
        message: 'E-mail de reset enviado com sucesso'
      });
    } catch (emailError) {
      // Limpar token se email falhar
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: 'Erro ao enviar e-mail de reset'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Resetar senha
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    // Hash do token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuário com token válido
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Atualizar senha
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Senha resetada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Renovar token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token não fornecido'
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(token);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novos tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido'
    });
  }
};

// Verificar token
const verifyToken = async (req, res) => {
  try {
    // Se chegou até aqui, o token é válido (middleware de auth)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const userResponse = req.user.getPublicProfile();

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', {
      userId: req.user?._id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Em uma implementação mais robusta, você manteria uma blacklist de tokens
    // Por enquanto, apenas retorna sucesso
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  register,
  login,
  googleCallback,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyToken,
  logout
};
