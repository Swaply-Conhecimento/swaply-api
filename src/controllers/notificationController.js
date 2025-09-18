const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/notifications - Listar notificações do usuário com filtros e paginação
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status = 'all', // 'all', 'unread', 'read'
      type = 'all',   // 'all', 'class', 'course', 'credit', 'system'
      sort = 'desc'   // 'asc', 'desc'
    } = req.query;

    // Construir filtro
    const filter = { userId };

    // Filtro por status
    if (status === 'unread') {
      filter.isRead = false;
    } else if (status === 'read') {
      filter.isRead = true;
    }

    // Filtro por tipo
    if (type !== 'all') {
      const typeMap = {
        'class': ['class_reminder', 'class_cancelled', 'class_scheduled'],
        'course': ['new_course', 'course_update'],
        'credit': ['credit_earned', 'credit_spent'],
        'system': ['system', 'new_student', 'instructor_message']
      };
      
      if (typeMap[type]) {
        filter.type = { $in: typeMap[type] };
      }
    }

    // Configurar paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Buscar notificações
    const notifications = await Notification.find(filter)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Contar total
    const total = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Contar não lidas
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações'
    });
  }
};

// GET /api/notifications/recent - Buscar notificações recentes para o dropdown
const getRecentNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações recentes'
    });
  }
};

// GET /api/notifications/unread-count - Contar notificações não lidas
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao contar notificações não lidas'
    });
  }
};

// PUT /api/notifications/:id/read - Marcar notificação específica como lida
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, updatedAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificação como lida'
    });
  }
};

// PUT /api/notifications/mark-all-read - Marcar todas as notificações como lidas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notificações marcadas como lidas`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar todas as notificações como lidas'
    });
  }
};

// DELETE /api/notifications/:id - Excluir notificação específica
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação excluída com sucesso'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir notificação'
    });
  }
};

// DELETE /api/notifications/clear-all - Excluir todas as notificações lidas
const clearAllRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      userId,
      isRead: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notificações excluídas`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar notificações'
    });
  }
};

// POST /api/notifications - Criar nova notificação (para sistema interno)
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      data = {}
    } = req.body;

    // Validar dados obrigatórios
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title e message são obrigatórios'
      });
    }

    // Validar tipo
    const validTypes = [
      'class_reminder', 'class_cancelled', 'class_scheduled',
      'new_course', 'course_update',
      'credit_earned', 'credit_spent',
      'new_student', 'instructor_message', 'system'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de notificação inválido'
      });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar notificação'
    });
  }
};

module.exports = {
  getNotifications,
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
  createNotification
};