# WillAI Studio

Plataforma de criação e publicação de páginas digitais de empresas, com dois modelos editáveis (avaliações via QR Code e cartão digital).

## Instalação

1. Configure o banco de dados no Supabase usando `supabase_setup.sql` no projeto apropriado.
2. Crie um usuário administrativo no Supabase Authentication.
3. Publique o repositório como um projeto estático Cloudflare Pages, raiz como diretório de saída.
4. Acesse `/studio` para administrar as páginas e `/slug-da-empresa` para as páginas públicas.

A chave contida em `config.js` é **publishable**; nunca inclua senhas ou chaves `service_role` no repositório.
