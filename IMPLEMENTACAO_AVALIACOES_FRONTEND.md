# Documentação: Implementação de Avaliações no Frontend

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Avaliação da Plataforma](#avaliação-da-plataforma)
3. [Avaliação de Curso/Instrutor](#avaliação-de-cursoinstrutor)
4. [Estrutura de Componentes](#estrutura-de-componentes)
5. [Integração com API](#integração-com-api)
6. [Tratamento de Notificações](#tratamento-de-notificações)
7. [Boas Práticas](#boas-práticas)
8. [Exemplos de Código](#exemplos-de-código)

---

## 🎯 Visão Geral

O sistema implementa duas funcionalidades de avaliação:

1. **Avaliação da Plataforma**: Enviada automaticamente após criação de conta
2. **Avaliação de Curso/Instrutor**: Enviada após agendamento/comprar aula

Ambas utilizam:
- **Notificações in-app** (via sistema de notificações existente)
- **E-mails** com links diretos
- **Endpoints REST** para salvar as avaliações

---

## 📧 1. Avaliação da Plataforma

### 1.1. Fluxo de Dados

```
Cadastro → Backend envia:
  ├─ E-mail com link: /feedback/plataforma
  └─ Notificação in-app:
      ├─ type: 'system'
      ├─ title: 'Avalie a plataforma'
      ├─ data.url: '/feedback/plataforma'
      └─ data.action: 'open_platform_review'
```

### 1.2. Endpoint da API

**Não há endpoint específico** - a avaliação da plataforma é apenas um formulário que pode ser enviado para um endpoint genérico de feedback ou integrado com um serviço externo (ex: Google Forms, Typeform, etc.).

**Recomendação**: Criar endpoint `POST /api/feedback/platform` no backend se necessário, ou usar serviço externo.

### 1.3. Estrutura Recomendada

```
/src
  /pages
    /feedback
      PlatformReviewPage.jsx    # Página de avaliação da plataforma
  /components
    /feedback
      PlatformReviewForm.jsx    # Formulário de avaliação
      ReviewRating.jsx          # Componente de estrelas (reutilizável)
```

### 1.4. Campos do Formulário (Sugestão)

```javascript
{
  rating: number,           // 1-5 estrelas
  categories: {
    usability: number,      // Facilidade de uso (1-5)
    design: number,         // Design/Interface (1-5)
    performance: number,    // Performance (1-5)
    support: number         // Suporte (1-5)
  },
  comment: string,          // Comentário livre (opcional)
  suggestions: string,      // Sugestões de melhoria (opcional)
  wouldRecommend: boolean  // Recomendaria a plataforma?
}
```

---

## 🎓 2. Avaliação de Curso/Instrutor

### 2.1. Fluxo de Dados

```
Agendamento de Aula → Backend envia:
  ├─ E-mail com link: /courses/:id?review=1
  └─ Notificação in-app:
      ├─ type: 'system'
      ├─ title: 'Avalie seu curso'
      ├─ data.courseId: ObjectId
      ├─ data.url: '/courses/:id?review=1'
      └─ data.action: 'review_course'
```

### 2.2. Endpoint da API

**POST** `/api/courses/:id/reviews`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "string (ObjectId)",
  "rating": 5,              // Obrigatório: 1-5
  "comment": "string",       // Opcional: max 1000 caracteres
  "isAnonymous": false       // Opcional: default false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Avaliação criada com sucesso",
  "data": {
    "_id": "review_id",
    "courseId": {
      "_id": "course_id",
      "title": "Nome do Curso"
    },
    "studentId": {
      "_id": "user_id",
      "name": "Nome do Usuário",
      "avatar": "url_avatar"
    },
    "rating": 5,
    "comment": "Excelente curso!",
    "isAnonymous": false,
    "helpfulCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Erros Possíveis:**

- `400`: Dados inválidos (rating fora do range, etc.)
- `403`: Usuário não está matriculado no curso
- `400`: Usuário já avaliou este curso
- `404`: Curso não encontrado
- `401`: Não autenticado

### 2.3. Estrutura Recomendada

```
/src
  /pages
    /courses
      CourseDetailPage.jsx     # Página do curso (já existe)
  /components
    /courses
      CourseReviewModal.jsx    # Modal de avaliação
      CourseReviewForm.jsx     # Formulário de avaliação
      ReviewRating.jsx         # Componente de estrelas (reutilizável)
      ReviewList.jsx           # Lista de avaliações (já existe?)
```

---

## 🏗️ 3. Estrutura de Componentes

### 3.1. Componente de Rating (Reutilizável)

```jsx
// components/shared/StarRating.jsx
import React, { useState } from 'react';
import { Star, StarBorder } from '@mui/icons-material'; // ou ícone de sua escolha

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false,
  size = 'medium',
  showLabel = true 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;
  const labels = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <div className="star-rating">
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`star-button ${readonly ? 'readonly' : ''}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
          >
            {value <= displayRating ? (
              <Star className={`star filled star-${size}`} />
            ) : (
              <StarBorder className={`star empty star-${size}`} />
            )}
          </button>
        ))}
      </div>
      {showLabel && displayRating > 0 && (
        <span className="rating-label">{labels[displayRating - 1]}</span>
      )}
    </div>
  );
};

export default StarRating;
```

**CSS Sugerido:**
```css
.star-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stars-container {
  display: flex;
  gap: 4px;
}

.star-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.star-button:hover:not(:disabled) {
  transform: scale(1.1);
}

.star-button:disabled {
  cursor: default;
}

.star {
  color: #ffc107; /* Amarelo para estrelas preenchidas */
  font-size: 24px;
}

.star.empty {
  color: #e0e0e0; /* Cinza para estrelas vazias */
}

.star.small {
  font-size: 18px;
}

.star.medium {
  font-size: 24px;
}

.star.large {
  font-size: 32px;
}

.rating-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
```

### 3.2. Modal de Avaliação de Curso

```jsx
// components/courses/CourseReviewModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import StarRating from '../shared/StarRating';
import { createCourseReview } from '../../services/reviewService';

const CourseReviewModal = ({ 
  open, 
  onClose, 
  courseId, 
  courseTitle,
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createCourseReview({
        courseId,
        rating,
        comment: comment.trim(),
        isAnonymous
      });

      setSuccess(true);
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Fechar modal após 1.5s
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erro ao enviar avaliação. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetar estado ao fechar
    setRating(0);
    setComment('');
    setIsAnonymous(false);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        Avaliar Curso: {courseTitle}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Avaliação enviada com sucesso! Obrigado pelo feedback.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 500 
            }}>
              Como você avalia este curso? *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="large"
            />
          </div>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comentário (opcional)"
            placeholder="Compartilhe sua experiência com este curso..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            inputProps={{ maxLength: 1000 }}
            helperText={`${comment.length}/1000 caracteres`}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="Enviar avaliação anonimamente"
          />
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || rating === 0}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CourseReviewModal;
```

### 3.3. Página de Avaliação da Plataforma

```jsx
// pages/feedback/PlatformReviewPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Grid
} from '@mui/material';
import StarRating from '../../components/shared/StarRating';
import { submitPlatformReview } from '../../services/feedbackService';

const PlatformReviewPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rating: 0,
    categories: {
      usability: 0,
      design: 0,
      performance: 0,
      support: 0
    },
    comment: '',
    suggestions: '',
    wouldRecommend: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCategoryRating = (category, value) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Por favor, forneça uma avaliação geral');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitPlatformReview(formData);
      setSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erro ao enviar avaliação. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Avalie a Plataforma Swaply
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sua opinião é muito importante para melhorarmos nossa plataforma!
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Obrigado pelo seu feedback! Redirecionando...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avaliação Geral */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Como você avalia a plataforma Swaply? *
            </Typography>
            <StarRating
              rating={formData.rating}
              onRatingChange={(value) => 
                setFormData(prev => ({ ...prev, rating: value }))
              }
              size="large"
            />
          </Box>

          {/* Avaliações por Categoria */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Avalie por categoria (opcional)
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Facilidade de Uso
                </Typography>
                <StarRating
                  rating={formData.categories.usability}
                  onRatingChange={(value) => 
                    handleCategoryRating('usability', value)
                  }
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Design/Interface
                </Typography>
                <StarRating
                  rating={formData.categories.design}
                  onRatingChange={(value) => 
                    handleCategoryRating('design', value)
                  }
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Performance
                </Typography>
                <StarRating
                  rating={formData.categories.performance}
                  onRatingChange={(value) => 
                    handleCategoryRating('performance', value)
                  }
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Suporte
                </Typography>
                <StarRating
                  rating={formData.categories.support}
                  onRatingChange={(value) => 
                    handleCategoryRating('support', value)
                  }
                  size="medium"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Comentário */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comentários (opcional)"
            placeholder="Compartilhe sua experiência geral com a plataforma..."
            value={formData.comment}
            onChange={(e) => 
              setFormData(prev => ({ ...prev, comment: e.target.value }))
            }
            sx={{ mb: 3 }}
          />

          {/* Sugestões */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Sugestões de Melhoria (opcional)"
            placeholder="O que você gostaria de ver melhorado na plataforma?"
            value={formData.suggestions}
            onChange={(e) => 
              setFormData(prev => ({ ...prev, suggestions: e.target.value }))
            }
            sx={{ mb: 3 }}
          />

          {/* Recomendaria */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.wouldRecommend}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    wouldRecommend: e.target.checked 
                  }))
                }
              />
            }
            label="Eu recomendaria a plataforma Swaply para outras pessoas"
            sx={{ mb: 3 }}
          />

          {/* Botões */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || formData.rating === 0}
            >
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default PlatformReviewPage;
```

---

## 🔌 4. Integração com API

### 4.1. Service de Reviews

```javascript
// services/reviewService.js
import api from './api'; // Seu cliente HTTP configurado

