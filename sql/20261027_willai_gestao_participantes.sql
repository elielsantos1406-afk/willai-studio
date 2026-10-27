-- WILLAI STUDIO: gestão de participantes e acessos por cidade.
-- Executar APENAS no projeto Supabase rnqaktkvwfsetbjsqdrj após fazer backup.
-- Migração aditiva: não modifica tabelas ou dados do Studio, portal ou plaquinhas.
BEGIN;

CREATE TABLE IF NOT EXISTS public.willai_access_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('city_manager','sponsor','company')),
  city_slug text CHECK (city_slug IS NULL OR city_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  company_slug text CHECK (company_slug IS NULL OR company_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((role IN ('city_manager','sponsor') AND city_slug IS NOT NULL) OR (role='company' AND company_slug IS NOT NULL))
);
ALTER TABLE public.willai_access_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_access_roles FROM anon,authenticated;
GRANT SELECT ON public.willai_access_roles TO authenticated;
DROP POLICY IF EXISTS willai_access_read ON public.willai_access_roles;
CREATE POLICY willai_access_read ON public.willai_access_roles FOR SELECT TO authenticated
USING (user_id=(select auth.uid()) OR EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid())));

CREATE TABLE IF NOT EXISTS public.willai_project_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug text NOT NULL CHECK (city_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  participant_name text NOT NULL CHECK (length(trim(participant_name)) BETWEEN 2 AND 160),
  business_name text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'registered'
    CHECK(status IN ('interested','registered','in_progress','benefit','completed','inactive')),
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS willai_participants_city_status_idx
 ON public.willai_project_participants(city_slug,status);
ALTER TABLE public.willai_project_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_project_participants FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.willai_project_participants TO authenticated;
DROP POLICY IF EXISTS willai_participants_select ON public.willai_project_participants;
CREATE POLICY willai_participants_select ON public.willai_project_participants FOR SELECT TO authenticated
USING (
 EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid()))
 OR EXISTS (SELECT 1 FROM public.willai_access_roles r WHERE r.user_id=(select auth.uid()) AND r.role='city_manager' AND r.city_slug=city_slug)
);
DROP POLICY IF EXISTS willai_participants_insert ON public.willai_project_participants;
CREATE POLICY willai_participants_insert ON public.willai_project_participants FOR INSERT TO authenticated
WITH CHECK (created_by=(select auth.uid()) AND (
 EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid()))
 OR EXISTS (SELECT 1 FROM public.willai_access_roles r WHERE r.user_id=(select auth.uid()) AND r.role='city_manager' AND r.city_slug=city_slug)
));
DROP POLICY IF EXISTS willai_participants_update ON public.willai_project_participants;
CREATE POLICY willai_participants_update ON public.willai_project_participants FOR UPDATE TO authenticated
USING (
 EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid()))
 OR EXISTS (SELECT 1 FROM public.willai_access_roles r WHERE r.user_id=(select auth.uid()) AND r.role='city_manager' AND r.city_slug=city_slug)
)
WITH CHECK (
 EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid()))
 OR EXISTS (SELECT 1 FROM public.willai_access_roles r WHERE r.user_id=(select auth.uid()) AND r.role='city_manager' AND r.city_slug=city_slug)
);
-- Cidade, criador e ID imutáveis após cadastro (evita transferência indevida de registro).
CREATE OR REPLACE FUNCTION public.willai_participant_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF (NEW.id,NEW.city_slug,NEW.created_by,NEW.created_at) IS DISTINCT FROM
    (OLD.id,OLD.city_slug,OLD.created_by,OLD.created_at) THEN
    RAISE EXCEPTION 'Cidade e identidade do cadastro são imutáveis';
 END IF;
 NEW.updated_at=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.willai_participant_guard() FROM PUBLIC;
DROP TRIGGER IF EXISTS willai_participants_guard ON public.willai_project_participants;
CREATE TRIGGER willai_participants_guard BEFORE UPDATE ON public.willai_project_participants
FOR EACH ROW EXECUTE FUNCTION public.willai_participant_guard();

