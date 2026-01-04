import React from 'react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Database Setup (Supabase)</h2>
        <p className="text-slate-600 mb-4">Go to the <strong>SQL Editor</strong> in your Supabase Dashboard and run this block. It handles cases where tables already exist.</p>
        
        <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto font-mono text-sm mb-6">
          <pre>{`-- 1. Create Users Table (Safe)
create table if not exists public.users (
  telegram_id bigint primary key,
  first_name text,
  username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Activity Logs Table (Safe)
create table if not exists public.activity_logs (
  log_id uuid default gen_random_uuid() primary key,
  telegram_id bigint references public.users(telegram_id) not null,
  event_type text default 'login',
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  session_duration integer
);

-- 3. Enable RLS
alter table public.users enable row level security;
alter table public.activity_logs enable row level security;

-- 4. Reset & Create Policies
drop policy if exists "Enable insert for everyone" on public.users;
drop policy if exists "Enable update for everyone" on public.users;
drop policy if exists "Enable insert for logs" on public.activity_logs;
drop policy if exists "Enable read for admin" on public.users;
drop policy if exists "Enable read for admin" on public.activity_logs;

create policy "Enable insert for everyone" on public.users for insert with check (true);
create policy "Enable update for everyone" on public.users for update using (true);
create policy "Enable insert for logs" on public.activity_logs for insert with check (true);
create policy "Enable read for admin" on public.users for select using (true);
create policy "Enable read for admin" on public.activity_logs for select using (true);
`}</pre>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Setup Admin User</h2>
        <p className="text-slate-600 mb-4">
          To log in to this dashboard, you must create a user in Supabase.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-700">
          <li>Go to Supabase Dashboard &gt; <strong>Authentication</strong>.</li>
          <li>Click <strong>Providers</strong> &gt; <strong>Email</strong> &gt; Toggle <strong>Enable Email</strong> ON.</li>
          <li>Click <strong>Users</strong> (left sidebar).</li>
          <li>Click <strong>Add User</strong> (top right).</li>
          <li>Enter your desired email (e.g., admin@cargo.app) and password.</li>
          <li>Click <strong>Create User</strong>.</li>
          <li>Come back here and log in!</li>
        </ol>
      </div>
    </div>
  );
};
