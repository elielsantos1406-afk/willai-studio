# WillAI — Atualização de segurança, portfólio e gestão

## Testar antes de publicar
Esta versão está na branch feature/portal-seguranca-gestao e não substitui a produção.

## Novidades
- Público: Início, Serviços, Portfólio, Sobre nós, Projeto e Entrar.
- Curitiba, Pinhais e as páginas das empresas continuam acessíveis por endereço próprio, mas sem atalhos no menu público.
- Portfólio: adicionar trabalhos, imagens, categorias e links no editor visual existente em /studio/portal/.
- Gestão: /studio/gestao/ com participantes, pesquisa, CSV e acessos específicos por cidade.
- Patrocinador vê indicadores agregados, não dados pessoais.

## Banco: executar SQL antes de testar a gestão
1. No Supabase rnqaktkvwfsetbjsqdrj faça backup.
2. Execute sql/20261027_willai_gestao_participantes.sql no SQL Editor.
3. Reutilize seu administrador já autorizado em willai_portal_admins.
4. Confira que as tabelas willai_project_participants e willai_access_roles existem.
5. Entre pelo endereço /login e abra /studio/gestao/.
6. Crie um participante teste e confira o registro no Supabase.
7. Para cadastrar gestor/patrocinador/empresa, crie o usuário Auth em Authentication > Users e depois atribua seu perfil no painel Acessos.

## Links de teste
/, /servicos, /portfolio, /sobre, /contato, /projeto, /curitiba, /pinhais, /curitiba/plurita, /plurita, /login, /studio/gestao/, /studio/portal/, /studio/

## Limites atuais
- A criação de contas Auth ainda exige o painel Supabase.
- Contas de empresas podem receber papel de empresa, mas a edição independente da página requer um fluxo adicional e permissões limitadas.
- O módulo de plaquinhas QR/NFC está em outra branch e não foi incorporado nesta etapa.
- SQL e tests de RLS precisam ser validados no banco real antes de mesclar em main.
- QR/NFC físicos só devem ser produzidos após definição do domínio definitivo.