CREATE DATABASE IF NOT EXISTS ${ATHENA_DB};

-- Create external table over CloudFront JSON standard logs
CREATE EXTERNAL TABLE IF NOT EXISTS ${ATHENA_DB}.${ATHENA_TABLE} (
  `timestamp` string,
  `c_ip` string,
  `time_to_first_byte` double,
  `sc_status` int,
  `sc_bytes` bigint,
  `cs_method` string,
  `cs_protocol` string,
  `cs_host` string,
  `cs_uri_stem` string,
  `cs_bytes` bigint,
  `x_edge_location` string,
  `x_edge_request_id` string,
  `x_host_header` string,
  `cs_protocol_version` string,
  `cs_user_agent` string,
  `cs_referer` string,
  `cs_cookie` string,
  `x_edge_result_type` string,
  `x_edge_response_result_type` string,
  `ssl_protocol` string,
  `ssl_cipher` string,
  `cs_uri_query` string,
  `c_port` int,
  `time_taken` double
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
  'ignore.malformed.json' = 'true'
)
LOCATION '${CF_LOG_S3}';

