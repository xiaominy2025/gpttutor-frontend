# Navigator Alpha credential format diagnosis

Base: `4a0d503bb9d91c4746eba1bf463d69b4b808a09d`. Status: **cause confirmed; owner SecureString correction pending**. No secret has been changed by the agent, and Navigator remains OFF. This is not paid-test or public-activation approval.

## Owner update and version-2 verification

After the owner confirmed the update, a fresh approved format-only runtime check observed **version 2**. The JSON wrapper is removed, but **surrounding whitespace remains**. The contained trimmed string matches the raw-key syntax; the exact stored value still fails it. No BOM, internal whitespace or non-ASCII character was detected in the trimmed value. The diagnostic does not reveal which boundary or the characters themselves. Provider requests and generation calls remain zero.

Owner action: edit the same parameter once more, remove only leading/trailing spaces or line breaks (do not alter the key), preserve existing SecureString/Standard/KMS settings and save. Confirm only “updated,” without the key/screenshot. Do not automatically trim or rewrite the secret in application code. A new fresh one-use verification journal is required after the next owner correction; the completed version-2 journal must not be reset or reused.

The private runtime was restored again and verified at `2026-11-22T00:28:58.137Z`: Navigator OFF version1 and master ON revision9 unchanged. The exact restored revision/hash are in `final-acceptance-evidence/credential-version2-check.json`. Raw-format verification remains **failed/pending correction**, not passed. Earlier JSON-object findings below describe version 1, not version 2.

## Exact contract and confirmed cause

The installed Navigator runtime reads `/decisionnavigator-alpha/openai-api-key` with decryption under its own existing role, uses the latest parameter version, and sends `Authorization: Bearer ` followed by that value **verbatim**. It does not parse JSON, unwrap quotes, decode base64/URL encoding or trim whitespace. The runtime itself checks only string/minimum length; that alone is not a credential-validity check.

The Alpha acceptance raw-key contract is a single unencoded `sk-` token, with at least ten subsequent ASCII letters/digits/underscores/hyphens: `^sk-[A-Za-z0-9_-]{10,}$`. This accepts the usual `sk-proj-...` shape. It is our local syntax gate, **not** an exhaustive OpenAI key specification or proof of provider validity/model access. OpenAI documents HTTP Bearer authentication, with the secret kept server-side: [API authentication](https://developers.openai.com/api/reference/overview/).

An authorized, direct-IAM, format-only runtime diagnostic confirmed:

- Existing parameter is SecureString version **1**.
- The stored value is a **JSON object**, not a raw token.
- That object contains a string matching the raw-token syntax after boundary trimming.
- The outer value has no boundary whitespace or BOM. Whitespace/non-ASCII characters exist somewhere in the JSON representation; this does not mean the contained key is corrupted.
- No JSON property names, values, lengths, key fragments, fingerprints or encoded copies were returned/logged/persisted. The operator received only fixed format labels, booleans and nonsecret version metadata.
- No OpenAI metadata or generation request was made. No attempt was made to use the contained key automatically.

Therefore the confirmed incompatibility is **a JSON wrapper being supplied where the runtime expects the raw credential**. It is not an SSM type/version mismatch. Provider validity remains untested. We did not change the application to guess or unwrap secrets, retrieve another Coach's key, or modify this parameter.

## Diagnostic checker correction

The previous checker also hard-pinned parameter version 1. That did not cause this version-1 failure, but would have falsely rejected an owner-corrected version 2. The checker now accepts any positive integer SecureString version and reports the observed version. `inspect-credential-format` and `verify-credential-format` never contact OpenAI, even for a well-formed raw token. The previous explicit model-metadata operation remains separate and is not used in this investigation.

Twenty-two focused credential tests pass, covering raw tokens, JSON object/string, surrounding whitespace/BOM, single quotes, Bearer prefix, environment assignment, URL/base64 encoding, unrecognized input, version-2 acceptance, direct-target isolation, exception redaction and zero provider requests in format-only modes. Existing application/runtime source is unchanged.

## Owner's secure correction instructions

1. Sign in to the existing AWS account **771049112957**, choose **US East (N. Virginia), us-east-1**.
2. Open **Systems Manager → Parameter Store**, select exactly **`/decisionnavigator-alpha/openai-api-key`**, then **Edit**. Do not choose Create parameter, and do not edit another Coach's path.
3. In **Value**, paste only the existing dedicated Navigator API key from its trusted secure source/current JSON wrapper. Keep it entirely in your private AWS session. No JSON object, property name, quotes, `Bearer `, environment-variable assignment, encoding, leading/trailing spaces or newline.
4. Preserve **SecureString**, **Standard**, existing **alias/aws/ssm** KMS encryption, name, access controls and tags. Choose **Save changes**. Do not rotate/create a different key unless separately intended and authorized.
5. Check only the version metadata. The first edit of version 1 should produce version **2**; further edits increment again. No need to reveal the saved value. Tell Codex only **“updated”**, optionally the version number. Never send the key, JSON, screenshot or decrypted output.

AWS confirms edits create a new version and unversioned reads use the latest: [Parameter Store versions and console editing](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-versions.html). No new parameter, role, permission or infrastructure is needed.

## Secure rerun and release boundary

After owner confirmation, use the fresh `--after-owner-update` run of `scripts/check-navigator-credential-format-hosted.mjs`: metadata-only preflight must observe a newer SecureString/Standard version, then install the reviewed format checker into unrouted `$LATEST` by revision CAS. Public `live` stays OFF version 1. Directly invoke **once**, require `verified:true`, `rawFormatValid:true`, matching observed version, and `providerRequests:0`. Conditionally restore the exact original code and verify alias/configuration/master. Use a fresh journal, not the completed diagnosis journal; never retry uncertain invocations.

The diagnosis bundle SHA-256 is `c39b8feac98366e5421e38c0523c587761a8bc79a348af64e5ee64f0a563c56e`. Its direct invocation returned only the sanitized format classification. Original private code restored successfully: hash `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`, revision `fab22e04-7966-4f99-9696-77a3cbead3b6`, verified at `2026-11-21T23:33:50.457Z`. Public OFF alias version 1/revision `40267485-ed37-4a71-adbc-4a6c36ebb483`; master ON/revision 9. No configuration/IAM/SSM/route/frontend changes.

Until the owner corrects the value, do not rerun against the same known JSON input. Once raw syntax passes, resume **approval preparation**, not automatic execution, for the existing confined cookie/IP probe, coordinated master test, bounded four-call/$0.03 canary and final Alpha activation. Model permissions/key validity are distinct from syntax and remain acceptance gates. No paid calls or deployments/publication are authorized by this report.
