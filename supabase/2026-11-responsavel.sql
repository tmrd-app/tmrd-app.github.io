-- Responsável pela tarefa (supervisor/gerente): as funções de edição passam a gravar também o nome.
-- p_responsavel tem default null: versões antigas do app (sem o campo) continuam funcionando e não apagam o nome.
drop function if exists public.tmrd_editar(text, uuid, date, text, text, text);
drop function if exists public.tmrd_editar_meu(text, uuid, date, text, text, text);

create function public.tmrd_editar(p_pin text, p_id uuid, p_data date, p_topico text, p_topico_outro text, p_atividade text, p_responsavel text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.tmrd_pin_ok(p_pin) then raise exception 'PIN incorreto' using errcode = '28000'; end if;
  update public.tmrd_registros
     set data = p_data, topico = p_topico, topico_outro = nullif(trim(p_topico_outro), ''), atividade = trim(p_atividade),
         responsavel = coalesce(nullif(trim(p_responsavel), ''), responsavel)
   where id = p_id;
  if not found then raise exception 'Tarefa não encontrada'; end if;
end $$;

create function public.tmrd_editar_meu(p_device text, p_id uuid, p_data date, p_topico text, p_topico_outro text, p_atividade text, p_responsavel text default null)
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

revoke all on function public.tmrd_editar(text, uuid, date, text, text, text, text) from public;
revoke all on function public.tmrd_editar_meu(text, uuid, date, text, text, text, text) from public;
grant execute on function public.tmrd_editar(text, uuid, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.tmrd_editar_meu(text, uuid, date, text, text, text, text) to anon, authenticated, service_role;
