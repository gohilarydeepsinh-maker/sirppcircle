create policy "read study materials" on storage.objects for select to authenticated
using (
  bucket_id = 'study-materials' and (
    public.is_staff(auth.uid())
    or owner = auth.uid()
    or exists (
      select 1 from public.documents d
      where d.file_path = storage.objects.name and d.status = 'approved'
    )
  )
);
create policy "upload study materials" on storage.objects for insert to authenticated
with check (bucket_id = 'study-materials' and public.can_upload(auth.uid()) and owner = auth.uid());
create policy "staff update study materials" on storage.objects for update to authenticated
using (bucket_id = 'study-materials' and public.is_staff(auth.uid()))
with check (bucket_id = 'study-materials' and public.is_staff(auth.uid()));
create policy "delete study materials" on storage.objects for delete to authenticated
using (bucket_id = 'study-materials' and (public.is_staff(auth.uid()) or owner = auth.uid()));