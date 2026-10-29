-- Corrective migration: qr_save_optional_google. Apply after qr_publicacao_e_sequencia_auditadas.
CREATE OR REPLACE FUNCTION public.willai_qr_save(p_code text,p_page jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions','pg_temp' AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login necessário'; END IF;
IF p_page IS NULL OR jsonb_typeof(p_page)<>'object' OR length(p_page::text)>750000
OR length(trim(coalesce(p_page->>'name','')))=0
THEN RAISE EXCEPTION 'Informe o nome do estabelecimento antes de publicar'; END IF;
IF length(trim(coalesce(p_page->>'google','')))>0 AND trim(p_page->>'google') !~ '^https?://[^[:space:]]+$'
THEN RAISE EXCEPTION 'Link do Google inválido. Corrija o endereço ou deixe o campo vazio'; END IF;
UPDATE public.willai_qr_plaques SET page=p_page,updated_at=now(),published_at=now()
WHERE code=upper(p_code) AND owner_id=auth.uid() AND status='active';
IF NOT FOUND THEN RAISE EXCEPTION 'Sem permissão para salvar esta plaquinha'; END IF;
RETURN jsonb_build_object('ok',true);
END $$;
