-- Check what's in the profiles table
-- Execute in Supabase SQL Editor

-- 1. Check all profiles
SELECT id, user_id, created_at, practical, analytical, creative, social, entrepreneurial, organized
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Check for duplicate user_ids
SELECT user_id, COUNT(*) as count
FROM public.profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 3. Check users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
