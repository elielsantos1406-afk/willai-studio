-- WILLAI QR Studio | entrega protegida, cadastro somente email/senha e publicacao controlada.
-- EXECUTAR APOS sql/20261028_willai_qr_operacao_v2.sql, SOMENTE apos backup e testes.
-- Migracao aditiva para as tabelas; nao altera registros de clientes nem tabelas antigas.
-- A administracao gera segredos de 48 caracteres. O QR IMPRESSO incorpora o segredo
-- exclusivamente no fragmento (#ativar=...), que nao e enviado em requisicoes HTTP.
-- Cada unidade nasce BLOQUEADA e deve ser liberada pelo administrador APOS a entrega.
BEGIN;

ALTER TABLE public.willai_qr_plaques DROP CONSTRAINT IF EXISTS willai_qr_plaques_status_check;
ALTER TABLE public.willai_qr_plaques ADD CONSTRAINT willai_qr_plaques_status_check
  CHECK (status IN ('held','available','active','disabled'));
ALTER TABLE public.willai_qr_plaques ALTER COLUMN status SET DEFAULT 'held';
ALTER TABLE public.willai_qr_plaques ADD COLUMN IF NOT EXISTS released_at timestamptz;
ALTER TABLE public.willai_qr_plaques ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.willai_qr_plaques ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_qr_plaques FROM anon,authenticated;

-- Nenhuma pagina nao publicada aparece para visitantes.
CREATE OR REPLACE FUNCTION public.willai_qr_public(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
 SELECT CASE
 WHEN p.status='active' AND p.published_at IS NOT NULL
   THEN jsonb_build_object('code',p.code,'status','active','page',p.page)
 WHEN p.status='active'
   THEN jsonb_build_object('code',p.code,'status','pending')
 WHEN p.status='available' AND p.redirect_url IS NOT NULL
   THEN jsonb_build_object('code',p.code,'status','redirect','redirect_url',p.redirect_url)
 ELSE jsonb_build_object('code',p.code,'status',p.status)
 END FROM public.willai_qr_plaques p WHERE p.code=upper(p_code)
$$;
REVOKE ALL ON FUNCTION public.willai_qr_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_public(text) TO anon,authenticated;

-- Desabilita assinatura antiga que permitia apropriar codigo so com o numero.
DROP FUNCTION IF EXISTS public.willai_qr_claim(text,jsonb);

CREATE OR REPLACE FUNCTION public.willai_qr_claim(
 p_code text,p_secret text,p_page jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
DECLARE v_code text;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Entre na conta para ativar'; END IF;
 IF p_code IS NULL OR upper(p_code) !~ '^W[0-9]{3,8}$' THEN
  RAISE EXCEPTION 'Codigo invalido';
 END IF;
 IF p_secret IS NULL OR p_secret !~ '^[a-f0-9]{48}$' THEN
  RAISE EXCEPTION 'Leia o QR Code original da plaquinha entregue';
 END IF;
 IF jsonb_typeof(p_page)<>'object' OR length(p_page::text)>750000 THEN
  RAISE EXCEPTION 'Dados invalidos';
 END IF;
 -- Lock + comparacao de hash: codigo e conta, isolados, nao bastam.
 PERFORM 1 FROM public.willai_qr_plaques p
 WHERE p.code=upper(p_code) AND p.status='available' AND p.owner_id IS NULL
   AND p.redirect_url IS NULL
   AND p.secret_hash=crypt(p_secret,p.secret_hash)
 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Plaquinha indisponivel ou nao liberada'; END IF;
 UPDATE public.willai_qr_plaques
 SET owner_id=(SELECT auth.uid()),status='active',page=p_page,
     activated_at=now(),published_at=NULL,updated_at=now()
 WHERE code=upper(p_code) AND status='available' AND owner_id IS NULL
 RETURNING code INTO v_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Plaquinha ja ativada'; END IF;
 RETURN jsonb_build_object('ok',true,'code',v_code);
END
$$;
REVOKE ALL ON FUNCTION public.willai_qr_claim(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_claim(text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_save(p_code text,p_page jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Faca login'; END IF;
 IF jsonb_typeof(p_page)<>'object' OR length(p_page::text)>750000
 OR jsonb_typeof(p_page->'name')<>'string'
 OR length(btrim(coalesce(p_page->>'name','')))<2 THEN
  RAISE EXCEPTION 'Informe o nome do estabelecimento para publicar';
 END IF;
 UPDATE public.willai_qr_plaques
 SET page=p_page,published_at=now(),updated_at=now()
 WHERE code=upper(p_code) AND owner_id=(SELECT auth.uid()) AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Sem permissao para publicar'; END IF;
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_save(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_save(text,jsonb) TO authenticated;

-- Cria estoque BLOQUEADO, com segredo forte retornado apenas nesta resposta.
CREATE OR REPLACE FUNCTION public.willai_qr_admin_generate_batch(p_count integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
DECLARE n bigint;i integer;c text;s text;b uuid:=gen_random_uuid();result jsonb:='[]'::jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.willai_portal_admins WHERE user_id=(SELECT auth.uid())
 ) THEN RAISE EXCEPTION 'Acesso administrativo necessario'; END IF;
 IF p_count IS NULL OR p_count<1 OR p_count>100 THEN RAISE EXCEPTION 'Lote entre 1 e 100'; END IF;
 PERFORM pg_advisory_xact_lock(54681234);
 SELECT COALESCE(MAX(substring(code FROM 2)::bigint),0) INTO n FROM public.willai_qr_plaques;
 FOR i IN 1..p_count LOOP
  n:=n+1;c:='W'||lpad(n::text,3,'0');s:=encode(gen_random_bytes(24),'hex');
  INSERT INTO public.willai_qr_plaques(code,secret_hash,status,batch_id)
  VALUES(c,crypt(s,gen_salt('bf',10)),'held',b);
  result:=result||jsonb_build_array(
   jsonb_build_object('code',c,'secret',s,'link','https://willai.com.br/qr/'||c)
  );
 END LOOP;
 RETURN jsonb_build_object('batch_id',b,'items',result);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_generate_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_generate_batch(integer) TO authenticated;

-- A liberacao e feita somente quando a placa foi entregue.
CREATE OR REPLACE FUNCTION public.willai_qr_admin_release(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.willai_portal_admins WHERE user_id=(SELECT auth.uid())
 ) THEN RAISE EXCEPTION 'Acesso administrativo necessario'; END IF;
 UPDATE public.willai_qr_plaques SET status='available',released_at=now(),updated_at=now()
 WHERE code=upper(p_code) AND status='held' AND owner_id IS NULL AND redirect_url IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Codigo inexistente, liberado ou ja ativado'; END IF;
 RETURN jsonb_build_object('ok',true,'code',upper(p_code),'status','available');
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_release(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_release(text) TO authenticated;

COMMIT;
-- Verificacoes:
-- SELECT to_regclass('public.willai_qr_plaques');
-- SELECT to_regprocedure('public.willai_qr_claim(text,text,jsonb)');
-- SELECT to_regprocedure('public.willai_qr_admin_release(text)');
-- SELECT count(*) FROM public.willai_qr_plaques;
