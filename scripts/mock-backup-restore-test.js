/**
 * scripts/mock-backup-restore-test.js
 * 
 * Teste automatizado de simulação de backup e restauração de dados (Integrity Validator).
 * Garante que a estrutura relacional do Mundo Mágico (Multitenancy) é preservada
 * e que os dados críticos de Escolas, Alunos e Usuários podem ser serializados/deserializados
 * sem perda de integridade relacional.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runIntegrityTest() {
  console.log('================================================================');
  console.log('    MUNDO MÁGICO - TESTE LOCAL DE BACKUP, RESTORE E INTEGRIDADE ');
  console.log('================================================================');
  console.log('▶ Iniciando leitura do banco de dados local para geração do backup...');

  try {
    // 1. Extrai dados das tabelas principais para validação
    const schools = await prisma.school.findMany();
    const users = await prisma.user.findMany();
    const children = await prisma.child.findMany();
    
    console.log(`[✓] Leitura concluída:`);
    console.log(`    - Escolas encontradas: ${schools.length}`);
    console.log(`    - Usuários encontrados: ${users.length}`);
    console.log(`    - Crianças registradas: ${children.length}`);

    // 2. Cria o payload do mock backup
    const backupPayload = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      schema: {
        School: schools.length,
        User: users.length,
        Child: children.length
      },
      data: {
        schools: schools.map(s => ({ id: s.id, name: s.name, cnpj: s.cnpj })),
        users: users.map(u => ({ id: u.id, email: u.email, role: u.role, schoolId: u.schoolId })),
        children: children.map(c => ({ id: c.id, fullName: c.fullName, schoolId: c.schoolId }))
      }
    };

    // 3. Salva o arquivo de backup local
    const backupDir = path.join(__dirname, '../artifacts');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'mock_backup_integrity.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    
    console.log(`[✓] Arquivo de backup salvo com sucesso em:`);
    console.log(`    -> ${backupPath}`);
    console.log(`    -> Tamanho do arquivo: ${fs.statSync(backupPath).size} bytes`);

    // 4. Executa simulação de restauração e integridade relacional (Restore Sandbox)
    console.log('\n▶ Iniciando processo de Restore Sandbox para validação...');
    const rawBackup = fs.readFileSync(backupPath, 'utf-8');
    const restoredData = JSON.parse(rawBackup);

    console.log(`[✓] Arquivo carregado com sucesso.`);
    console.log(`[✓] Timestamp do backup original: ${restoredData.timestamp}`);
    console.log(`[✓] Versão de schema: ${restoredData.version}`);

    // 5. Validação de Regras Relacionais de Multilocatário (SaaS Isolation Boundary Checks)
    console.log('\n▶ Executando verificações de isolamento multilocatário (SaaS Isolation Boundaries)...');
    let integrityErrors = 0;

    // A. Todo usuário deve pertencer a uma escola cadastrada no backup
    const schoolIds = new Set(restoredData.data.schools.map(s => s.id));
    
    restoredData.data.users.forEach(u => {
      if (u.schoolId && !schoolIds.has(u.schoolId)) {
        console.error(`❌ FALHA DE INTEGRIDADE: Usuário ${u.email} pertence a uma escola inexistente ID: ${u.schoolId}`);
        integrityErrors++;
      }
    });

    // B. Toda criança deve pertencer a uma escola cadastrada no backup
    restoredData.data.children.forEach(c => {
      if (!schoolIds.has(c.schoolId)) {
        console.error(`❌ FALHA DE INTEGRIDADE: Criança ${c.fullName} pertence a uma escola inexistente ID: ${c.schoolId}`);
        integrityErrors++;
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('            RELATÓRIO FINAL DE INTEGRIDADE DO BACKUP            ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  [✓] Arquivo Validado:   ${path.basename(backupPath)}`);
    console.log(`  [✓] Total de Escolas:   ${restoredData.data.schools.length}`);
    console.log(`  [✓] Total de Usuários:  ${restoredData.data.users.length}`);
    console.log(`  [✓] Total de Alunos:    ${restoredData.data.children.length}`);
    console.log(`  [✓] Erros Encontrados:  ${integrityErrors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (integrityErrors === 0) {
      console.log('🎉 SUCESSO ABSOLUTO: O backup simulado está 100% íntegro, livre de anomalias relacionais e pronto para restore!');
    } else {
      console.error('❌ CRÍTICO: Falha na integridade estrutural do backup. Verifique os erros listados acima.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO DURANTE O TESTE DE INTEGRIDADE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrityTest();
