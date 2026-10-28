-- WILLAI QR STUDIO V2 | Instalar apenas no projeto rnqaktkvwfsetbjsqdrj
-- ADITIVA. NÃO altera os dados das tabelas de pessoas, empresas ou projeto social.
-- Faça backup. Após instalar: valide o login e a W001 antes de imprimir lotes.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.willai_portal_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, added_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.willai_portal_admins ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.willai_qr_plaques(
 code text PRIMARY KEY CHECK (code ~ '^W[0-9]{3,8}$'),
 secret_hash text NOT NULL,
 owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','active','disabled')),
 page jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 activated_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.willai_qr_plaques ADD COLUMN IF NOT EXISTS redirect_url text;
ALTER TABLE public.willai_qr_plaques ADD COLUMN IF NOT EXISTS print_model text DEFAULT 'willai';
ALTER TABLE public.willai_qr_plaques ADD COLUMN IF NOT EXISTS batch_id uuid;
CREATE INDEX IF NOT EXISTS willai_qr_plaques_owner_v2 ON public.willai_qr_plaques(owner_id);
CREATE INDEX IF NOT EXISTS willai_qr_plaques_batch_v2 ON public.willai_qr_plaques(batch_id);
ALTER TABLE public.willai_qr_plaques ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_qr_plaques FROM anon,authenticated;

-- Publicação: fornece somente status e dados publicados. Nunca revela segredo.
CREATE OR REPLACE FUNCTION public.willai_qr_public(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
SELECT CASE WHEN p.redirect_url IS NOT NULL AND p.status='available'
 THEN jsonb_build_object('code',p.code,'status','redirect','redirect_url',p.redirect_url)
 WHEN p.status='active'
 THEN jsonb_build_object('code',p.code,'status','active','page',p.page)
 ELSE jsonb_build_object('code',p.code,'status',p.status) END
FROM public.willai_qr_plaques p WHERE p.code=upper(p_code)
$$;
REVOKE ALL ON FUNCTION public.willai_qr_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_public(text) TO anon,authenticated;

-- Vínculo inicial: conta autenticada + segredo exclusivo, informado uma única vez.
CREATE OR REPLACE FUNCTION public.willai_qr_activate(p_code text,p_secret text,p_page jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE r public.willai_qr_plaques%rowtype;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login para ativar'; END IF;
 IF length(p_secret)<16 THEN RAISE EXCEPTION 'Segredo inválido'; END IF;
 SELECT * INTO r FROM public.willai_qr_plaques
  WHERE code=upper(p_code) FOR UPDATE;
 IF NOT FOUND OR r.status<>'available' OR r.owner_id IS NOT NULL OR r.redirect_url IS NOT NULL
 THEN RAISE EXCEPTION 'Plaquinha indisponível para ativação'; END IF;
 IF crypt(p_secret,r.secret_hash)<>r.secret_hash THEN RAISE EXCEPTION 'Segredo inválido'; END IF;
 UPDATE public.willai_qr_plaques SET status='active',owner_id=auth.uid(),page=coalesce(p_page,'{}'::jsonb),
 activated_at=now(),updated_at=now() WHERE code=r.code;
 RETURN jsonb_build_object('ok',true,'code',r.code);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_activate(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_activate(text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_owned(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
SELECT jsonb_build_object('code',code,'status',status,'page',page)
FROM public.willai_qr_plaques WHERE code=upper(p_code) AND owner_id=auth.uid() AND status='active'
$$;
REVOKE ALL ON FUNCTION public.willai_qr_owned(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_owned(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_save(p_code text,p_page jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login necessário'; END IF;
 IF jsonb_typeof(p_page)<>'object' OR length(p_page::text)>750000 THEN RAISE EXCEPTION 'Página inválida'; END IF;
 UPDATE public.willai_qr_plaques SET page=p_page,updated_at=now()
 WHERE code=upper(p_code) AND owner_id=auth.uid() AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Sem permissão para salvar esta plaquinha'; END IF;
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_save(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_save(text,jsonb) TO authenticated;

-- Administração: NÃO recebe permissões a partir de metadados editáveis pelo usuário.
-- Somente contas explicitamente inscritas em willai_portal_admins.
CREATE OR REPLACE FUNCTION public.willai_qr_admin_generate_batch(p_count integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE n bigint; i integer; c text; s text; b uuid:=gen_random_uuid(); result jsonb:='[]'::jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.willai_portal_admins WHERE user_id=auth.uid())
 THEN RAISE EXCEPTION 'Acesso administrativo necessário'; END IF;
 IF p_count<1 OR p_count>100 THEN RAISE EXCEPTION 'Gere entre 1 e 100 códigos por lote'; END IF;
 PERFORM pg_advisory_xact_lock(54681234);
 SELECT COALESCE(MAX(substring(code FROM 2)::bigint),0) INTO n FROM public.willai_qr_plaques;
 FOR i IN 1..p_count LOOP
  n:=n+1;c:='W'||lpad(n::text,3,'0');
  s:=encode(gen_random_bytes(24),'hex');
  INSERT INTO public.willai_qr_plaques(code,secret_hash,batch_id)
  VALUES(c,crypt(s,gen_salt('bf',10)),b);
  result:=result||jsonb_build_array(jsonb_build_object('code',c,'secret',s,'link','https://willai.com.br/qr/'||c));
 END LOOP;
 RETURN jsonb_build_object('batch_id',b,'items',result);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_generate_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_generate_batch(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_admin_inventory()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE out_data jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.willai_portal_admins WHERE user_id=auth.uid())
 THEN RAISE EXCEPTION 'Acesso administrativo necessário'; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('code',code,'status',status,'batch_id',batch_id,'redirect_url',redirect_url,
  'created_at',created_at) ORDER BY code),'[]'::jsonb) INTO out_data
 FROM public.willai_qr_plaques;
 RETURN out_data;
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_inventory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_inventory() TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_admin_redirect(p_code text,p_url text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE u text;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.willai_portal_admins WHERE user_id=auth.uid())
 THEN RAISE EXCEPTION 'Acesso administrativo necessário'; END IF;
 u:=nullif(btrim(coalesce(p_url,'')),'');
 IF u IS NOT NULL AND (length(u)>2048 OR u!~*'^https?://[^[:space:]]+$') THEN
 RAISE EXCEPTION 'Informe URL HTTP(S) válida'; END IF;
 UPDATE public.willai_qr_plaques SET redirect_url=u,updated_at=now()
 WHERE code=upper(p_code) AND status='available' AND owner_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Código não encontrado ou já ativado'; END IF;
 RETURN jsonb_build_object('ok',true,'code',upper(p_code));
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_redirect(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_redirect(text,text) TO authenticated;
COMMIT;

-- TESTES MANUAIS APÓS A INSTALAÇÃO:
-- SELECT to_regclass('public.willai_qr_plaques') AS tabela_qr;
-- SELECT proname FROM pg_proc WHERE proname LIKE 'willai_qr_%';
-- Não execute geração de lotes pelo SQL Editor sem sessão de usuário;
-- faça-a pelo painel administrativo autenticado após a integração.
