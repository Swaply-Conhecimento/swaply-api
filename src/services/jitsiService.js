const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class JitsiService {
  constructor() {
    this.appId = process.env.JITSI_APP_ID || 'vpaas-magic-cookie-92f6a20f50ca4b35a59461e87c851d63';
    this.apiKey = process.env.JITSI_API_KEY || 'vpaas-magic-cookie-92f6a20f50ca4b35a59461e87c851d63/863847';
    this.privateKey = this.loadPrivateKey();
    this.baseUrl = '8x8.vc';
  }

  /**
   * Carregar chave privada do arquivo ou variável de ambiente
   */
  loadPrivateKey() {
    // Tentar carregar da variável de ambiente primeiro
    if (process.env.JITSI_PRIVATE_KEY) {
      return process.env.JITSI_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    // Tentar carregar de arquivo
    const keyPath = path.join(__dirname, '../../config/jitsi-private-key.pem');
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }

    // Se não encontrar, usar uma chave de exemplo (APENAS PARA DESENVOLVIMENTO)
    console.warn('⚠️  AVISO: Usando chave privada de exemplo. Configure JITSI_PRIVATE_KEY em produção!');
    return `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j7A1U3W+KXWF9j8KcwQge6rODbdJ0fDKE8k
-----END PRIVATE KEY-----`;
  }

  /**
   * Gerar JWT token para sala Jitsi
   */
  generateToken({ userId, userName, userEmail, userAvatar, roomName, moderator = false }) {
    const now = new Date();
    // Token válido por 3 horas (calculado de forma segura)
    const exp = Math.round((now.getTime() + (3 * 60 * 60 * 1000)) / 1000);
    // Válido desde 10 segundos atrás (para evitar problemas de sincronização de relógio)
    const nbf = Math.round(now.getTime() / 1000) - 10;

    const payload = {
      aud: 'jitsi',
      context: {
        user: {
          id: userId || uuidv4(),
          name: userName,
          avatar: userAvatar || '',
          email: userEmail || '',
          moderator: moderator ? 'true' : 'false'
        },
        features: {
          livestreaming: moderator ? 'true' : 'false',
          recording: moderator ? 'true' : 'false',
          transcription: 'true',
          'outbound-call': 'false'
        }
      },
      iss: 'chat',
      room: roomName || '*',
      sub: this.appId,
      exp,
      nbf
    };

    try {
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        header: {
          kid: this.apiKey,
          typ: 'JWT',
          alg: 'RS256'
        }
      });

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Token Jitsi gerado com sucesso:', {
          roomName,
          moderator,
          exp: new Date(exp * 1000).toISOString(),
          tokenLength: token.length
        });
      }

      return token;
    } catch (error) {
      console.error('❌ Erro ao gerar token Jitsi:', error);
      console.error('Detalhes:', {
        hasPrivateKey: !!this.privateKey,
        appId: this.appId,
        apiKey: this.apiKey ? 'configurado' : 'não configurado'
      });
      throw new Error('Erro ao gerar token de autenticação para reunião');
    }
  }

  /**
   * Criar sala de reunião para aula
   */
  async createClassMeeting(classData, instructor, course, student) {
    try {
      // Gerar nome único para a sala baseado na aula
      const classDateTime = new Date(classData.date);
      const [hours, minutes] = classData.time.split(':');
      classDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const roomName = this.generateRoomName(course._id, classDateTime);
      
      // Gerar tokens para instrutor (moderador) e estudante
      const instructorToken = this.generateToken({
        userId: instructor._id.toString(),
        userName: instructor.name,
        userEmail: instructor.email,
        userAvatar: instructor.avatar,
        roomName,
        moderator: true
      });

      const studentToken = this.generateToken({
        userId: student._id.toString(),
        userName: student.name,
        userEmail: student.email,
        userAvatar: student.avatar,
        roomName,
        moderator: false
      });

      // Construir URLs de acesso
      const instructorUrl = this.buildMeetingUrl(roomName, instructorToken);
      const studentUrl = this.buildMeetingUrl(roomName, studentToken);

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Sala Jitsi criada:', {
          roomName,
          instructorUrl: instructorUrl.substring(0, 80) + '...',
          studentUrl: studentUrl.substring(0, 80) + '...',
          course: course.title
        });
      }

      return {
        success: true,
        data: {
          roomName,
          instructorUrl,
          studentUrl,
          instructorToken,
          studentToken,
          startTime: classDateTime.toISOString(),
          duration: classData.duration,
          meetingInfo: {
            title: `${course.title} - Aula com ${instructor.name}`,
            description: `Aula do curso "${course.title}"`,
            instructor: {
              name: instructor.name,
              email: instructor.email
            },
            student: {
              name: student.name,
              email: student.email
            }
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar reunião Jitsi:', error);
      console.error('Stack trace:', error.stack);
      throw new Error('Erro ao criar sala de reunião');
    }
  }

  /**
   * Gerar nome único para sala
   */
  generateRoomName(courseId, date) {
    const timestamp = date.getTime();
    const random = Math.random().toString(36).substring(7);
    return `swaply-${courseId}-${timestamp}-${random}`;
  }

  /**
   * Construir URL da reunião
   * Formato para Jitsi JaaS: https://8x8.vc/{appId}/{roomName}?jwt={token}
   * Mantido formato original que estava funcionando
   */
  buildMeetingUrl(roomName, token) {
    return `https://${this.baseUrl}/${this.appId}/${roomName}?jwt=${token}`;
  }

  /**
   * Gerar token de acesso para participante adicional
   */
  generateParticipantToken(userId, userName, userEmail, userAvatar, roomName, moderator = false) {
    return this.generateToken({
      userId,
      userName,
      userEmail,
      userAvatar,
      roomName,
      moderator
    });
  }

  /**
   * Obter informações da sala (para frontend)
   */
  getRoomInfo(roomName) {
    return {
      roomName,
      domain: this.baseUrl,
      appId: this.appId,
      // Não retornar chave privada ou API key completa
      configured: !!this.privateKey
    };
  }

  /**
   * Validar se a configuração está correta
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Em desenvolvimento, valores de exemplo são apenas avisos
    // Em produção, são erros
    if (!this.appId) {
      if (isProduction) {
        errors.push('JITSI_APP_ID não configurado');
      } else {
        warnings.push('JITSI_APP_ID não configurado');
      }
    } else if (this.appId === 'vpaas-magic-cookie-92f6a20f50ca4b35a59461e87c851d63') {
      if (isProduction) {
        errors.push('JITSI_APP_ID está usando valor de exemplo (não funcionará em produção)');
      } else {
        warnings.push('JITSI_APP_ID está usando valor de exemplo');
      }
    }

    if (!this.apiKey) {
      if (isProduction) {
        errors.push('JITSI_API_KEY não configurado');
      } else {
        warnings.push('JITSI_API_KEY não configurado');
      }
    } else if (this.apiKey === 'vpaas-magic-cookie-92f6a20f50ca4b35a59461e87c851d63/863847') {
      if (isProduction) {
        errors.push('JITSI_API_KEY está usando valor de exemplo (não funcionará em produção)');
      } else {
        warnings.push('JITSI_API_KEY está usando valor de exemplo');
      }
    }

    // Verificar se a chave privada é válida
    if (!this.privateKey) {
      if (isProduction) {
        errors.push('JITSI_PRIVATE_KEY não configurado');
      } else {
        warnings.push('JITSI_PRIVATE_KEY não configurado');
      }
    } else if (this.privateKey.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj')) {
      if (isProduction) {
        errors.push('JITSI_PRIVATE_KEY está usando chave de exemplo (não funcionará em produção)');
      } else {
        warnings.push('JITSI_PRIVATE_KEY está usando chave de exemplo');
      }
    } else if (!this.privateKey.includes('BEGIN PRIVATE KEY') && !this.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      warnings.push('JITSI_PRIVATE_KEY pode estar em formato incorreto');
    }

    // Verificar formato do appId e apiKey (apenas avisos)
    if (this.appId && !this.appId.includes('vpaas-magic-cookie')) {
      warnings.push('JITSI_APP_ID não parece ser um formato válido de Jitsi JaaS');
    }

    if (this.apiKey && !this.apiKey.includes('/')) {
      warnings.push('JITSI_API_KEY deve incluir o appId e o ID separados por "/"');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Verificar status da configuração
   */
  async checkStatus() {
    const validation = this.validateConfiguration();
    
    return {
      success: validation.valid,
      status: validation.valid ? 'configured' : 'not_configured',
      service: 'Jitsi Meet (JaaS)',
      appId: this.appId,
      domain: this.baseUrl,
      ...validation
    };
  }

  /**
   * Gerar link de convite personalizado (para emails)
   */
  generateInviteLink(roomName, token, meetingInfo) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const meetingUrl = this.buildMeetingUrl(roomName, token);
    
    return {
      directLink: meetingUrl,
      customLink: `${frontendUrl}/join-class?room=${roomName}&token=${token}`,
      meetingInfo: {
        title: meetingInfo.title,
        startTime: meetingInfo.startTime,
        duration: meetingInfo.duration
      }
    };
  }
}

// Instância singleton
const jitsiService = new JitsiService();

module.exports = {
  JitsiService,
  jitsiService
};