export const createCourseReview = async (reviewData) => {
  const { courseId, rating, comment, isAnonymous } = reviewData;

  const response = await api.post(`/courses/${courseId}/reviews`, {
    courseId,
    rating,
    comment: comment || '',
    isAnonymous: isAnonymous || false
  });

  return response.data;
};

export const updateCourseReview = async (reviewId, reviewData) => {
  const response = await api.put(`/courses/reviews/${reviewId}`, reviewData);
  return response.data;
};

export const deleteCourseReview = async (reviewId) => {
  const response = await api.delete(`/courses/reviews/${reviewId}`);
  return response.data;
};

export const getCourseReviews = async (courseId, params = {}) => {
  const response = await api.get(`/courses/${courseId}/reviews`, { params });
  return response.data;
};

export const markReviewHelpful = async (reviewId) => {
  const response = await api.post(`/courses/reviews/${reviewId}/helpful`);
  return response.data;
};
```

### 4.2. Service de Feedback da Plataforma

```javascript
// services/feedbackService.js
import api from './api';

export const submitPlatformReview = async (reviewData) => {
  // Se você criar um endpoint no backend:
  const response = await api.post('/feedback/platform', reviewData);
  return response.data;

  // OU se usar serviço externo (ex: Google Forms):
  // return await submitToExternalService(reviewData);
};
```

### 4.3. Configuração do Cliente HTTP (Axios)

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - redirecionar para login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔔 5. Tratamento de Notificações

### 5.1. Hook para Processar Notificações

```javascript
// hooks/useNotifications.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '../contexts/NotificationContext';

