-- WILLAI | QR primeiro acesso simples (28/10/2026)
-- MIGRAÇÃO ADITIVA: executar APÓS sql/20261028_willai_qr_operacao_v2.sql
-- Projeto: rnqaktkvwfsetbjsqdrj. Faça backup primeiro.
-- Atenção: no modo sem segredo, a primeira conta autenticada que escanear
-- um código "available" consegue ativá-lo. Só disponibilize plaquinhas já entregues.
BEGIN;

-- Reivindicação atômica e vinculada ao usuário autenticado.
CREATE OR REPLACE FUNCTION public.willai_qr_claim(
 p_code text, p_page jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,extensions,pg_temp AS $$
DECLARE v_code text;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN
   RAISE EXCEPTION 'Faça login para ativar a plaquinha';
 END IF;
 IF p_code IS NULL OR upper(p_code) !~ '^W[0-9]{3,8}$' THEN
   RAISE EXCEPTION 'Código de plaquinha inválido';
 END IF;
 IF jsonb_typeof(p_page) <> 'object' OR length(p_page::text) > 750000 THEN
   RAISE EXCEPTION 'Dados inválidos da página';
 END IF;

 -- A concorrência é resolvida por um único UPDATE atômico.
 UPDATE public.willai_qr_plaques
 SET owner_id=(SELECT auth.uid()),status='active',page=p_page,
     activated_at=now(),updated_at=now()
 WHERE code=upper(p_code) AND status='available'
   AND owner_id IS NULL AND redirect_url IS NULL
 RETURNING code INTO v_code;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'Plaquinha indisponível. Se já foi ativada, entre com a conta proprietária.';
 END IF;
 RETURN jsonb_build_object('ok',true,'code',v_code,'status','active');
END
$$;
REVOKE ALL ON FUNCTION public.willai_qr_claim(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_qr_claim(text,jsonb) TO authenticated;

COMMIT;

-- Verificação (somente após executar):
-- select to_regprocedure('public.willai_qr_claim(text,jsonb)') as funcao_ativacao;
-- select count(*) from public.willai_qr_plaques;
