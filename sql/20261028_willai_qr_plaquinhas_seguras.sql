
-- Aplicar SOMENTE no projeto Supabase da WillAI, após revisão e backup.
-- Sem alteração das tabelas existentes do Projeto de Inclusão Digital.
create extension if not exists pgcrypto;
create table if not exists public.willai_qr_plaques (
 code text primary key check(code ~ '^W[0-9]{3,8}$'),
 secret_hash text not null,
 owner_id uuid references auth.users(id) on delete set null,
 status text not null default 'available' check(status in ('available','active','disabled')),
 page jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 activated_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint qr_active_owner check(status <> 'active' or owner_id is not null)
);
create index if not exists willai_qr_owner_idx on public.willai_qr_plaques(owner_id);
alter table public.willai_qr_plaques enable row level security;
revoke all on public.willai_qr_plaques from anon, authenticated;
-- RPC retorna apenas dados públicos da plaquinha, jamais secret_hash nem owner_id.
create or replace function public.willai_qr_public(p_code text)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select case when p.status='active' then jsonb_build_object('status','active','code',p.code,'page',p.page)
             when p.status='available' then jsonb_build_object('status','available','code',p.code)
             else jsonb_build_object('status','disabled','code',p.code) end
 from public.willai_qr_plaques p where p.code=upper(p_code)
$$;
revoke all on function public.willai_qr_public(text) from public;
grant execute on function public.willai_qr_public(text) to anon, authenticated;
-- A posse exige sessão autenticada + segredo que NÃO aparece no QR.
create or replace function public.willai_qr_activate(p_code text,p_secret text,p_page jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.willai_qr_plaques%rowtype;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta para ativar'; end if;
 if length(p_secret)<16 then raise exception 'Código de ativação inválido'; end if;
 select * into r from public.willai_qr_plaques where code=upper(p_code) for update;
 if not found or r.status<>'available' or r.owner_id is not null then
    raise exception 'Plaquinha indisponível ou já ativada';
 end if;
 if crypt(p_secret,r.secret_hash)<>r.secret_hash then raise exception 'Código de ativação inválido'; end if;
 update public.willai_qr_plaques set owner_id=auth.uid(),status='active',page=coalesce(p_page,'{}'::jsonb),
 activated_at=now(),updated_at=now() where code=r.code;
 return jsonb_build_object('ok',true,'code',r.code);
end $$;
revoke all on function public.willai_qr_activate(text,text,jsonb) from public;
grant execute on function public.willai_qr_activate(text,text,jsonb) to authenticated;
create or replace function public.willai_qr_save(p_code text,p_page jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 if jsonb_typeof(p_page) <> 'object' or length(p_page::text)>450000 then raise exception 'Página inválida ou muito grande'; end if;
 update public.willai_qr_plaques set page=p_page,updated_at=now()
 where code=upper(p_code) and owner_id=auth.uid() and status='active';
 if not found then raise exception 'Sem permissão para editar esta plaquinha'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.willai_qr_save(text,jsonb) from public;
grant execute on function public.willai_qr_save(text,jsonb) to authenticated;
create or replace function public.willai_qr_owned(p_code text)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('code',code,'page',page,'status',status)
 from public.willai_qr_plaques where code=upper(p_code) and owner_id=auth.uid() and status='active'
$$;
revoke all on function public.willai_qr_owned(text) from public;
grant execute on function public.willai_qr_owned(text) to authenticated;
-- Primeira plaquinha: gerar um SEGREDO FORTE, entregar SOMENTE ao comprador.
-- Substituir a linha de demonstração por execução administrativa controlada:
-- with s as (select encode(gen_random_bytes(18),'hex') secret)
-- insert into public.willai_qr_plaques(code,secret_hash)
-- select 'W001',crypt(secret,gen_salt('bf')) from s
-- returning code;
-- Para recuperar o segredo em uma única operação de provisionamento:
-- with s as (select encode(gen_random_bytes(18),'hex') secret),
-- ins as (insert into public.willai_qr_plaques(code,secret_hash)
-- select 'W001',crypt(secret,gen_salt('bf')) from s returning code)
-- select ins.code,s.secret from ins cross join s;
-- NÃO utilizar o texto de demonstração ATIVAR-W001 na produção.
