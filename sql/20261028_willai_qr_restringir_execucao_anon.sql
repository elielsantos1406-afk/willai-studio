-- Aplicado no Supabase oficial em 28/10/2026, migracao:
-- willai_qr_restringir_execucao_anon
-- Correcoes de grants explicitos: REVOKE FROM PUBLIC sozinho nao revoga grants diretos a anon.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.willai_qr_activate(text,text,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_admin_generate_batch(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_admin_inventory() FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_admin_redirect(text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_admin_release(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_claim(text,text,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_owned(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.willai_qr_save(text,jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.willai_qr_public(text) TO anon,authenticated;
COMMIT;
