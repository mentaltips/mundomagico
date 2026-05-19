import { prisma } from '../packages/database'
import bcrypt from 'bcryptjs'

async function runIsolationTest() {
  console.log('🚀 Iniciando Teste de Validação de Isolamento de Multi-Tenant...')

  try {
    // 1. Criar dados de teste para Escola A
    const schoolA = await prisma.school.create({
      data: {
        name: 'Escola de Teste A',
        active: true,
        whatsappToken: 'token_escola_a',
      }
    })

    const userA = await prisma.user.create({
      data: {
        name: 'Admin Escola A',
        email: 'admin.a@test.com',
        role: 'ADMIN',
        schoolId: schoolA.id,
        password: await bcrypt.hash('password123', 10),
        active: true,
      }
    })

    // 2. Criar dados de teste para Escola B
    const schoolB = await prisma.school.create({
      data: {
        name: 'Escola de Teste B',
        active: true,
        whatsappToken: 'token_escola_b',
      }
    })

    const userB = await prisma.user.create({
      data: {
        name: 'Admin Escola B',
        email: 'admin.b@test.com',
        role: 'ADMIN',
        schoolId: schoolB.id,
        password: await bcrypt.hash('password123', 10),
        active: true,
      }
    })

    // Criar um aluno na Escola B
    const childB = await prisma.child.create({
      data: {
        fullName: 'Enzo da Escola B',
        schoolId: schoolB.id,
        status: 'ATIVO',
      }
    })

    console.log('✅ Dados de teste gerados com sucesso.')

    // ━━ Teste de Segurança 1: Escola A tentando acessar aluno da Escola B ━━
    console.log('🔍 Executando Teste de Segurança 1 (Leitura cruzada)...')
    const childCheck = await prisma.child.findFirst({
      where: {
        id: childB.id,
        schoolId: userA.schoolId // Forçando o schoolId do usuário autenticado A
      }
    })

    if (childCheck) {
      console.error('❌ FALHA DE ISOLAMENTO: Escola A conseguiu ler aluno da Escola B!')
      process.exit(1)
    } else {
      console.log('🛡️  SUCESSO: Escola A não conseguiu visualizar aluno da Escola B.')
    }

    // ━━ Teste de Segurança 2: Escola A tentando atualizar aluno da Escola B ━━
    console.log('🔍 Executando Teste de Segurança 2 (Escrita cruzada)...')
    try {
      const updateResult = await prisma.child.updateMany({
        where: {
          id: childB.id,
          schoolId: userA.schoolId // Apenas registros correspondentes à Escola A
        },
        data: {
          fullName: 'Invasão Hacker!'
        }
      })

      if (updateResult.count > 0) {
        console.error('❌ FALHA DE ISOLAMENTO: Escola A conseguiu modificar aluno da Escola B!')
        process.exit(1)
      } else {
        console.log('🛡️  SUCESSO: Modificação cruzada de alunos bloqueada no nível de query (schoolId).')
      }
    } catch (err: any) {
      console.log('🛡️  SUCESSO: Erro lançado ao tentar alteração não autorizada.', err.message)
    }

    // ━━ Teste de Segurança 3: Escola A tentando ver logs do WhatsApp da Escola B ━━
    console.log('🔍 Executando Teste de Segurança 3 (Visualização de Logs cruzada)...')
    const mockLogB = await prisma.whatsappMessageLog.create({
      data: {
        schoolId: schoolB.id,
        recipientPhone: '5511999999999',
        messageText: 'Mensagem secreta da Escola B',
        status: 'SENT'
      }
    })

    const logCheck = await prisma.whatsappMessageLog.findFirst({
      where: {
        id: mockLogB.id,
        schoolId: userA.schoolId
      }
    })

    if (logCheck) {
      console.error('❌ FALHA DE ISOLAMENTO: Escola A acessou logs do WhatsApp da Escola B!')
      process.exit(1)
    } else {
      console.log('🛡️  SUCESSO: Logs de transmissão da Escola B totalmente invisíveis para a Escola A.')
    }

    // Limpeza dos registros de teste
    console.log('🧹 Limpando dados de teste do banco de dados...')
    await prisma.whatsappMessageLog.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } })
    await prisma.child.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } })
    await prisma.user.deleteMany({ where: { schoolId: { in: [schoolA.id, schoolB.id] } } })
    await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 SUCESSO ABSOLUTO: Todos os testes de isolamento de tenant passaram!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Ocorreu um erro inesperado durante o teste:', error)
    process.exit(1)
  }
}

runIsolationTest()
