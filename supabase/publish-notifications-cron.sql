-- HimalCyberX scheduled content notification cron (Stage 2C)
-- Run manually in the Supabase SQL Editor after review.
--
-- Triggers the Next.js endpoint every 10 minutes via pg_cron + pg_net.
-- Vercel Hobby does not support sub-daily Vercel Cron; use this instead.
--
-- PREREQUISITES (Supabase Dashboard → Database → Extensions):
--   1. Enable "pg_cron"
--   2. Enable "pg_net"
--   3. Enable "supabase_vault" (usually enabled by default)
--
-- SECRET SETUP (run once, replace the placeholder — do NOT commit the real value):
--   SELECT vault.create_secret(
--     '<YOUR_CRON_SECRET>',
--     'himalcyberx_cron_secret',
--     'Bearer token for /api/cron/publish-notifications'
--   );
--
-- The value must match CRON_SECRET configured in Vercel (server-only env).
-- To rotate: create a new vault secret, update Vercel CRON_SECRET, then update the job.
--
-- VERIFY VAULT SECRET EXISTS (should return one row, secret value is not shown here):
--   SELECT name, description, created_at
--   FROM vault.secrets
--   WHERE name = 'himalcyberx_cron_secret';

-- Remove any previous schedule with the same job name before re-scheduling.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'himalcyberx-publish-notifications';

-- Schedule: every 10 minutes (pg_cron uses UTC).
SELECT cron.schedule(
  'himalcyberx-publish-notifications',
  '*/10 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://himalcyberx.com/api/cron/publish-notifications',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'himalcyberx_cron_secret'
        LIMIT 1
      )
    ),
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- OPTIONAL: inspect scheduled job
-- SELECT jobid, jobname, schedule, active FROM cron.job
-- WHERE jobname = 'himalcyberx-publish-notifications';

-- OPTIONAL: inspect recent HTTP responses (pg_net)
-- SELECT *
-- FROM net._http_response
-- ORDER BY created DESC
-- LIMIT 10;

-- OPTIONAL: remove schedule
-- SELECT cron.unschedule('himalcyberx-publish-notifications');
