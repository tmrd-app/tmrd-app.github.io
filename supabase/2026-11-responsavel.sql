-- Responsável pela tarefa (aplicado em 04/11/2026).
-- Funções de edição v2 gravam também o responsável; as antigas (tmrd_editar / tmrd_editar_meu) ficam para versões antigas do app.
create or replace function public.tmrd_editar_v2(p_pin text, p_id uuid, p_data date, p_topico text, p_topico_outro text, p_atividade text, p_responsavel text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.tmrd_pin_ok(p_pin) then raise exception 'PIN incorreto' using errcode = '28000'; end if;
  update public.tmrd_registros
     set data = p_data, topico = p_topico, topico_outro = nullif(trim(p_topico_outro), ''), atividade = trim(p_atividade),
         responsavel = coalesce(nullif(trim(p_responsavel), ''), responsavel)
   where id = p_id;
  if not found then raise exception 'Tarefa não encontrada'; end if;
end $$;

create or replace function public.tmrd_editar_meu_v2(p_device text, p_id uuid, p_data date, p_topico text, p_topico_outro text, p_atividade text, p_responsavel text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_device,'') = '' then raise exception 'Aparelho não identificado'; end if;
  if p_data < (now() at time zone 'America/Sao_Paulo')::date - 1 then raise exception 'Data inválida'; end if;
  update public.tmrd_registros
     set data = p_data, topico = p_topico, topico_outro = nullif(trim(p_topico_outro), ''), atividade = trim(p_atividade),
         responsavel = coalesce(nullif(trim(p_responsavel), ''), responsavel)
   where id = p_id and device_id = p_device
     and data >= (now() at time zone 'America/Sao_Paulo')::date - 1;
  if not found then raise exception 'Só é possível editar seus lançamentos de hoje em diante sem o PIN'; end if;
end $$;

revoke all on function public.tmrd_editar_v2(text, uuid, date, text, text, text, text) from public;
revoke all on function public.tmrd_editar_meu_v2(text, uuid, date, text, text, text, text) from public;
grant execute on function public.tmrd_editar_v2(text, uuid, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.tmrd_editar_meu_v2(text, uuid, date, text, text, text, text) to anon, authenticated, service_role;

-- Responsável obrigatório para tarefas novas e editadas. NOT VALID: não cobra das tarefas antigas (sem nome).
alter table public.tmrd_registros add constraint tmrd_responsavel_obrigatorio
  check (char_length(trim(coalesce(responsavel, ''))) > 0) not valid;
