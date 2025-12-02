const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const { PAYMENT_TYPES, PAYMENT_STATUS } = require('../utils/constants');

class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.creditPrice = 5.00; // R$ 5,00 por crédito
  }

  // Criar Payment Intent no Stripe
  async createPaymentIntent(amount, currency = 'brl', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      };

    } catch (error) {
      throw new Error(`Erro no pagamento: ${error.message}`);
    }
  }

  // Confirmar pagamento
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status,
        data: paymentIntent
      };

    } catch (error) {
      throw new Error(`Erro ao confirmar pagamento: ${error.message}`);
    }
  }

  // Processar compra de créditos
  async purchaseCredits(userId, credits, paymentMethod = 'stripe', paymentIntentId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const amount = credits * this.creditPrice;
      
      // Criar registro de pagamento
      const payment = new Payment({
        userId,
        type: PAYMENT_TYPES.CREDIT_PURCHASE,
        amount,
        credits,
        description: `Compra de ${credits} crédito${credits > 1 ? 's' : ''}`,
        paymentMethod,
        stripePaymentIntentId: paymentIntentId,
        status: PAYMENT_STATUS.PENDING
      });

      await payment.save();

      // Se é pagamento Stripe, criar Payment Intent
      if (paymentMethod === 'stripe') {
        const paymentIntent = await this.createPaymentIntent(amount, 'brl', {
          userId: userId.toString(),
          paymentId: payment._id.toString(),
          credits: credits.toString(),
          type: 'credit_purchase'
        });

        payment.stripePaymentIntentId = paymentIntent.data.paymentIntentId;
        await payment.save();

        return {
          success: true,
          data: {
            payment,
            clientSecret: paymentIntent.data.clientSecret,
            paymentIntentId: paymentIntent.data.paymentIntentId
          }
        };
      }

      // Para outros métodos de pagamento, processar imediatamente
      await payment.process();

      return {
        success: true,
        data: { payment }
      };

    } catch (error) {
      throw error;
    }
  }

  // Processar gasto de créditos
  async spendCredits(userId, credits, description, courseId = null, classId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.credits < credits) {
        throw new Error('Créditos insuficientes');
      }

      // Criar payment com status pending para poder processar
      const payment = new Payment({
        userId,
        type: PAYMENT_TYPES.CREDIT_SPENT,
        amount: 0, // Não há valor monetário para gasto interno
        credits,
        description,
        courseId,
        classId,
        paymentMethod: 'internal',
        status: PAYMENT_STATUS.PENDING
      });

      await payment.save();
      await payment.process(); // Isso vai atualizar para completed e deduzir créditos

      return {
        success: true,
        data: { payment }
      };

    } catch (error) {
      throw error;
    }
  }

  // Processar ganho de créditos (instrutor)
  async earnCredits(userId, credits, description, courseId = null, classId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Criar payment com status pending para poder processar
      const payment = new Payment({
        userId,
        type: PAYMENT_TYPES.CREDIT_EARNED,
        amount: 0, // Não há valor monetário para ganho interno
        credits,
        description,
        courseId,
        classId,
        paymentMethod: 'internal',
        status: PAYMENT_STATUS.PENDING
      });

      await payment.save();
      await payment.process(); // Isso vai atualizar para completed e adicionar créditos

      return {
        success: true,
        data: { payment }
      };

    } catch (error) {
      throw error;
    }
  }

  // Processar reembolso
  async processRefund(paymentId, amount = null, reason = 'Solicitação do usuário') {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      if (payment.status !== PAYMENT_STATUS.COMPLETED) {
        throw new Error('Apenas pagamentos completados podem ser reembolsados');
      }

      let stripeRefund = null;

      // Se foi pago via Stripe, processar reembolso no Stripe
      if (payment.stripePaymentIntentId) {
        const refundAmount = amount ? Math.round(amount * 100) : undefined;
        
        stripeRefund = await this.stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: {
            original_payment_id: payment._id.toString(),
            reason
          }
        });
      }

      // Criar transação de reembolso
      const refundPayment = await payment.refund(amount);

      return {
        success: true,
        data: {
          refund: refundPayment,
          stripeRefund
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Webhook do Stripe
  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object);
          break;
        
        default:
          // Evento não tratado
      }

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  // Processar pagamento bem-sucedido
  async handlePaymentSucceeded(paymentIntent) {
    try {
      const payment = await Payment.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!payment) {
        return;
      }

      if (payment.status === PAYMENT_STATUS.COMPLETED) {
        return;
      }

      await payment.process();

      // Enviar notificação de sucesso
      const Notification = require('../models/Notification');
      await Notification.createCreditNotification(
        payment.userId,
        payment.type,
        payment.credits,
        payment.description
      );

    } catch (error) {
      // Erro ao processar pagamento bem-sucedido - silencioso
    }
  }

  // Processar pagamento falhado
  async handlePaymentFailed(paymentIntent) {
    try {
      const payment = await Payment.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!payment) {
        return;
      }

      await payment.fail('Pagamento recusado pelo banco');

    } catch (error) {
      // Erro ao processar pagamento falhado - silencioso
    }
  }

  // Processar disputa de cobrança
  async handleChargeDispute(dispute) {
    try {
      // Aqui você pode implementar lógica para lidar com disputas
      // Como notificar administradores, suspender serviços, etc.

    } catch (error) {
      // Erro ao processar disputa - silencioso
    }
  }

  // Obter histórico de pagamentos
  async getPaymentHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type = null,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      const query = { userId };

      if (type) query.type = type;
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const total = await Payment.countDocuments(query);
      const payments = await Payment.find(query)
        .populate('courseId', 'title')
        .populate('classId', 'title date time')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        success: true,
        data: {
          payments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Obter resumo financeiro
  async getFinancialSummary(userId, startDate = null, endDate = null) {
    try {
      const summary = await Payment.getUserSummary(userId, startDate, endDate);
      
      const user = await User.findById(userId);
      
      return {
        success: true,
        data: {
          currentCredits: user.credits,
          summary,
          totalSpent: summary.credit_purchase.totalAmount,
          totalEarned: summary.credit_earned.totalCredits,
          totalUsed: summary.credit_spent.totalCredits
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Validar webhook do Stripe
  validateStripeWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      return event;

    } catch (error) {
      throw new Error('Webhook inválido');
    }
  }

  // Calcular preço total
  calculateTotalPrice(credits) {
    return credits * this.creditPrice;
  }

  // Obter taxas de conversão (para futuras implementações)
  getCreditPrice() {
    return this.creditPrice;
  }
}

// Instância singleton
const paymentService = new PaymentService();

module.exports = {
  PaymentService,
  paymentService
};
