# WillAI — Correção do salvamento e conteúdo ampliado das cidades

## O que corrige
- Salvar e publicar renova o login do Supabase antes de enviar o conteúdo.
- Se o upload falhar, o editor informa a causa; nunca confirma gravação falsa.
- Rascunhos não publicados são recuperados do mesmo navegador ao reabrir o editor (até 30 dias).
- Após confirmar publicação no Supabase, o rascunho é limpo e os dados públicos são atualizados.
- Fotos e logotipos são otimizados para WebP, preservando transparência e aumentando qualidade de banners.
- Página de cada cidade tem campos opcionais de perfil do patrocinador, suas imagens, mensagem e apresentação.
- A cidade permite título e explicação de Como funciona, etapas editáveis e seções extras de texto.
- Blocos opcionais sem conteúdo não são exibidos no site público.

## Etapa obrigatória no Supabase
1. Confirme no Dashboard que está no projeto rnqaktkvwfsetbjsqdrj; faça backup.
2. No SQL Editor, execute sql/20261027_willai_reparo_editor_e_imagens.sql.
3. Confira que o resultado mostra slug main, bucket willai-public e policies.
4. Não repita a instalação inicial nem altere outras contas, tabelas ou projetos.

## Teste visual e de persistência
1. Entre em /studio/portal/ no ambiente de preview pelo seu login de administrador.
2. Acesse Curitiba pelo menu do editor, clique em Editar portal > Página.
3. Adicione Sobre o patrocinador, uma foto/banner e o texto Como funciona.
4. Clique em Salvar e publicar e aguarde o aviso de sucesso.
5. Abra a página pública /curitiba em uma janela anônima e confira imagem e textos.
6. Recarregue ambos os links. Tudo deve continuar no mesmo lugar.
7. Se aparecer erro, copie o TEXTO da mensagem do editor; o rascunho será preservado localmente.

## Observações
- O Studio e a versão principal do domínio não são modificados até a revisão ser integrada à branch de produção.
- O conector Supabase não concedeu acesso ao projeto nesta sessão, portanto não foi possível aplicar o SQL nem testar gravação real remotamente.
- A criação e edição só funcionam para contas presentes em willai_portal_admins.
- O limite de arquivos e os mime types para Storage são verificados pela política SQL.
- Evite modificar dados em mais de uma aba ao mesmo tempo; cada publicação atualiza o JSON principal.