-- Clean up duplicate profiles
-- Execute in Supabase SQL Editor

-- 1. First, let's see what duplicates we have
SELECT user_id, COUNT(*) as count, 
       STRING_AGG(id::text, ', ') as profile_ids,
       STRING_AGG(created_at::text, ', ') as created_dates
FROM public.profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 2. Delete duplicate profiles, keeping only the most recent one
WITH ranked_profiles AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.profiles
)
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id 
  FROM ranked_profiles 
  WHERE rn > 1
);

-- 3. Verify no more duplicates
SELECT user_id, COUNT(*) as count
FROM public.profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
