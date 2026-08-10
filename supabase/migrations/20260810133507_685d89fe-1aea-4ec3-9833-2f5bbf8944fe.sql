revoke execute on function public.role_of(uuid) from anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;
revoke execute on function public.is_staff(uuid) from anon, authenticated;
revoke execute on function public.can_upload(uuid) from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.protect_profile() from anon, authenticated;