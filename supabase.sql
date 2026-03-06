-- Supabase Schema for WINGS 2026
-- Run this in the Supabase SQL Editor

create table if not exists registrations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null,
    phone text not null,
    college text not null,
    department text not null,
    year text not null,
    events text not null, -- Storing JSON string
    "participationType" text not null, -- Quoted for camelCase
    "teamName" text,
    teammate2 text,
    teammate3 text,
    "projectTopic" text,
    "projectAbstractFileId" text, -- Stores file path in Supabase Storage
    "paymentReference" text not null,
    timestamp timestamptz not null,
    verification_status text not null default 'Pending'
);

-- Enable Row Level Security (RLS)
alter table registrations enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable read access for all users" on registrations;
drop policy if exists "Enable insert for all users" on registrations;
drop policy if exists "Enable update for all users" on registrations;
drop policy if exists "Give public access to abstracts" on storage.objects;
drop policy if exists "Allow public uploads to abstracts" on storage.objects;

-- Policies for the registrations table
create policy "Enable read access for all users"
on registrations for select
using (true);

create policy "Enable insert for all users"
on registrations for insert
with check (true);

create policy "Enable update for all users"
on registrations for update
using (true);

-- Storage setup (optional, if you haven't created the bucket in dashboard)
insert into storage.buckets (id, name, public)
values ('abstracts', 'abstracts', true)
on conflict (id) do nothing;

-- Storage policies for 'abstracts' bucket
create policy "Give public access to abstracts"
on storage.objects for select
using ( bucket_id = 'abstracts' );

create policy "Allow public uploads to abstracts"
on storage.objects for insert
with check ( bucket_id = 'abstracts' );