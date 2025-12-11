-- Make team_id nullable to support Workspace-level invitations
alter table team_invitations alter column team_id drop not null;
