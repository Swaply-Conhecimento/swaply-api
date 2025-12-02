/**
 * Script para corrigir índice de disponibilidade do instrutor
 * 
 * Remove o índice único antigo (instructor_1) e cria o novo índice composto
 * (instructor_1, course_1) que permite múltiplas disponibilidades por instrutor
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

const fixAvailabilityIndex = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const collection = db.collection('instructoravailabilities');

    console.log('\n🔍 Verificando índices existentes...\n');

    // Listar índices atuais
    const indexes = await collection.indexes();
    console.log('Índices atuais:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Verificar se existe índice único antigo
    const oldIndex = indexes.find(index => 
      index.name === 'instructor_1' && 
      Object.keys(index.key).length === 1 &&
      index.key.instructor === 1
    );

    if (oldIndex) {
      console.log('\n⚠️  Índice antigo encontrado. Removendo...');
      try {
        await collection.dropIndex('instructor_1');
        console.log('✅ Índice antigo removido com sucesso');
      } catch (error) {
        if (error.code === 27) {
          console.log('ℹ️  Índice antigo não existe (já foi removido)');
        } else {
          throw error;
        }
      }
    } else {
      console.log('\nℹ️  Índice antigo não encontrado');
    }

    // Verificar se já existe índice composto
    const compoundIndex = indexes.find(index => 
      index.key.instructor === 1 && 
      index.key.course === 1 &&
      index.unique === true
    );

    if (compoundIndex) {
      console.log('✅ Índice composto já existe');
    } else {
      console.log('\n📝 Criando índice composto único...');
      await collection.createIndex(
        { instructor: 1, course: 1 },
        { unique: true, name: 'instructor_1_course_1' }
      );
      console.log('✅ Índice composto criado com sucesso');
    }

    // Verificar se há dados duplicados
    console.log('\n🔍 Verificando dados duplicados...');
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { instructor: '$instructor', course: '$course' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`⚠️  Encontrados ${duplicates.length} grupos de documentos duplicados:`);
      duplicates.forEach(dup => {
        console.log(`  - Instructor: ${dup._id.instructor}, Course: ${dup._id.course || 'null'}, Count: ${dup.count}`);
        console.log(`    IDs: ${dup.ids.map(id => id.toString()).join(', ')}`);
      });
      console.log('\n⚠️  ATENÇÃO: Há documentos duplicados!');
      console.log('   Você precisa remover manualmente os duplicados antes de continuar.');
      console.log('   Mantenha apenas um documento por combinação instructor + course.');
    } else {
      console.log('✅ Nenhum dado duplicado encontrado');
    }

    // Listar índices finais
    console.log('\n📋 Índices finais:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(único)' : '');
    });

    console.log('\n✅ Correção concluída com sucesso!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao corrigir índice:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  fixAvailabilityIndex();
}

module.exports = fixAvailabilityIndex;

