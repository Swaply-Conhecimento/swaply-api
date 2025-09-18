require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar modelos
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Review = require('../src/models/Review');
const Payment = require('../src/models/Payment');

// Conectar ao banco
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Dados de exemplo
const seedData = {
  users: [
    {
      name: 'João Silva',
      email: 'joao@swaply.com',
      password: '123456',
      bio: 'Desenvolvedor Full Stack apaixonado por ensinar programação.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      credits: 50,
      isInstructor: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Maria Santos',
      email: 'maria@swaply.com',
      password: '123456',
      bio: 'Designer UX/UI com 8 anos de experiência em produtos digitais.',
      skills: ['Figma', 'Adobe XD', 'Design Thinking', 'Prototipagem'],
      credits: 30,
      isInstructor: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Pedro Costa',
      email: 'pedro@swaply.com',
      password: '123456',
      bio: 'Estudante de programação interessado em aprender novas tecnologias.',
      skills: ['HTML', 'CSS'],
      credits: 15,
      isInstructor: false,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'
    },
    {
      name: 'Ana Oliveira',
      email: 'ana@swaply.com',
      password: '123456',
      bio: 'Especialista em Marketing Digital e Growth Hacking.',
      skills: ['SEO', 'Google Ads', 'Analytics', 'Social Media'],
      credits: 40,
      isInstructor: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face'
    }
  ],

  courses: [
    {
      title: 'Desenvolvimento Web Completo com React e Node.js',
      description: 'Aprenda a criar aplicações web modernas do zero usando React no frontend e Node.js no backend. Curso completo com projetos práticos.',
      category: 'Tecnologia',
      subcategory: 'Desenvolvimento Web',
      level: 'Intermediário',
      pricePerHour: 2,
      totalHours: 40,
      maxStudents: 30,
      features: [
        '🎥 Aulas ao vivo via Zoom',
        '📚 Material didático completo',
        '💻 Projetos práticos',
        '🎓 Certificado de conclusão',
        '👨‍🏫 Suporte direto com instrutor'
      ],
      curriculum: [
        {
          id: 1,
          title: 'Fundamentos do Desenvolvimento Web',
          duration: 4,
          lessons: ['HTML5 e CSS3', 'JavaScript ES6+', 'Git e GitHub']
        },
        {
          id: 2,
          title: 'React.js do Básico ao Avançado',
          duration: 16,
          lessons: ['Componentes e Props', 'Hooks', 'Context API', 'Redux']
        },
        {
          id: 3,
          title: 'Backend com Node.js',
          duration: 12,
          lessons: ['Express.js', 'MongoDB', 'APIs REST', 'Autenticação JWT']
        },
        {
          id: 4,
          title: 'Deploy e Produção',
          duration: 8,
          lessons: ['Heroku', 'Vercel', 'Docker', 'CI/CD']
        }
      ],
      schedule: [
        { day: 'Segunda', time: '19:00-21:00' },
        { day: 'Quarta', time: '19:00-21:00' }
      ],
      requirements: [
        'Conhecimento básico de programação',
        'Computador com acesso à internet',
        'Vontade de aprender'
      ],
      objectives: [
        'Criar aplicações web completas',
        'Dominar React.js e Node.js',
        'Implementar APIs REST',
        'Fazer deploy de aplicações'
      ],
      tags: ['react', 'nodejs', 'javascript', 'fullstack', 'web'],
      status: 'active'
    },
    {
      title: 'Design UX/UI para Iniciantes',
      description: 'Aprenda os fundamentos do Design UX/UI e crie interfaces incríveis. Curso prático com ferramentas modernas.',
      category: 'Design',
      subcategory: 'UI/UX Design',
      level: 'Iniciante',
      pricePerHour: 3,
      totalHours: 24,
      maxStudents: 20,
      features: [
        '🎨 Projetos práticos reais',
        '🔧 Domínio do Figma',
        '📱 Design responsivo',
        '🧠 Psicologia das cores',
        '👥 Feedback personalizado'
      ],
      curriculum: [
        {
          id: 1,
          title: 'Fundamentos do Design',
          duration: 6,
          lessons: ['Princípios do Design', 'Teoria das Cores', 'Tipografia']
        },
        {
          id: 2,
          title: 'UX Research e Prototipagem',
          duration: 8,
          lessons: ['Pesquisa de Usuário', 'Personas', 'Wireframes', 'Protótipos']
        },
        {
          id: 3,
          title: 'Interface e Interação',
          duration: 10,
          lessons: ['Design de Interface', 'Micro-interações', 'Design System']
        }
      ],
      schedule: [
        { day: 'Terça', time: '20:00-22:00' },
        { day: 'Quinta', time: '20:00-22:00' }
      ],
      requirements: [
        'Nenhum conhecimento prévio necessário',
        'Computador com internet',
        'Criatividade e dedicação'
      ],
      objectives: [
        'Criar interfaces profissionais',
        'Dominar ferramentas de design',
        'Entender experiência do usuário',
        'Montar portfólio'
      ],
      tags: ['ux', 'ui', 'design', 'figma', 'prototipagem'],
      status: 'active'
    },
    {
      title: 'Marketing Digital para Pequenos Negócios',
      description: 'Estratégias práticas de marketing digital para alavancar seu negócio online. Aprenda SEO, redes sociais e muito mais.',
      category: 'Marketing',
      subcategory: 'Marketing Digital',
      level: 'Iniciante',
      pricePerHour: 2,
      totalHours: 20,
      maxStudents: 25,
      features: [
        '📊 Análise de métricas',
        '🎯 Campanhas práticas',
        '📱 Redes sociais',
        '🔍 SEO básico',
        '💰 ROI comprovado'
      ],
      curriculum: [
        {
          id: 1,
          title: 'Fundamentos do Marketing Digital',
          duration: 5,
          lessons: ['Conceitos básicos', 'Funil de vendas', 'Persona']
        },
        {
          id: 2,
          title: 'SEO e Conteúdo',
          duration: 8,
          lessons: ['SEO on-page', 'Palavras-chave', 'Marketing de conteúdo']
        },
        {
          id: 3,
          title: 'Redes Sociais e Anúncios',
          duration: 7,
          lessons: ['Instagram', 'Facebook Ads', 'Google Ads básico']
        }
      ],
      schedule: [
        { day: 'Sábado', time: '09:00-12:00' }
      ],
      requirements: [
        'Ter um negócio ou ideia de negócio',
        'Conhecimento básico de internet',
        'Vontade de crescer'
      ],
      objectives: [
        'Criar presença digital forte',
        'Gerar leads qualificados',
        'Aumentar vendas online',
        'Medir resultados'
      ],
      tags: ['marketing', 'digital', 'seo', 'redes-sociais', 'vendas'],
      status: 'active'
    }
  ]
};

