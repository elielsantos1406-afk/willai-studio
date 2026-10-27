-- WILLAI STUDIO — Plaquinhas inteligentes / migration aditiva.
-- Executar SOMENTE no projeto Supabase já utilizado pelo Studio.
-- Não remove, altera ou recria public.willai_pages.
BEGIN;
CREATE SCHEMA IF NOT EXISTS plaque_private;
REVOKE ALL ON SCHEMA plaque_private FROM PUBLIC;
GRANT USAGE ON SCHEMA plaque_private TO anon, authenticated;
-- Apenas contas explicitamente autorizadas podem administrar o estoque.
CREATE TABLE IF NOT EXISTS plaque_private.admin_users (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 added_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON plaque_private.admin_users FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION plaque_private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM plaque_private.admin_users a WHERE a.user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION plaque_private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plaque_private.is_admin() TO authenticated;
CREATE OR REPLACE FUNCTION public.willai_is_plaque_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT plaque_private.is_admin() $$;
REVOKE ALL ON FUNCTION public.willai_is_plaque_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_is_plaque_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.willai_plaque_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 120),
  quantity int NOT NULL CHECK (quantity BETWEEN 1 AND 500),
  unit_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  suggested_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (suggested_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,owner_id)
);
CREATE TABLE IF NOT EXISTS public.willai_plaques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  public_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,24),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  batch_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','active','suspended','replaced')),
  mode text NOT NULL DEFAULT 'direct' CHECK (mode IN ('direct','page')),
  destination_url text,
  page_slug text,
  buyer_name text,
  business_name text,
  buyer_whatsapp text,
  city text,
  notes text,
  sale_price numeric(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  sold_at timestamptz,
  activated_at timestamptz,
  nfc_tested_at timestamptz,
  art_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (batch_id, owner_id) REFERENCES public.willai_plaque_batches (id, owner_id) ON DELETE RESTRICT,
  CHECK (destination_url IS NULL OR (length(destination_url) <= 2000 AND destination_url ~* '^https?://[^[:space:]]+$')),
  CHECK (page_slug IS NULL OR page_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (status <> 'active' OR (mode = 'direct' AND destination_url IS NOT NULL) OR (mode = 'page' AND page_slug IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS willai_plaques_owner_status ON public.willai_plaques(owner_id,status);
CREATE INDEX IF NOT EXISTS willai_plaques_batch ON public.willai_plaques(batch_id);
CREATE INDEX IF NOT EXISTS willai_plaques_business ON public.willai_plaques(owner_id,business_name);
CREATE TABLE IF NOT EXISTS public.willai_plaque_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plaque_id uuid NOT NULL REFERENCES public.willai_plaques(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  happened_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS willai_plaque_events_plaque ON public.willai_plaque_events(plaque_id,happened_at DESC);
CREATE TABLE IF NOT EXISTS public.willai_plaque_daily (
  plaque_id uuid NOT NULL REFERENCES public.willai_plaques(id) ON DELETE RESTRICT,
  day date NOT NULL,
  hits bigint NOT NULL DEFAULT 0 CHECK(hits >= 0),
  PRIMARY KEY(plaque_id,day)
);
CREATE TABLE IF NOT EXISTS public.willai_plaque_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  name text NOT NULL,
  model text NOT NULL CHECK (model IN ('google','instagram','links')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expor apenas os campos administrativos ao proprietário autenticado.
ALTER TABLE public.willai_plaque_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.willai_plaques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.willai_plaque_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.willai_plaque_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.willai_plaque_designs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_plaque_batches,public.willai_plaques,public.willai_plaque_events,public.willai_plaque_daily,public.willai_plaque_designs FROM anon,authenticated;
GRANT SELECT ON public.willai_plaque_batches TO authenticated;
GRANT SELECT, UPDATE ON public.willai_plaques TO authenticated;
GRANT SELECT ON public.willai_plaque_events,public.willai_plaque_daily TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.willai_plaque_designs TO authenticated;
DROP POLICY IF EXISTS willai_batch_owner ON public.willai_plaque_batches;
CREATE POLICY willai_batch_owner ON public.willai_plaque_batches FOR SELECT TO authenticated USING(owner_id=(select auth.uid()) AND (select plaque_private.is_admin()));
DROP POLICY IF EXISTS willai_plaque_owner_select ON public.willai_plaques;
CREATE POLICY willai_plaque_owner_select ON public.willai_plaques FOR SELECT TO authenticated USING(owner_id=(select auth.uid()) AND (select plaque_private.is_admin()));
DROP POLICY IF EXISTS willai_plaque_owner_update ON public.willai_plaques;
CREATE POLICY willai_plaque_owner_update ON public.willai_plaques FOR UPDATE TO authenticated USING(owner_id=(select auth.uid()) AND (select plaque_private.is_admin())) WITH CHECK(owner_id=(select auth.uid()) AND (select plaque_private.is_admin()));
DROP POLICY IF EXISTS willai_events_owner ON public.willai_plaque_events;
CREATE POLICY willai_events_owner ON public.willai_plaque_events FOR SELECT TO authenticated USING(owner_id=(select auth.uid()) AND (select plaque_private.is_admin()));
DROP POLICY IF EXISTS willai_daily_owner ON public.willai_plaque_daily;
CREATE POLICY willai_daily_owner ON public.willai_plaque_daily FOR SELECT TO authenticated USING((select plaque_private.is_admin()) AND EXISTS (SELECT 1 FROM public.willai_plaques p WHERE p.id=plaque_id AND p.owner_id=(select auth.uid())));
DROP POLICY IF EXISTS willai_design_owner ON public.willai_plaque_designs;
CREATE POLICY willai_design_owner ON public.willai_plaque_designs FOR ALL TO authenticated USING(owner_id=(select auth.uid()) AND (select plaque_private.is_admin())) WITH CHECK(owner_id=(select auth.uid()) AND (select plaque_private.is_admin()));

-- Trilha de auditoria gerada pelo banco, não pelo navegador.
CREATE OR REPLACE FUNCTION plaque_private.audit_plaque() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF TG_OP='UPDATE' THEN
    IF (NEW.owner_id,NEW.batch_id,NEW.public_code,NEW.serial_number,NEW.id) IS DISTINCT FROM
       (OLD.owner_id,OLD.batch_id,OLD.public_code,OLD.serial_number,OLD.id) THEN
      RAISE EXCEPTION 'A identidade e o proprietário da plaquinha são imutáveis';
    END IF;
    NEW.updated_at=now();
    INSERT INTO public.willai_plaque_events(plaque_id,owner_id,actor_id,action,detail)
    VALUES (NEW.id,NEW.owner_id,auth.uid(),'update',jsonb_build_object('from_status',OLD.status,'to_status',NEW.status,'old_mode',OLD.mode,'new_mode',NEW.mode,'destination_changed',OLD.destination_url IS DISTINCT FROM NEW.destination_url,'customer_changed',OLD.buyer_name IS DISTINCT FROM NEW.buyer_name,'old_destination',OLD.destination_url,'new_destination',NEW.destination_url,'old_page',OLD.page_slug,'new_page',NEW.page_slug));
    RETURN NEW;
  END IF;
  INSERT INTO public.willai_plaque_events(plaque_id,owner_id,actor_id,action,detail)
  VALUES (NEW.id,NEW.owner_id,auth.uid(),'created',jsonb_build_object('batch_id',NEW.batch_id));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION plaque_private.audit_plaque() FROM PUBLIC;
DROP TRIGGER IF EXISTS willai_plaque_audit ON public.willai_plaques;
CREATE TRIGGER willai_plaque_audit BEFORE UPDATE ON public.willai_plaques FOR EACH ROW EXECUTE FUNCTION plaque_private.audit_plaque();
DROP TRIGGER IF EXISTS willai_plaque_audit_insert ON public.willai_plaques;
CREATE TRIGGER willai_plaque_audit_insert AFTER INSERT ON public.willai_plaques FOR EACH ROW EXECUTE FUNCTION plaque_private.audit_plaque();

-- Uma transação cria lote e suas unidades: nunca deixa lote pela metade.
CREATE OR REPLACE FUNCTION plaque_private.make_batch(p_quantity integer,p_label text,p_unit_cost numeric,p_suggested_price numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid := auth.uid(); batch uuid; n integer;
BEGIN
  IF uid IS NULL OR NOT plaque_private.is_admin() THEN RAISE EXCEPTION 'Administrador não autorizado'; END IF;
  IF p_quantity NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Quantidade deve ser entre 1 e 500'; END IF;
  IF length(trim(coalesce(p_label,''))) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Nome do lote inválido'; END IF;
  IF coalesce(p_unit_cost,0)<0 OR coalesce(p_suggested_price,0)<0 THEN RAISE EXCEPTION 'Valores negativos não permitidos'; END IF;
  INSERT INTO public.willai_plaque_batches(owner_id,label,quantity,unit_cost,suggested_price)
  VALUES(uid,trim(p_label),p_quantity,coalesce(p_unit_cost,0),coalesce(p_suggested_price,0)) RETURNING id INTO batch;
  FOR n IN 1..p_quantity LOOP
    INSERT INTO public.willai_plaques(owner_id,batch_id) VALUES(uid,batch);
  END LOOP;
  RETURN jsonb_build_object('batch_id',batch,'quantity',p_quantity);
END $$;
REVOKE ALL ON FUNCTION plaque_private.make_batch(integer,text,numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plaque_private.make_batch(integer,text,numeric,numeric) TO authenticated;
CREATE OR REPLACE FUNCTION public.willai_create_plaque_batch(p_quantity integer,p_label text,p_unit_cost numeric DEFAULT 0,p_suggested_price numeric DEFAULT 0)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT plaque_private.make_batch(p_quantity,p_label,p_unit_cost,p_suggested_price)
$$;
REVOKE ALL ON FUNCTION public.willai_create_plaque_batch(integer,text,numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_create_plaque_batch(integer,text,numeric,numeric) TO authenticated;

-- API pública muito restrita: não permite listagem de estoque, cliente, preço ou IDs internos.
-- Escondida em schema NÃO exposto à API; acessível somente via wrapper sem privilégios.
CREATE OR REPLACE FUNCTION plaque_private.resolve_plaque(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record;
BEGIN
  IF p_code IS NULL OR p_code !~ '^[0-9a-f]{24}$' THEN RETURN jsonb_build_object('status','not_found'); END IF;
  SELECT id,status,mode,destination_url,page_slug INTO r FROM public.willai_plaques WHERE public_code=p_code;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF r.status<>'active' THEN RETURN jsonb_build_object('status',CASE WHEN r.status='suspended' THEN 'suspended' ELSE 'inactive' END); END IF;
  INSERT INTO public.willai_plaque_daily(plaque_id,day,hits) VALUES(r.id,current_date,1)
  ON CONFLICT(plaque_id,day) DO UPDATE SET hits=public.willai_plaque_daily.hits+1;
  IF r.mode='direct' THEN RETURN jsonb_build_object('status','active','mode','direct','url',r.destination_url); END IF;
  RETURN jsonb_build_object('status','active','mode','page','slug',r.page_slug);
END $$;
REVOKE ALL ON FUNCTION plaque_private.resolve_plaque(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plaque_private.resolve_plaque(text) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.willai_resolve_plaque(p_code text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT plaque_private.resolve_plaque(p_code)
$$;
REVOKE ALL ON FUNCTION public.willai_resolve_plaque(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_resolve_plaque(text) TO anon, authenticated;
-- Estatísticas administrativas calculadas no banco, sem limite artificial de linhas na API.
CREATE OR REPLACE FUNCTION public.willai_plaque_dashboard()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' STABLE AS $$
 WITH mine AS (SELECT id,status,sold_at FROM public.willai_plaques WHERE owner_id=auth.uid()),
 counts AS (SELECT count(*) total,count(*) FILTER(WHERE status='available') available,count(*) FILTER(WHERE status='reserved') reserved,count(*) FILTER(WHERE status='active') active,count(*) FILTER(WHERE status='suspended') suspended,count(*) FILTER(WHERE status='replaced') replaced,count(*) FILTER(WHERE sold_at IS NOT NULL) sold FROM mine),
 visits AS (SELECT coalesce(sum(d.hits),0) hits FROM public.willai_plaque_daily d JOIN mine p ON p.id=d.plaque_id)
 SELECT jsonb_build_object('total',c.total,'available',c.available,'reserved',c.reserved,'active',c.active,'suspended',c.suspended,'replaced',c.replaced,'sold',c.sold,'hits',v.hits) FROM counts c CROSS JOIN visits v
$$;
REVOKE ALL ON FUNCTION public.willai_plaque_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_plaque_dashboard() TO authenticated;
CREATE OR REPLACE FUNCTION public.willai_plaque_hit_totals()
RETURNS TABLE(plaque_id uuid,hits bigint) LANGUAGE sql SECURITY INVOKER SET search_path='' STABLE AS $$
 SELECT p.id,coalesce(sum(d.hits),0)::bigint FROM public.willai_plaques p LEFT JOIN public.willai_plaque_daily d ON d.plaque_id=p.id
 WHERE p.owner_id=auth.uid() GROUP BY p.id
$$;
REVOKE ALL ON FUNCTION public.willai_plaque_hit_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_plaque_hit_totals() TO authenticated;
COMMIT;

-- Verificação (somente consulta):
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'willai_plaque%';
-- SELECT public.willai_resolve_plaque('000000000000000000000000');

