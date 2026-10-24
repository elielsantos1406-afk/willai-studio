# WillAI Studio

Editor de páginas digitais para empresas — modelos **Avaliações por QR Code** e **Cartão Digital**.

## Estrutura

- `/studio` — painel para criar, editar e publicar empresas
- `/:slug` — página pública individual (ex.: `/plurita`)
- `supabase_setup.sql` — tabelas, permissões RLS e bucket de imagens
- `config.js` — URL e chave pública do Supabase (não colocar senha ou chave secreta aqui)
- `_redirects` — rotas para Cloudflare Pages
- `assets/` — logo, banners e arquivos da página pública

## 1. Preparar Supabase

Projeto configurado: `rnqaktkvwfsetbjsqdrj`.

1. No [SQL Editor](https://supabase.com/dashboard/project/rnqaktkvwfsetbjsqdrj/sql/new), execute o arquivo `supabase_setup.sql` **somente nesse projeto**.
2. Em **Authentication > Users**, crie o usuário administrador.
3. Evite permitir cadastros públicos não autorizados (verifique configurações de Authentication).

As políticas RLS permitem ver páginas publicadas e editar somente registros do proprietário autenticado. Os uploads vão para uma pasta por usuário no bucket público de imagens.

## 2. Publicar no Cloudflare Pages

1. Acesse **Cloudflare > Workers & Pages > Create application > Pages > Connect to Git**.
2. Conecte o repositório GitHub `elielsantos1406-afk/willai-studio`.
3. Configure:
   - **Production branch:** `main`
   - **Framework:** `None`
   - **Build command:** `exit 0` (ou vazio para HTML estático)
   - **Build output directory:** `.` (raiz)
4. Clique em **Save and Deploy**. Copie o endereço REAL `https://nome.pages.dev` criado pelo Cloudflare.

## 3. Publicar uma empresa

1. Abra `https://nome.pages.dev/studio`.
2. Faça login com o usuário administrativo do Supabase.
3. Cadastre a empresa, escolha o modelo e edite textos, logo, botões, links e banners.
4. Informe o endereço real do seu site Cloudflare e um slug (ex.: `plurita`).
5. Clique **Publicar**. O endereço `https://nome.pages.dev/plurita` mostrará os dados publicados.

**Não é necessário n8n:** novas empresas são salvas no mesmo Supabase, usando um único site do Cloudflare. O link permanece o mesmo durante edições desde que o slug não mude.

## Observações

- O Google Avaliações da Plurita permanece sem link até ser configurado.
- O carrossel institucional é fixo e seus links podem ser editados.
- **Nunca publique** senhas, chaves `service_role`, connection strings de banco com senha, tokens ou credenciais administrativas no GitHub.
- O código estar no GitHub **não significa que o Cloudflare e o Supabase já estejam configurados**.
