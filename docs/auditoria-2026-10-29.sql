-- Applied via Supabase migration qr_publicacao_e_sequencia_auditadas.
CREATE OR REPLACE FUNCTION public.willai_qr_public(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','extensions','pg_temp' AS $$
SELECT CASE WHEN p.redirect_url IS NOT NULL AND p.status='available'
THEN jsonb_build_object('code',p.code,'status','redirect','redirect_url',p.redirect_url)
WHEN p.status='active' AND p.published_at IS NULL
THEN jsonb_build_object('code',p.code,'status','pending')
WHEN p.status='active' THEN jsonb_build_object('code',p.code,'status','active','page',p.page)
ELSE jsonb_build_object('code',p.code,'status',p.status) END
FROM public.willai_qr_plaques p WHERE p.code=upper(p_code);
$$;
UPDATE public.willai_qr_plaques SET published_at=updated_at
WHERE status='active' AND published_at IS NULL AND length(trim(coalesce(page->>'name','')))>0
AND coalesce(page->>'google','') ~ '^https?://[^[:space:]]+$';

CREATE OR REPLACE FUNCTION public.willai_qr_save(p_code text,p_page jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions','pg_temp' AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login necessário'; END IF;
IF p_page IS NULL OR jsonb_typeof(p_page)<>'object' OR length(p_page::text)>750000
OR length(trim(coalesce(p_page->>'name','')))=0
OR coalesce(p_page->>'google','') !~ '^https?://[^[:space:]]+$'
THEN RAISE EXCEPTION 'Informe o nome e um link válido de avaliação antes de publicar'; END IF;
UPDATE public.willai_qr_plaques SET page=p_page,updated_at=now(),published_at=now()
WHERE code=upper(p_code) AND owner_id=auth.uid() AND status='active';
IF NOT FOUND THEN RAISE EXCEPTION 'Sem permissão para salvar esta plaquinha'; END IF;
RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.willai_qr_admin_generate_batch(p_count integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions','pg_temp' AS $$
DECLARE n bigint; i integer; c text; s text; b uuid:=gen_random_uuid(); result jsonb:='[]'::jsonb;
BEGIN
IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.willai_portal_admins WHERE user_id=auth.uid())
THEN RAISE EXCEPTION 'Acesso administrativo necessário'; END IF;
IF p_count IS NULL OR p_count<1 OR p_count>100 THEN RAISE EXCEPTION 'Gere entre 1 e 100 códigos por lote'; END IF;
PERFORM pg_advisory_xact_lock(54681234);
SELECT COALESCE(MAX(substring(code FROM 2)::bigint),0) INTO n FROM public.willai_qr_plaques WHERE batch_id IS NOT NULL;
FOR i IN 1..p_count LOOP
LOOP
n:=n+1; IF n>99999999 THEN RAISE EXCEPTION 'Limite de códigos atingido'; END IF;
c:='W'||lpad(n::text,greatest(3,length(n::text)),'0');
EXIT WHEN NOT EXISTS(SELECT 1 FROM public.willai_qr_plaques WHERE code=c);
END LOOP;
s:=encode(gen_random_bytes(24),'hex');
INSERT INTO public.willai_qr_plaques(code,secret_hash,batch_id) VALUES(c,crypt(s,gen_salt('bf',10)),b);
result:=result||jsonb_build_array(jsonb_build_object('code',c,'secret',s,'link','https://willai.com.br/qr/'||c));
END LOOP;
RETURN jsonb_build_object('batch_id',b,'items',result);
END $$;
