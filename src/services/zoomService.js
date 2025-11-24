const axios = require('axios');
const jwt = require('jsonwebtoken');

class ZoomService {
  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY;
    this.apiSecret = process.env.ZOOM_API_SECRET;
    this.baseUrl = 'https://api.zoom.us/v2';
  }

  // Gerar JWT token para autenticação
  generateJWT() {
    const payload = {
      iss: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    };

    return jwt.sign(payload, this.apiSecret);
  }

  // Configurar headers para requisições
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.generateJWT()}`,
      'Content-Type': 'application/json'
    };
  }

  // Criar meeting
  async createMeeting(meetingData) {
    try {
      const {
        topic,
        type = 2, // Scheduled meeting
        start_time,
        duration = 60,
        timezone = 'America/Sao_Paulo',
        password,
        agenda,
        settings = {}
      } = meetingData;

      const defaultSettings = {
        host_video: true,
        participant_video: true,
        cn_meeting: false,
        in_meeting: false,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0,
        audio: 'both',
        auto_recording: 'none',
        enforce_login: false,
        registrants_confirmation_email: true,
        waiting_room: true,
        allow_multiple_devices: false,
        ...settings
      };

      const meetingPayload = {
        topic,
        type,
        start_time,
        duration,
        timezone,
        password,
        agenda,
        settings: defaultSettings
      };

      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        meetingPayload,
        { headers: this.getHeaders() }
      );

      const meeting = response.data;

      return {
        success: true,
        data: {
          id: meeting.id,
          topic: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          timezone: meeting.timezone,
          join_url: meeting.join_url,
          start_url: meeting.start_url,
          password: meeting.password,
          h323_password: meeting.h323_password,
          pstn_password: meeting.pstn_password,
          encrypted_password: meeting.encrypted_password,
          settings: meeting.settings
        }
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao criar reunião no Zoom'
      );
    }
  }

  // Obter informações de um meeting
  async getMeeting(meetingId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao obter reunião do Zoom'
      );
    }
  }

  // Atualizar meeting
  async updateMeeting(meetingId, updateData) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/meetings/${meetingId}`,
        updateData,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        message: 'Meeting atualizado com sucesso'
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao atualizar reunião no Zoom'
      );
    }
  }

  // Deletar meeting
  async deleteMeeting(meetingId) {
    try {
      await axios.delete(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        message: 'Meeting deletado com sucesso'
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao deletar reunião no Zoom'
      );
    }
  }

  // Listar meetings do usuário
  async listMeetings(type = 'scheduled', pageSize = 30, pageNumber = 1) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me/meetings`,
        {
          headers: this.getHeaders(),
          params: {
            type,
            page_size: pageSize,
            page_number: pageNumber
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao listar reuniões do Zoom'
      );
    }
  }

  // Obter gravações de um meeting
  async getMeetingRecordings(meetingId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}/recordings`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      // Se não há gravações, retornar array vazio
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            recording_files: []
          }
        };
      }
      
      throw new Error(
        error.response?.data?.message || 
        'Erro ao obter gravações do Zoom'
      );
    }
  }

  // Criar meeting para aula
  async createClassMeeting(classData, instructor, course) {
    try {
      const classDateTime = new Date(classData.date);
      const [hours, minutes] = classData.time.split(':');
      classDateTime.setHours(parseInt(hours), parseInt(minutes));

      const meetingData = {
        topic: `${course.title} - Aula com ${instructor.name}`,
        type: 2, // Scheduled meeting
        start_time: classDateTime.toISOString(),
        duration: classData.duration * 60, // converter para minutos
        timezone: 'America/Sao_Paulo',
        password: this.generateMeetingPassword(),
        agenda: `Aula do curso "${course.title}" ministrada por ${instructor.name}`,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          audio: 'both',
          auto_recording: 'cloud', // Gravar na nuvem
          enforce_login: false,
          registrants_confirmation_email: false,
          waiting_room: true,
          allow_multiple_devices: false
        }
      };

      const meeting = await this.createMeeting(meetingData);

      return {
        success: true,
        data: {
          meetingId: meeting.data.id,
          joinUrl: meeting.data.join_url,
          startUrl: meeting.data.start_url,
          password: meeting.data.password
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Gerar senha aleatória para meeting
  generateMeetingPassword(length = 6) {
    const charset = '123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Criar meeting recorrente para curso
  async createRecurringMeeting(courseData, instructor) {
    try {
      const meetingData = {
        topic: `${courseData.title} - Curso com ${instructor.name}`,
        type: 8, // Recurring meeting with fixed time
        start_time: new Date().toISOString(),
        duration: 60, // duração padrão
        timezone: 'America/Sao_Paulo',
        password: this.generateMeetingPassword(),
        agenda: `Curso "${courseData.title}" ministrado por ${instructor.name}`,
        recurrence: {
          type: 2, // Weekly
          repeat_interval: 1,
          weekly_days: '2,4', // Segunda e Quarta (1=Domingo, 2=Segunda...)
          end_times: 10 // Número de ocorrências
        },
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          audio: 'both',
          auto_recording: 'cloud',
          enforce_login: false,
          registrants_confirmation_email: false,
          waiting_room: true,
          allow_multiple_devices: false
        }
      };

      const meeting = await this.createMeeting(meetingData);

      return {
        success: true,
        data: {
          meetingId: meeting.data.id,
          joinUrl: meeting.data.join_url,
          startUrl: meeting.data.start_url,
          password: meeting.data.password
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Verificar status da API
  async checkApiStatus() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        status: 'connected',
        user: response.data
      };

    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Obter link de convite personalizado
  getInviteLink(joinUrl, meetingId, password) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/join-class?meeting=${meetingId}&pwd=${password}&zoom=${encodeURIComponent(joinUrl)}`;
  }

  // Formatar informações do meeting para resposta
  formatMeetingInfo(meetingData) {
    return {
      id: meetingData.id,
      topic: meetingData.topic,
      startTime: meetingData.start_time,
      duration: meetingData.duration,
      timezone: meetingData.timezone,
      joinUrl: meetingData.join_url,
      password: meetingData.password,
      status: meetingData.status
    };
  }
}

// Instância singleton
const zoomService = new ZoomService();

// Funções de conveniência
const createMeeting = (meetingData) => zoomService.createMeeting(meetingData);
const getMeeting = (meetingId) => zoomService.getMeeting(meetingId);
const updateMeeting = (meetingId, updateData) => zoomService.updateMeeting(meetingId, updateData);
const deleteMeeting = (meetingId) => zoomService.deleteMeeting(meetingId);
const listMeetings = (type, pageSize, pageNumber) => zoomService.listMeetings(type, pageSize, pageNumber);
const getMeetingRecordings = (meetingId) => zoomService.getMeetingRecordings(meetingId);
const createClassMeeting = (classData, instructor, course) => zoomService.createClassMeeting(classData, instructor, course);
const createRecurringMeeting = (courseData, instructor) => zoomService.createRecurringMeeting(courseData, instructor);
const checkApiStatus = () => zoomService.checkApiStatus();

module.exports = {
  ZoomService,
  zoomService,
  createMeeting,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  listMeetings,
  getMeetingRecordings,
  createClassMeeting,
  createRecurringMeeting,
  checkApiStatus
};
