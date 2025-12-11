-- Enable RLS on the table if not already enabled
alter table team_invitations enable row level security;

-- Allow all authenticated users to delete (you might want to restrict this later)
create policy "Allow delete for authenticated users" 
on team_invitations for delete 
to authenticated 
using (true);

-- Ensure select/insert is also allowed if RLS was just enabled
create policy "Allow select for authenticated users" on team_invitations for select to authenticated using (true);
create policy "Allow insert for authenticated users" on team_invitations for insert to authenticated with check (true);