export const useNotificationActions = () => {
  const navigate = useNavigate();
  const { markAsRead } = useNotificationContext();

  const handleNotificationClick = (notification) => {
    const { type, data } = notification;

    // Marcar como lida
    markAsRead(notification._id);

    // Processar ações específicas
    switch (data?.action) {
      case 'open_platform_review':
        navigate('/feedback/plataforma');
        break;

      case 'review_course':
        if (data.courseId) {
          navigate(`/courses/${data.courseId}?review=1`);
        } else if (data.url) {
          navigate(data.url);
        }
        break;

      case 'view_course':
        if (data.courseId) {
          navigate(`/courses/${data.courseId}`);
        }
        break;

      case 'view_classes':
        navigate('/dashboard/classes');
        break;

      default:
        // Ação padrão baseada no tipo
        if (type === 'system' && data?.url) {
          navigate(data.url);
        }
        break;
    }
  };

  return { handleNotificationClick };
};
```

### 5.2. Componente de Lista de Notificações

```jsx
// components/notifications/NotificationList.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Typography
} from '@mui/material';
import { Close, Star } from '@mui/icons-material';
import { useNotificationActions } from '../../hooks/useNotifications';

const NotificationList = ({ notifications, onDelete }) => {
  const { handleNotificationClick } = useNotificationActions();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system':
        return <Star />;
      default:
        return null;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'system':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <List>
      {notifications.map((notification) => (
        <ListItem
          key={notification._id}
          secondaryAction={
            <IconButton
              edge="end"
              onClick={() => onDelete(notification._id)}
              size="small"
            >
              <Close />
            </IconButton>
          }
          disablePadding
        >
          <ListItemButton
            onClick={() => handleNotificationClick(notification)}
            sx={{
              backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <ListItemText
              primary={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getNotificationIcon(notification.type)}
                  <Typography variant="subtitle2">
                    {notification.title}
                  </Typography>
                  {!notification.isRead && (
                    <Chip
                      label="Nova"
                      size="small"
                      color={getNotificationColor(notification.type)}
                    />
                  )}
                </div>
              }
              secondary={notification.message}
            />
          </ListItemButton>
        </ListItem>
      )}
    </List>
  );
};

export default NotificationList;
```

---

## 🎨 6. Integração na Página do Curso

### 6.1. Detectar Query Parameter e Abrir Modal

```jsx
// pages/courses/CourseDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CourseReviewModal from '../../components/courses/CourseReviewModal';

const CourseDetailPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [course, setCourse] = useState(null);

  // Verificar se deve abrir modal de avaliação
  useEffect(() => {
    const shouldReview = searchParams.get('review') === '1';
    if (shouldReview && course) {
      setReviewModalOpen(true);
      // Remover query param da URL sem recarregar
      searchParams.delete('review');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, course]);

  const handleReviewSuccess = (reviewData) => {
    // Atualizar lista de reviews ou recarregar curso
    // fetchCourseReviews();
    // ou atualizar estado local
  };

  return (
    <div>
      {/* Conteúdo da página do curso */}
      
      <CourseReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        courseId={id}
        courseTitle={course?.title}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
};
```

---

## ✅ 7. Boas Práticas

### 7.1. Validação no Frontend

```javascript
// utils/validation.js
export const validateReview = (reviewData) => {
  const errors = {};

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.rating = 'Avaliação deve ser entre 1 e 5 estrelas';
  }

  if (reviewData.comment && reviewData.comment.length > 1000) {
    errors.comment = 'Comentário não pode ter mais de 1000 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### 7.2. Feedback Visual

- **Loading States**: Mostrar spinner durante envio
- **Success States**: Mensagem de sucesso antes de fechar modal
- **Error States**: Mensagens de erro claras e específicas
- **Disabled States**: Desabilitar botão de submit até rating ser selecionado

### 7.3. Acessibilidade

```jsx
// Exemplo de componente acessível
<button
  type="button"
  aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
  aria-pressed={value <= rating}
  onClick={() => handleClick(value)}
>
  {/* Conteúdo */}
</button>
```

### 7.4. Performance

- **Lazy Loading**: Carregar modais apenas quando necessário
- **Debounce**: Em campos de texto longos, usar debounce para validação
- **Memoização**: Usar `React.memo` em componentes de rating se necessário

### 7.5. Tratamento de Erros

```javascript
// utils/errorHandler.js
export const handleReviewError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return error.response.data.message || 'Dados inválidos';
      case 403:
        return 'Você precisa estar matriculado no curso para avaliá-lo';
      case 404:
        return 'Curso não encontrado';
      case 401:
        return 'Você precisa estar logado para avaliar';
      default:
        return 'Erro ao enviar avaliação. Tente novamente.';
    }
  }
  return 'Erro de conexão. Verifique sua internet.';
};
```

---

## 📝 8. Checklist de Implementação

### Avaliação da Plataforma
- [ ] Criar rota `/feedback/plataforma`
- [ ] Criar componente `PlatformReviewPage`
- [ ] Criar componente `PlatformReviewForm`
- [ ] Integrar com endpoint de feedback (ou serviço externo)
- [ ] Adicionar tratamento de notificações com `action: 'open_platform_review'`
- [ ] Testar fluxo completo: cadastro → notificação → avaliação

### Avaliação de Curso/Instrutor
- [ ] Criar componente `CourseReviewModal`
- [ ] Criar componente `StarRating` reutilizável
- [ ] Integrar modal na página do curso
- [ ] Detectar query parameter `?review=1`
- [ ] Integrar com `POST /api/courses/:id/reviews`
- [ ] Adicionar tratamento de notificações com `action: 'review_course'`
- [ ] Atualizar lista de reviews após envio
- [ ] Testar fluxo completo: agendamento → notificação → avaliação

### Componentes Compartilhados
- [ ] Criar componente `StarRating` reutilizável
- [ ] Criar hook `useNotificationActions`
- [ ] Atualizar `NotificationList` para processar ações
- [ ] Adicionar validação de formulários
- [ ] Adicionar tratamento de erros consistente

### Testes
- [ ] Testar envio de avaliação com dados válidos
- [ ] Testar validação de campos obrigatórios
- [ ] Testar tratamento de erros da API
- [ ] Testar fluxo de notificações
- [ ] Testar acessibilidade (navegação por teclado, screen readers)
- [ ] Testar responsividade em mobile

---

## 🚀 9. Exemplo de Fluxo Completo

### 9.1. Fluxo de Avaliação da Plataforma

```
1. Usuário se cadastra
   ↓
2. Backend envia e-mail + notificação
   ↓
3. Usuário clica na notificação
   ↓
4. Frontend redireciona para /feedback/plataforma
   ↓
5. Usuário preenche formulário
   ↓
6. Frontend valida dados
   ↓
7. Frontend envia para API (ou serviço externo)
   ↓
8. Mostra mensagem de sucesso
   ↓
9. Redireciona para dashboard
```

### 9.2. Fluxo de Avaliação de Curso

```
1. Usuário agenda/comprar aula
   ↓
2. Backend envia e-mail + notificação
   ↓
3. Usuário clica na notificação
   ↓
4. Frontend redireciona para /courses/:id?review=1
   ↓
5. Página detecta ?review=1 e abre modal
   ↓
6. Usuário preenche avaliação
   ↓
7. Frontend valida dados
   ↓
8. Frontend chama POST /api/courses/:id/reviews
   ↓
9. Backend salva avaliação
   ↓
10. Frontend mostra mensagem de sucesso
   ↓
11. Modal fecha automaticamente
   ↓
12. Lista de reviews é atualizada
```

---

## 📚 10. Recursos Adicionais

### Bibliotecas Recomendadas

- **React Hook Form**: Para gerenciamento de formulários
- **Yup**: Para validação de schemas
- **Material-UI / Chakra UI**: Para componentes de UI
- **React Query / SWR**: Para gerenciamento de estado de servidor

### Exemplo com React Hook Form

```jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const reviewSchema = yup.object({
  rating: yup.number().min(1).max(5).required(),
  comment: yup.string().max(1000),
  isAnonymous: yup.boolean()
});

const CourseReviewForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(reviewSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos do formulário */}
    </form>
  );
};
```

---

## 🎯 Conclusão

Esta documentação fornece uma base sólida para implementar as funcionalidades de avaliação no frontend. Adapte os exemplos conforme sua stack tecnológica e padrões de código do seu projeto.

**Principais pontos a lembrar:**

1. ✅ Sempre validar dados no frontend antes de enviar
2. ✅ Fornecer feedback visual claro (loading, success, error)
3. ✅ Tratar erros de forma amigável ao usuário
4. ✅ Garantir acessibilidade (ARIA labels, navegação por teclado)
5. ✅ Testar todos os fluxos de usuário
6. ✅ Manter componentes reutilizáveis (StarRating)
7. ✅ Seguir padrões de UX consistentes

**Dúvidas ou sugestões?** Consulte a documentação da API ou entre em contato com a equipe de backend.

