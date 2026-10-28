-- WILLAI QR: o usuario pode solicitar vinculacao sem possuir o segredo do lote.
-- A solicitacao nao ativa nem publica a plaquinha.
BEGIN;
CREATE OR REPLACE FUNCTION public.willai_qr_request_claim(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.willai_qr_plaques
   WHERE code=upper(p_code) AND status='available' AND owner_id IS NULL)
 THEN RAISE EXCEPTION 'Esta plaquinha nao foi liberada ou ja esta ativada'; END IF;
 INSERT INTO public.willai_qr_claim_requests(code,user_id,email)
 VALUES(upper(p_code),(SELECT auth.uid()),left(coalesce(auth.jwt()->>'email',''),250))
 ON CONFLICT(code,user_id) DO UPDATE SET requested_at=now();
 RETURN jsonb_build_object('ok',true,'status','pending_approval');
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_request_claim(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.willai_qr_request_claim(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_admin_claim_requests()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(
 SELECT 1 FROM public.willai_portal_admins WHERE user_id=(SELECT auth.uid())
 ) THEN RAISE EXCEPTION 'Acesso administrativo necessario'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('code',r.code,'user_id',r.user_id,
   'email',r.email,'requested_at',r.requested_at)
 ORDER BY r.requested_at DESC),'[]'::jsonb)
 INTO v_result
 FROM (SELECT q.code,q.user_id,q.email,q.requested_at
 FROM public.willai_qr_claim_requests q
 JOIN public.willai_qr_plaques p ON p.code=q.code
 WHERE p.status='available' AND p.owner_id IS NULL
 ORDER BY q.requested_at DESC LIMIT 200) r;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_claim_requests() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_claim_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.willai_qr_admin_approve_claim(p_code text,p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,extensions,pg_temp AS $$
DECLARE v_code text;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(
 SELECT 1 FROM public.willai_portal_admins WHERE user_id=(SELECT auth.uid())
 ) THEN RAISE EXCEPTION 'Acesso administrativo necessario'; END IF;
 UPDATE public.willai_qr_plaques p
 SET owner_id=p_user_id,status='active',activated_at=now(),published_at=NULL,
 updated_at=now()
 WHERE p.code=upper(p_code) AND p.status='available'
 AND p.owner_id IS NULL AND p.released_at IS NOT NULL
 AND EXISTS(SELECT 1 FROM public.willai_qr_claim_requests q
 WHERE q.code=p.code AND q.user_id=p_user_id)
 RETURNING p.code INTO v_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Confirme a entrega e os dados do solicitante'; END IF;
 RETURN jsonb_build_object('ok',true,'code',v_code);
END $$;
REVOKE ALL ON FUNCTION public.willai_qr_admin_approve_claim(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.willai_qr_admin_approve_claim(text,uuid) TO authenticated;
COMMIT;