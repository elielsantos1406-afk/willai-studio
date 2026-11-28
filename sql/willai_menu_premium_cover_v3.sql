-- Nova capa padrão para restaurantes que não enviarem uma arte própria.
alter table public.willai_menu_restaurants
  alter column hero_url set default 'https://willai.com.br/willaiburger/assets/cover-premium.webp',
  alter column hero_headline set default 'Seu próximo favorito está aqui.',
  alter column hero_caption set default 'Toque na tela para começar';

-- Preserva personalizações já feitas pelo proprietário.
update public.willai_menu_restaurants
set hero_url = 'https://willai.com.br/willaiburger/assets/cover-premium.webp'
where slug = 'willaiburger'
  and hero_url = 'https://willai.com.br/willaiburger/assets/cover-default.webp';

update public.willai_menu_restaurants
set hero_headline = 'Seu próximo favorito está aqui.'
where slug = 'willaiburger' and hero_headline = 'BATEU A FOME?';

update public.willai_menu_restaurants
set hero_caption = 'Toque na tela para começar'
where slug = 'willaiburger' and hero_caption = 'Toque para fazer seu pedido';
