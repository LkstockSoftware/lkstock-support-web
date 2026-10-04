-- LkStock Soporte: ficha manual de cliente/empresa y conversaciones fijadas.
-- Ejecutar en Supabase SQL Editor del proyecto "LkStock Soporte".

alter table public.wa_conversations
  add column if not exists company_id text,
  add column if not exists pinned boolean not null default false;

create index if not exists wa_conversations_pinned_updated_idx
  on public.wa_conversations (pinned desc, updated_at desc);

alter table public.wa_operator_actions
  drop constraint if exists wa_operator_actions_action_check;

alter table public.wa_operator_actions
  add constraint wa_operator_actions_action_check
  check (action in ('takeover', 'return_to_bot', 'close', 'ticket_created', 'profile_update', 'pin', 'unpin'));
