-- WillAI QR Premium: preserva códigos/contas e separa página pública de editor.
-- Aplicar após revisão da branch feat/qr-premium-fullscreen-20261028.
BEGIN;
-- Apenas páginas que já eram públicas antes desta mudança: status active,
-- com conteúdo e dono. Conserva o acesso público da W001 e demais legados.
UPDATE public.willai_qr_plaques
SET published_at = COALESCE(published_at,updated_at,now())
WHERE status='active' AND owner_id IS NOT NULL AND published_at IS NULL
  AND page IS NOT NULL AND page <> '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.willai_qr_public(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','extensions','pg_temp' AS $$
SELECT CASE
 WHEN p.redirect_url IS NOT NULL AND p.status='available'
 THEN jsonb_build_object('code',p.code,'status','redirect','redirect_url',p.redirect_url)
 WHEN p.status='active' AND p.owner_id IS NOT NULL AND p.published_at IS NOT NULL
 THEN jsonb_build_object('code',p.code,'status','active','page',p.page)
 WHEN p.status='active'
 THEN jsonb_build_object('code',p.code,'status','pending')
 ELSE jsonb_build_object('code',p.code,'status',p.status)
 END
FROM public.willai_qr_plaques p WHERE p.code=upper(p_code)
$$;
REVOKE ALL ON FUNCTION public.willai_qr_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_public(text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_save(p_code text,p_page jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','extensions','pg_temp' AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Faça login para publicar'; END IF;
 IF jsonb_typeof(p_page)<>'object' OR length(p_page::text)>700000
 THEN RAISE EXCEPTION 'Dados da página inválidos ou imagens grandes demais'; END IF;
 IF NOT (
   coalesce(p_page->>'google','') ~* '^https?://(g[.]page|maps[.]app[.]goo[.]gl|goo[.]gl|([a-z0-9-]+[.])?google[.]com([.]br)?)(/|[?]|$)'
 ) THEN RAISE EXCEPTION 'Configure o link de avaliação do Google antes de publicar'; END IF;
 UPDATE public.willai_qr_plaques
 SET page=p_page,published_at=now(),updated_at=now()
 WHERE code=upper(p_code) AND owner_id=(SELECT auth.uid()) AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Esta plaquinha não pertence à sua conta ou não está ativa'; END IF;
 RETURN jsonb_build_object('ok',true,'code',upper(p_code),'published',true);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_save(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_save(text,jsonb) TO authenticated;
COMMIT;

-- Testar, depois de aplicar:
-- SELECT code,status,published_at IS NOT NULL AS published FROM public.willai_qr_plaques WHERE code='W001';
-- SELECT public.willai_qr_public('W001'); (nunca deve expor owner_id nem secret_hash)
