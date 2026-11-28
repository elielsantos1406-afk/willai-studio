-- Camada de personalização da capa, isolada no cardápio WillAI.
alter table public.willai_menu_restaurants
  add column if not exists hero_eyebrow text not null default 'BEM-VINDO',
  add column if not exists hero_headline text not null default 'BATEU A FOME?',
  add column if not exists hero_caption text not null default 'Toque para fazer seu pedido',
  add column if not exists hero_product_url text not null default '';

-- Apenas a capa original do restaurante de teste recebe o novo padrão.
update public.willai_menu_restaurants
set hero_url='https://willai.com.br/willaiburger/assets/cover-default.webp'
where slug='willaiburger'
  and hero_url='https://willai.com.br/willaiburger/assets/hero.webp';
