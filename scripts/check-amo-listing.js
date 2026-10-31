// Fails unless the GUID in a built Firefox manifest belongs to an AMO add-on
// that these credentials can see. `web-ext sign --channel listed` with a GUID
// AMO does not know silently creates a new listing, so this runs first.
// Usage: AMO_JWT_ISSUER=... AMO_JWT_SECRET=... node scripts/check-amo-listing.js <manifest.json>
import { Buffer } from 'node:buffer';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const [manifestPath] = process.argv.slice(2);
const issuer = process.env.AMO_JWT_ISSUER;
const secret = process.env.AMO_JWT_SECRET;
if (!manifestPath || !issuer || !secret) {
  console.error(
    'usage: AMO_JWT_ISSUER=... AMO_JWT_SECRET=... node scripts/check-amo-listing.js <manifest.json>',
  );
  process.exit(2);
}

const guid = JSON.parse(readFileSync(manifestPath, 'utf8'))
  .browser_specific_settings?.gecko?.id;
if (typeof guid !== 'string') {
  console.error(`${manifestPath} has no browser_specific_settings.gecko.id`);
  process.exit(1);
}

/** AMO's API auth: an HS256 JWT, valid for at most five minutes. */
function amoJwt() {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    iss: issuer,
    jti: randomUUID(),
    iat,
    exp: iat + 60,
  })}`;
  const signature = createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url');
  return `${unsigned}.${signature}`;
}

const response = await fetch(
  `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(guid)}/`,
  { headers: { Authorization: `JWT ${amoJwt()}` } },
);
const addon = response.ok ? await response.json() : undefined;
if (addon?.guid !== guid) {
  console.error(
    `AMO has no add-on ${guid} visible to these credentials (HTTP ${response.status}). ` +
      'Refusing to sign: web-ext would create a new listing. ' +
      'The first submission is made by hand; check the GUID and the AMO secrets.',
  );
  process.exit(1);
}
console.log(
  `AMO listing found: ${guid} (${addon.slug}, status ${addon.status})`,
);
