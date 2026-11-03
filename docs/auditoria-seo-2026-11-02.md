# WillAI — Auditoria técnica SEO (02/11/2026)

Escopo: repositório `elielsantos1406-afk/willai-studio`, domínio `https://willai.com.br`, rotas públicas do portal e ferramentas digitais. Não alterar Supabase, QR Studio nem aplicativos de clientes.

## Resultado por item visível na captura

| Item | Resultado | Evidência/ação |
|---|---|---|
| 1. Sitemap XML | Corrigido no código | 11 URLs públicas válidas; adicionado /suporte, /curitiba e /pinhais; páginas de login/QR/admin excluídas. |
| 2. robots.txt | Verificado, mantido | Já contém `Allow: /` e link absoluto para sitemap; não bloquear `/portal/index.html` porque o carregador SPA precisa desse documento. |
| 3. Noindex | Corrigido de forma seletiva | Portal público recebe `index,follow` quando a rota é válida; login, plaquinhas não indexáveis e rotas inexistentes recebem `noindex`; painéis internos permanecem protegidos contra indexação. |
| 4. URLs canônicas | Corrigido no código | Canonical por rota pública após renderização; ferramentas estáticas já possuem canonical. |
| 5. Títulos SEO | Corrigido no código | `document.title` exclusivo por página; mantém nome da marca. |
| 6. Meta descriptions | Corrigido no código | Descrição específica por rota pública, e metadados Open Graph. |
| 7. Um H1 por página | Revisão de templates | Templates públicos principais têm H1; conferir HTML renderizado no Search Console para rotas dinâmicas. |
| 8. Hierarquia H2/H3 | Revisão de templates | Componentes principais usam seções H2 e cartões H3; revisão semântica detalhada ainda depende de inspeção das páginas renderizadas. |
| 9. Textos alternativos | Revisado no código | Tags de imagens explícitas verificadas; imagens decorativas podem ter alt vazio; a imagem de negócios tem alt descritivo. |
| 10. Dados estruturados | Corrigido no código | JSON-LD `Organization` e `WebSite` no portal (home e projeto); `WebApplication` já presente no gerador WhatsApp. |
| 11. Links internos | Revisado | Navegação interna, rodapé, serviços e ferramentas preservados. |
| 12. Links quebrados | Parcial | Referências locais checadas contra arquivos e rotas; destinos externos exigem teste HTTP ao vivo. |
| 13. Imagens | Parcial | Adicionados tamanhos, `loading=lazy` para imagens secundárias e `decoding=async`; conversão de formatos e peso de imagens do Supabase dependem de auditoria visual de assets e de rede. |
| 14. Core Web Vitals | Pendente | Só é possível afirmar LCP, INP e CLS medidos por Lighthouse/CrUX/PageSpeed Insights em produção. Não inventar notas. |
| 15. Responsividade | Parcial | Viewport e breakpoints mobile presentes; inspeção visual em iOS/Android/desktop pendente. |
| 16. HTTPS | Pendente de verificação externa | URLs canônicas usam HTTPS, mas certificado e redirecionamento HTTP → HTTPS não puderam ser consultados desta sessão. |
| 17. Slugs das URLs | Verificado | URLs públicas curtas e legíveis: `/servicos`, `/portfolio`, `/curitiba`, `/ferramentas/gerador-link-whatsapp/`. |
| 18–19 | Não legíveis | O conteúdo está coberto por marcações na imagem fornecida. |
| 20. llms.txt | Criado (opcional) | Arquivo informativo com páginas públicas; não é requisito do Google, não substitui sitemap nem garante indexação. |

## Principais limitações

1. O site usa um **app-shell**: `index.html` carrega um portal via JavaScript. Metadados e conteúdo de várias rotas são produzidos após a execução do script. O Google pode renderizar JavaScript, mas é necessário conferir o HTML processado no Search Console; não interpretar o código em repositório como prova de indexação.
2. A ferramenta de consulta pública retornou erro 502 ao tentar consultar `https://willai.com.br/`. Isso **não comprova indisponibilidade do site para os usuários**; impossibilitou medir o certificado, carregamento e links externos nesta sessão.
3. A situação de indexação real, a cobertura do sitemap e as métricas LCP/INP/CLS exigem dados do Google Search Console e PageSpeed Insights.
4. Não foi feita migração, remoção ou edição de registros do Supabase nesta auditoria; as mudanças estão restritas ao GitHub.

## Próxima validação externa

- No Google Search Console, inspecionar `https://willai.com.br/` e `https://willai.com.br/ferramentas/gerador-link-whatsapp/`, conferir **Ver página testada**, HTML renderizado e cobertura da indexação.
- Enviar `https://willai.com.br/sitemap.xml` na área **Sitemaps**.
- No PageSpeed Insights, medir home, ferramenta WhatsApp e Curitiba em **Mobile** e **Desktop** para LCP, INP, CLS e oportunidades.
- Conferir redirecionamento HTTPS e testar os links externos de portfólio e Instagram no celular.
- Se URLs públicas não estiverem visíveis aos rastreadores sem JavaScript, implementar **renderização estática/SSR para as rotas SEO**, sem substituir a aplicação existente.

Referências: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics ; https://support.google.com/webmasters/answer/12061956?hl=pt-BR .
