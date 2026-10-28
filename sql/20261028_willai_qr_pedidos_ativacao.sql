-- Tabela aditiva de pedidos de ativacao de QR sem segredo impresso.
BEGIN;
CREATE TABLE IF NOT EXISTS public.willai_qr_claim_requests(
 code text NOT NULL REFERENCES public.willai_qr_plaques(code),
 user_id uuid NOT NULL,
 email text NOT NULL DEFAULT '',
 requested_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(code,user_id)
);
ALTER TABLE public.willai_qr_claim_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_qr_claim_requests FROM anon,authenticated;
COMMIT;