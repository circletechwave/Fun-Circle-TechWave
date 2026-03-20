-- Allow users to update (including soft-delete) their own donations
-- Admins are already covered by the existing "Admins can manage donations" policy
CREATE POLICY "Users can update own donations" ON donations
  FOR UPDATE USING (
    auth.uid() = created_by AND deleted_at IS NULL
  );
