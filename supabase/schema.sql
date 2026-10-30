-- =====================================================================
-- TMRD · Tarefa de Maior Risco do Dia — estrutura do banco (Supabase)
-- Rode tudo no Supabase: SQL Editor → New query → colar → Run.
-- =====================================================================

-- gen_random_uuid() já vem no Postgres 13+

create table if not exists public.tmrd_registros (
  id            uuid primary key default gen_random_uuid(),
  data          date        not null default (now() at time zone 'America/Sao_Paulo')::date,
  criado_em     timestamptz not null default now(),
  topico        text        not null check (topico in
                  ('quimicos','confinado','quente','icamento','energias','altura',
                   'telhado','equip','logistica','terceiros','outros')),
  topico_outro  text        check (char_length(topico_outro) <= 60),
  atividade     text        not null check (char_length(atividade) between 1 and 280),
  area          text        not null check (char_length(area) between 1 and 40),
  local         text        check (char_length(local) <= 60),
  turno         text        check (turno in ('1º','2º','3º','ADM')),
  inicio        time,
  fim           time,
  controles     text[]      not null default '{}',
  responsavel   text        check (char_length(responsavel) <= 50),
  device_id     text,
  origem        text        not null default 'app'   -- 'app' ou 'importacao' (histórico)
);

create index if not exists tmrd_registros_data_idx on public.tmrd_registros (data);
create index if not exists tmrd_registros_device_idx on public.tmrd_registros (device_id, data);

-- ---------- Segurança (RLS) ----------
-- Versão inicial: qualquer pessoa com o link do app lê e lança.
-- Para restringir, troque "anon" por "authenticated" e ative login no Supabase (veja README).
alter table public.tmrd_registros enable row level security;

drop policy if exists "tmrd ler"      on public.tmrd_registros;
drop policy if exists "tmrd lancar"   on public.tmrd_registros;
drop policy if exists "tmrd excluir"  on public.tmrd_registros;

create policy "tmrd ler"     on public.tmrd_registros for select to anon, authenticated using (true);
create policy "tmrd lancar"  on public.tmrd_registros for insert to anon, authenticated
  with check (data >= (now() at time zone 'America/Sao_Paulo')::date - 1);   -- hoje e dias futuros; não deixa lançar no passado pelo app
create policy "tmrd excluir" on public.tmrd_registros for delete to anon, authenticated
  using (data >= (now() at time zone 'America/Sao_Paulo')::date - 1);       -- só exclui de hoje/ontem

-- ---------- Tempo real (o painel da TV atualiza sozinho) ----------
do $$ begin
  alter publication supabase_realtime add table public.tmrd_registros;
exception when duplicate_object then null; end $$;

-- ---------- Visão pronta para Excel / Power BI / Power Query ----------
create or replace view public.tmrd_planilha as
select
  to_char(data, 'DD/MM/YYYY')                       as "Data",
  case topico
    when 'quimicos'  then 'Produtos Químicos'
    when 'confinado' then 'Espaço Confinado'
    when 'quente'    then 'Trabalho à Quente'
    when 'icamento'  then 'Grandes Içamentos'
    when 'energias'  then 'Energias Perigosas'
    when 'altura'    then 'Trabalho em Altura'
    when 'telhado'   then 'Trabalho em Telhado'
    when 'equip'     then 'Intervenção em Equipamentos'
    when 'logistica' then 'Logística Interna'
    when 'terceiros' then 'Trabalhos Terceirizados'
    else 'Outros' || coalesce(' · ' || topico_outro, '') end as "Tópico",
  atividade                                          as "Atividade",
  area                                               as "Área",
  local                                              as "Local",
  turno                                              as "Turno",
  to_char(inicio, 'HH24:MI')                         as "Início",
  to_char(fim, 'HH24:MI')                            as "Término",
  array_to_string(controles, ' | ')                  as "Controles",
  responsavel                                        as "Responsável",
  criado_em at time zone 'America/Sao_Paulo'         as "Registrado em",
  origem                                             as "Origem"
from public.tmrd_registros
order by data desc, area, inicio nulls last;

-- Para a visão respeitar a RLS da tabela:
alter view public.tmrd_planilha set (security_invoker = on);
