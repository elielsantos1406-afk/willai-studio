# Relatório técnico — WILLAI QR Studio | Landing Premium V4
Data: 29/10/2026. Ambiente: branch de desenvolvimento; **não publicado no domínio oficial**.

## Escopo implementado
- Landing V4 aprovada incorporada ao próprio QR Studio como `qr/review-v4.html`, com HTML, CSS e JavaScript preservados.
- Endereços permanentes `/qr/Wxxx` continuam sob o roteador existente.
- Quando a plaquinha está **publicada**, a V4 abre em **tela cheia**. QR bloqueado, inexistente, ativação pendente e cadastro continuam exibindo seus estados corretos.
- Visual preservado: logo flutuante e nome central, título “Deixe sua avaliação”, quadro Google, estrelas 1 a 5, WhatsApp, Instagram, Nosso Site, rodapé e Login discreto.
- Ao tocar em uma estrela ou no botão do Google, abre-se o link de avaliação cadastrado. **O Google não permite fixar automaticamente a nota da estrela escolhida.**
- Botão Login na V4 abre a autenticação existente do proprietário no QR Studio.
- Editor existente ganhou campos para título, pergunta da avaliação, textos de cada botão e nove cores ajustáveis; sua prévia V4 é imediata.
- Campo “Nosso Site” adicionado. Os botões personalizados já existentes no JSON aparecem ao final dos contatos, se tiverem URL válida.
- Envio de logo e foto para o Storage **willai-public** com autenticação, redimensionamento WebP e pasta do proprietário; o JSON publicado armazena URL, não o arquivo nem uma cópia em localStorage.
- Salvamento por `willai_qr_save` e leitura por `willai_qr_public` permanecem nas funções protegidas existentes; não foram criadas migrações nem alterados dados de clientes.
- Cloudflare Pages: `_routes.json` exclui o HTML estático da V4 da função de rota dinâmica.

## Situação atual do banco (consulta no momento da integração)
- QR Codes existentes: **50**.
- `active`: **2**.
- `held`: **48**.
- Com `published_at` preenchido: **0**.
- Bucket de imagem `willai-public`: já existente e público, com políticas de inserção por usuário autenticado em pasta própria.

## O que NÃO foi alterado
- WillAI Studio institucional, estoque/geração/impressão SVG/PDF, QR permanente, código de ativação, solicitações de aprovação, administradores, projeto de inclusão digital e dados legados.
- Nenhum merge na `main` nem deploy no domínio de produção nesta etapa.

## Critérios para homologação futura (solicitada pelo usuário em outra etapa)
1. Abrir URL de prévia Cloudflare e confirmar a página da V4 no desktop e no celular.
2. Com conta proprietária já autorizada, editar textos, cores e os três rótulos dos botões.
3. Enviar logo e foto, salvar e publicar, recarregar a URL e conferir persistência.
4. Selecionar 1–5 estrelas, verificar abertura do link correto do Google sem afirmar que a nota foi pré-selecionada dentro do Google.
5. Abrir WhatsApp, Instagram, Site, botões extras e testar destinos.
6. Conferir login pelo rodapé, edição posterior e acesso negado a outra conta.
7. Testar plaquinha inexistente, bloqueada, ativação pendente e publicada.
8. Conferir que estoque, impressão, estúdios e Central de Atendimentos não tiveram regressões.

**Status:** código implementado em branch/PR para homologação. Testes ponta a ponta com contas reais, Storage no navegador e autorização de publicação ainda não realizados. Não afirmar produção em funcionamento antes destes testes.
