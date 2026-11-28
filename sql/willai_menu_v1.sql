-- WillAI Cardápios: esquema isolado. Não altera as tabelas dos outros sistemas.
create table if not exists public.willai_menu_restaurants (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  whatsapp text not null default '',
  hero_url text not null default '',
  logo_url text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.willai_menu_members (
  restaurant_id bigint not null references public.willai_menu_restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','editor')),
  primary key (restaurant_id,user_id)
);
create index if not exists willai_menu_members_user_idx on public.willai_menu_members(user_id);
create table if not exists public.willai_menu_products (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.willai_menu_restaurants(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  category text not null default 'Outros',
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2) check (old_price is null or old_price >= 0),
  image_url text not null default '',
  sort_order integer not null default 0,
  featured boolean not null default false,
  available boolean not null default true,
  extras jsonb not null default '[]'::jsonb check (jsonb_typeof(extras)='array'),
  created_at timestamptz not null default now()
);
create index if not exists willai_menu_products_restaurant_idx on public.willai_menu_products(restaurant_id,sort_order);

alter table public.willai_menu_restaurants enable row level security;
alter table public.willai_menu_members enable row level security;
alter table public.willai_menu_products enable row level security;

create policy willai_menu_restaurants_read on public.willai_menu_restaurants for select to anon, authenticated
using (published or exists (select 1 from public.willai_menu_members m where m.restaurant_id=id and m.user_id=(select auth.uid())));
create policy willai_menu_restaurants_edit on public.willai_menu_restaurants for update to authenticated
using (exists (select 1 from public.willai_menu_members m where m.restaurant_id=id and m.user_id=(select auth.uid())))
with check (exists (select 1 from public.willai_menu_members m where m.restaurant_id=id and m.user_id=(select auth.uid())));
create policy willai_menu_members_read on public.willai_menu_members for select to authenticated
using (user_id=(select auth.uid()));
create policy willai_menu_products_read on public.willai_menu_products for select to anon, authenticated
using (exists (select 1 from public.willai_menu_restaurants r where r.id=restaurant_id and r.published));
create policy willai_menu_products_insert on public.willai_menu_products for insert to authenticated
with check (exists (select 1 from public.willai_menu_members m where m.restaurant_id=willai_menu_products.restaurant_id and m.user_id=(select auth.uid())));
create policy willai_menu_products_update on public.willai_menu_products for update to authenticated
using (exists (select 1 from public.willai_menu_members m where m.restaurant_id=willai_menu_products.restaurant_id and m.user_id=(select auth.uid())))
with check (exists (select 1 from public.willai_menu_members m where m.restaurant_id=willai_menu_products.restaurant_id and m.user_id=(select auth.uid())));
create policy willai_menu_products_delete on public.willai_menu_products for delete to authenticated
using (exists (select 1 from public.willai_menu_members m where m.restaurant_id=willai_menu_products.restaurant_id and m.user_id=(select auth.uid())));

grant select on public.willai_menu_restaurants, public.willai_menu_products to anon;
grant select, update on public.willai_menu_restaurants to authenticated;
grant select on public.willai_menu_members to authenticated;
grant select, insert, update, delete on public.willai_menu_products to authenticated;
grant usage, select on sequence public.willai_menu_products_id_seq to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('willai-menu-images','willai-menu-images',true,2097152,array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy willai_menu_images_insert on storage.objects for insert to authenticated
with check (bucket_id='willai-menu-images' and exists (
  select 1 from public.willai_menu_restaurants r
  join public.willai_menu_members m on m.restaurant_id=r.id
  where r.slug=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));
create policy willai_menu_images_update on storage.objects for update to authenticated
using (bucket_id='willai-menu-images' and exists (
  select 1 from public.willai_menu_restaurants r
  join public.willai_menu_members m on m.restaurant_id=r.id
  where r.slug=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
))
with check (bucket_id='willai-menu-images' and exists (
  select 1 from public.willai_menu_restaurants r
  join public.willai_menu_members m on m.restaurant_id=r.id
  where r.slug=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));
create policy willai_menu_images_delete on storage.objects for delete to authenticated
using (bucket_id='willai-menu-images' and exists (
  select 1 from public.willai_menu_restaurants r
  join public.willai_menu_members m on m.restaurant_id=r.id
  where r.slug=(storage.foldername(name))[1] and m.user_id=(select auth.uid())
));

insert into public.willai_menu_restaurants(slug,name,hero_url,logo_url)
values('willaiburger','WillAI Burger','https://willai.com.br/willaiburger/assets/hero.webp','https://willai.com.br/willaiburger/assets/logo.webp')
on conflict (slug) do nothing;

insert into public.willai_menu_members(restaurant_id,user_id,role)
select r.id,a.user_id,'owner' from public.willai_menu_restaurants r cross join public.willai_admins a
where r.slug='willaiburger' on conflict do nothing;