-- Somente o admin já autorizado no portal pode conceder acesso a usuário Auth EXISTENTE.
CREATE OR REPLACE FUNCTION public.willai_access_assign(
 p_email text,p_role text,p_city_slug text DEFAULT NULL,p_company_slug text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; cs text := nullif(lower(trim(coalesce(p_city_slug,''))), '');
DECLARE bs text := nullif(lower(trim(coalesce(p_company_slug,''))), '');
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=auth.uid()) THEN
   RAISE EXCEPTION 'Acesso negado';
 END IF;
 IF p_role NOT IN ('city_manager','sponsor','company') THEN RAISE EXCEPTION 'Perfil inválido'; END IF;
 IF p_role IN ('city_manager','sponsor') AND (cs IS NULL OR cs !~ '^[a-z0-9]+(-[a-z0-9]+)*$') THEN
    RAISE EXCEPTION 'Cidade inválida';
 END IF;
 IF p_role='company' AND (bs IS NULL OR bs !~ '^[a-z0-9]+(-[a-z0-9]+)*$') THEN
    RAISE EXCEPTION 'Empresa inválida';
 END IF;
 SELECT id INTO uid FROM auth.users WHERE lower(email)=lower(trim(p_email)) LIMIT 1;
 IF uid IS NULL THEN RAISE EXCEPTION 'Usuário não existe no Supabase Auth; crie-o antes'; END IF;
 INSERT INTO public.willai_access_roles (user_id,role,city_slug,company_slug)
 VALUES (uid,p_role,CASE WHEN p_role='company' THEN NULL ELSE cs END,CASE WHEN p_role='company' THEN bs ELSE NULL END)
 ON CONFLICT (user_id) DO UPDATE SET role=EXCLUDED.role,city_slug=EXCLUDED.city_slug,
 company_slug=EXCLUDED.company_slug,updated_at=now();
 RETURN 'Acesso autorizado';
END $$;
REVOKE ALL ON FUNCTION public.willai_access_assign(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_access_assign(text,text,text,text) TO authenticated;

-- Diretório privado de acessos, sem exposição pública de emails.
CREATE OR REPLACE FUNCTION public.willai_access_directory()
RETURNS TABLE(email text,role text,city_slug text,company_slug text) LANGUAGE plpgsql
SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=auth.uid()) THEN
   RAISE EXCEPTION 'Acesso negado';
 END IF;
 RETURN QUERY SELECT u.email::text,r.role,r.city_slug,r.company_slug
 FROM public.willai_access_roles r JOIN auth.users u ON u.id=r.user_id ORDER BY u.email;
END $$;
REVOKE ALL ON FUNCTION public.willai_access_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_access_directory() TO authenticated;

-- Patrocinadores podem consultar apenas indicadores agregados da cidade atribuída.
CREATE OR REPLACE FUNCTION public.willai_city_summary(p_city_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (
   EXISTS(SELECT 1 FROM public.willai_portal_admins WHERE user_id=auth.uid())
   OR EXISTS(SELECT 1 FROM public.willai_access_roles
        WHERE user_id=auth.uid() AND role IN ('city_manager','sponsor') AND city_slug=p_city_slug)
 ) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 SELECT jsonb_build_object(
  'city',p_city_slug,'total',COUNT(*),
  'interested',COUNT(*) FILTER(WHERE status='interested'),
  'registered',COUNT(*) FILTER(WHERE status='registered'),
  'in_progress',COUNT(*) FILTER(WHERE status='in_progress'),
  'benefit',COUNT(*) FILTER(WHERE status='benefit'),
  'completed',COUNT(*) FILTER(WHERE status='completed'),
  'inactive',COUNT(*) FILTER(WHERE status='inactive')
 ) INTO result FROM public.willai_project_participants WHERE city_slug=p_city_slug;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.willai_city_summary(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.willai_city_summary(text) TO authenticated;
COMMIT;

-- Verificações:
-- SELECT to_regclass('public.willai_project_participants'), to_regclass('public.willai_access_roles');
-- SELECT proname FROM pg_proc WHERE proname IN ('willai_access_assign','willai_city_summary');
