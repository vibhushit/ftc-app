-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Migration 005: Storage Buckets & Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Create buckets ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',    'avatars',    TRUE,  2097152,   ARRAY['image/jpeg','image/png','image/webp']),
  ('portfolio',  'portfolio',  TRUE,  10485760,  ARRAY['image/jpeg','image/png','image/webp','video/mp4']),
  ('campaigns',  'campaigns',  TRUE,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('id-docs',    'id-docs',    FALSE, 5242880,   ARRAY['image/jpeg','image/png','application/pdf']),
  ('signatures', 'signatures', FALSE, 1048576,   ARRAY['image/png']);

-- ─── avatars: owner can upload; anyone can read ───────────────────────────────
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ─── portfolio: owner can upload; anyone can read ─────────────────────────────
CREATE POLICY "portfolio_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

CREATE POLICY "portfolio_owner_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "portfolio_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ─── campaigns: owner can upload; anyone can read ─────────────────────────────
CREATE POLICY "campaigns_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'campaigns');

CREATE POLICY "campaigns_owner_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaigns'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ─── id-docs: owner can upload; service_role can read ────────────────────────
-- Private bucket — no public read
CREATE POLICY "id_docs_owner_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'id-docs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "id_docs_owner_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-docs'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ─── signatures: owner can upload; deal parties can read ─────────────────────
CREATE POLICY "signatures_owner_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "signatures_party_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
    AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.deals
        WHERE (brand_id = auth.uid() OR creator_id = auth.uid())
          AND id::TEXT = (storage.foldername(name))[2]
      )
    )
  );
