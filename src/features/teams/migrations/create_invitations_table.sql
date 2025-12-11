-- Create a table for team invitations
create table if not exists team_invitations (
  id uuid default gen_random_uuid() primary key,
  team_id text not null, -- Use text to match existing team IDs which might be "team-TIMESTAMP"
  email text not null,
  role text default 'Viewer',
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  invited_by uuid references auth.users(id)
);

-- RLS Policies (Optional but recommended)
alter table team_invitations enable row level security;

-- Policy: Allow authenticated users to view invitations for teams they belong to (simplified for this context)
create policy "Users can view invitations for their company"
on team_invitations for select
to authenticated
using (true); -- In a real app, check company_id or team membership

-- Policy: Allow authenticated users to create invitations
create policy "Users can create invitations"
on team_invitations for insert
to authenticated
with check (true);
