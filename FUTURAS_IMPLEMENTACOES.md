# Futuras Implementações - Mundo Mágico (Fase 2)

Este documento centraliza as ideias e os escopos das próximas funcionalidades que serão implementadas no sistema após a fase inicial de testes e validação em produção.

---

## 1. Integração Real com o WhatsApp (Baileys)
A ideia é transformar o simulador da página de apresentação em um recurso real da plataforma.

**Como vai funcionar:**
- Utilizaremos a biblioteca **Baileys** (que é focada em conexões via WebSockets diretamente com o WhatsApp Web, dispensando custos altíssimos da API oficial da Meta).
- Uma aba nova no Painel Admin (ex: `Configurações > Conexão WhatsApp`) exibirá um QR Code.
- A escola lê o QR Code com o celular oficial da creche.
- A partir disso, sempre que a professora salvar um "Diário de Bordo", "Aviso de Presença" ou enviar "Fotos", a API disparará silenciosamente uma mensagem direto para o número do Responsável cadastrado no sistema.

---

## 2. Cardápio Semanal e Gestão de Nutrição
**Como vai integrar com o sistema atual (Rotina / Calendário):**
- **No Administrativo:** O nutricionista ou diretor acessa a tela de "Cardápio" e preenche o que será servido (Lanche da Manhã, Almoço, Lanche da Tarde, Janta) em um calendário visual.
- **Na Área da Professora (Diário de Bordo):** Em vez da professora digitar o que a criança comeu, o sistema já puxa automaticamente o prato do dia do Cardápio. A professora apenas marca: *"Comeu tudo"*, *"Comeu pouco"*, *"Recusou"*. Isso poupa muito tempo!
- **No Portal dos Pais:** Os pais poderão acessar a aba "Cardápio" para ver com antecedência o menu da semana e daquele mês.

---

## 3. Controle de Estoque (Materiais e Insumos)
**Como vai funcionar:**
- A escola fará o controle do que está acabando (Ex: Fraldas cedidas pela creche, Leite em pó, Pomadas, etc).
- **Alerta Mágico para os Pais:** Se o controle for atrelado à criança (estoque individual do aluno), a professora pode registrar: "Usou 2 fraldas hoje. Restam 3 na mochila". 
- O sistema da creche avisa os pais automaticamente (via WhatsApp ou notificação no painel) quando o estoque pessoal da criança estiver acabando.

---

## Próximos Passos
1. **Foco Atual:** Utilizar o sistema ativamente, cadastrar alunos reais, testar pagamentos, rotinas e painel de responsáveis.
2. **Coleta de Feedback:** Anotar qualquer dificuldade ou tela que os pais e professoras achem confusa durante as primeiras semanas de uso.
3. **Início da Fase 2:** Assim que o uso atual estiver consolidado e redondo, usaremos este documento como ponto de partida para desenvolver o Baileys e o Cardápio.
