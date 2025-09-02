-- 1) Daily totals
SELECT
  date(from_iso8601_timestamp("timestamp")) AS dt,
  COUNT(*) AS total_requests
FROM ${ATHENA_DB}.${ATHENA_TABLE}
GROUP BY 1
ORDER BY 1 DESC;

-- 2) Daily unique visitors (by IP)
SELECT
  date(from_iso8601_timestamp("timestamp")) AS dt,
  COUNT(DISTINCT c_ip) AS unique_visitors
FROM ${ATHENA_DB}.${ATHENA_TABLE}
GROUP BY 1
ORDER BY 1 DESC;

-- 3) Top pages (last 7 days)
WITH base AS (
  SELECT
    from_iso8601_timestamp("timestamp") AS ts,
    cs_uri_stem
  FROM ${ATHENA_DB}.${ATHENA_TABLE}
)
SELECT cs_uri_stem, COUNT(*) AS hits
FROM base
WHERE ts >= current_timestamp - interval '7' day
GROUP BY cs_uri_stem
ORDER BY hits DESC
LIMIT 20;

-- 4) Status code breakdown (last 7 days)
WITH base AS (
  SELECT
    from_iso8601_timestamp("timestamp") AS ts,
    sc_status
  FROM ${ATHENA_DB}.${ATHENA_TABLE}
)
SELECT sc_status, COUNT(*) AS cnt
FROM base
WHERE ts >= current_timestamp - interval '7' day
GROUP BY sc_status
ORDER BY cnt DESC;

