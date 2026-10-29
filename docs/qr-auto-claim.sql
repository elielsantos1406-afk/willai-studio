-- Requested flow: first authenticated account claims a released public QR without admin approval.
-- Public code possession is sufficient; keep stock held until delivery.
CREATE OR REPLACE FUNCTION public.willai_qr_request_claim(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions','pg_temp' AS $$
DECLARE uid uuid:=auth.uid(); claimed text;
BEGIN
IF uid IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
IF p_code IS NULL OR upper(p_code) !~ '^W[0-9]{3,8}$' THEN RAISE EXCEPTION 'Código inválido'; END IF;
-- First authenticated account wins atomically, only after stock release.
UPDATE public.willai_qr_plaques p
SET owner_id=uid,status='active',activated_at=now(),published_at=NULL,updated_at=now()
WHERE p.code=upper(p_code) AND p.status='available' AND p.owner_id IS NULL
AND p.released_at IS NOT NULL AND p.redirect_url IS NULL
RETURNING p.code INTO claimed;
IF claimed IS NULL THEN
 -- Safe retry for the same owner; never replace another owner.
 IF EXISTS(SELECT 1 FROM public.willai_qr_plaques p WHERE p.code=upper(p_code) AND p.status='active' AND p.owner_id=uid AND p.redirect_url IS NULL)
 THEN RETURN jsonb_build_object('ok',true,'status','active','code',upper(p_code)); END IF;
 RAISE EXCEPTION 'Esta plaquinha não foi liberada ou já pertence a outra conta';
END IF;
RETURN jsonb_build_object('ok',true,'status','active','code',claimed);
END $$;