// Função para criar usuários
const createUsers = async () => {
  console.log('📝 Criando usuários...');
  
  const users = [];
  
  for (const userData of seedData.users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    
    await user.save();
    users.push(user);
    console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
  }
  
  return users;
};

// Função para criar cursos
const createCourses = async (users) => {
  console.log('📚 Criando cursos...');
  
  const instructors = users.filter(user => user.isInstructor);
  const courses = [];
  
  for (let i = 0; i < seedData.courses.length; i++) {
    const courseData = seedData.courses[i];
    const instructor = instructors[i % instructors.length];
    
    const course = new Course({
      ...courseData,
      instructor: instructor._id,
      image: `https://images.unsplash.com/photo-${1517180102584 + i}?w=800&h=600&fit=crop`
    });
    
    await course.save();
    courses.push(course);
    
    // Adicionar alguns estudantes matriculados
    const students = users.filter(user => !user.isInstructor);
    const enrolledStudents = students.slice(0, Math.floor(Math.random() * students.length));
    
    for (const student of enrolledStudents) {
      await course.enrollStudent(student._id);
    }
    
    console.log(`✅ Curso criado: ${course.title} (${enrolledStudents.length} estudantes)`);
  }
  
  return courses;
};

// Função para criar avaliações
const createReviews = async (courses, users) => {
  console.log('⭐ Criando avaliações...');
  
  const students = users.filter(user => !user.isInstructor);
  
  for (const course of courses) {
    const numReviews = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < numReviews; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      
      // Verificar se estudante está matriculado
      if (!course.enrolledStudents.includes(student._id)) {
        continue;
      }
      
      // Verificar se já avaliou
      const existingReview = await Review.findOne({
        courseId: course._id,
        studentId: student._id
      });
      
      if (existingReview) {
        continue;
      }
      
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 estrelas
      const comments = [
        'Curso excelente! Aprendi muito.',
        'Instrutor muito didático e paciente.',
        'Conteúdo de qualidade, recomendo!',
        'Superou minhas expectativas.',
        'Metodologia muito boa, aprendi na prática.'
      ];
      
      const review = new Review({
        courseId: course._id,
        studentId: student._id,
        instructorId: course.instructor,
        rating,
        comment: comments[Math.floor(Math.random() * comments.length)],
        isAnonymous: Math.random() > 0.7
      });
      
      await review.save();
    }
  }
  
  console.log('✅ Avaliações criadas');
};

// Função para criar transações de exemplo
const createPayments = async (users) => {
  console.log('💰 Criando transações...');
  
  for (const user of users) {
    // Compra inicial de créditos
    const purchasePayment = new Payment({
      userId: user._id,
      type: 'credit_purchase',
      amount: 25.00, // R$ 25,00
      credits: 5,
      description: 'Compra de créditos - Boas-vindas',
      paymentMethod: 'stripe',
      status: 'completed'
    });
    
    await purchasePayment.save();
    
    if (user.isInstructor) {
      // Ganhos como instrutor
      const earningPayment = new Payment({
        userId: user._id,
        type: 'credit_earned',
        amount: 0,
        credits: Math.floor(Math.random() * 20) + 5,
        description: 'Créditos ganhos ensinando',
        paymentMethod: 'internal',
        status: 'completed'
      });
      
      await earningPayment.save();
    }
  }
  
  console.log('✅ Transações criadas');
};

// Função principal
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Limpando banco de dados...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Review.deleteMany({});
    await Payment.deleteMany({});
    
    console.log('🌱 Iniciando seed do banco de dados...');
    
    const users = await createUsers();
    const courses = await createCourses(users);
    await createReviews(courses, users);
    await createPayments(users);
    
    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`👥 Usuários: ${users.length}`);
    console.log(`📚 Cursos: ${courses.length}`);
    console.log(`⭐ Avaliações: ${await Review.countDocuments()}`);
    console.log(`💰 Transações: ${await Payment.countDocuments()}`);
    
    console.log('\n🔐 Credenciais de teste:');
    console.log('📧 Email: joao@swaply.com | 🔑 Senha: 123456 (Instrutor)');
    console.log('📧 Email: maria@swaply.com | 🔑 Senha: 123456 (Instrutor)');
    console.log('📧 Email: pedro@swaply.com | 🔑 Senha: 123456 (Estudante)');
    console.log('📧 Email: ana@swaply.com | 🔑 Senha: 123456 (Instrutor)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
