-- Hardening for the Zara schema migration (20261127065802).
-- Pin function resolution and restrict trigger-only helper execution.

alter function public.is_owner() set search_path = public, auth;
alter function public.is_agent() set search_path = public, auth;
alter function public.get_resonance_wave(integer) set search_path = public, auth;

-- The helper is used in owner-scoped defaults. RLS already limits its result to auth.uid().
alter function public.current_owner_id() security invoker;
alter function public.current_owner_id() set search_path = public, auth;

revoke all on function public.is_owner() from public, anon;
revoke all on function public.is_agent() from public, anon;
grant execute on function public.is_owner(), public.is_agent() to authenticated;

-- Trigger functions are not public RPC endpoints.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.classify_laptop_command() from public, anon, authenticated;
revoke all on function public.log_command_event() from public, anon, authenticated;
revoke all on function public.chain_activity_log() from public, anon, authenticated;

revoke all on function public.current_owner_id() from public, anon;
grant execute on function public.current_owner_id() to authenticated;

-- Application RPCs remain authenticated-only and enforce owner identity internally.
revoke all on function public.bootstrap_owner(uuid) from public, anon;
revoke all on function public.verify_pin(text) from public, anon;
revoke all on function public.set_pin(text, text) from public, anon;
revoke all on function public.confirm_laptop_command(uuid, text, text) from public, anon;
revoke all on function public.cancel_laptop_command(uuid) from public, anon;
revoke all on function public.panic_stop() from public, anon;
revoke all on function public.panic_resume(text) from public, anon;
revoke all on function public.get_resonance_wave(integer) from public, anon;

grant execute on function public.bootstrap_owner(uuid),
  public.verify_pin(text), public.set_pin(text, text),
  public.confirm_laptop_command(uuid, text, text),
  public.cancel_laptop_command(uuid), public.panic_stop(),
  public.panic_resume(text), public.get_resonance_wave(integer)
to authenticated;
