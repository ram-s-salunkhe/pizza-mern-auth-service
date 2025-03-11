import fs from 'fs';
import rsaPemToJwk from 'rsa-pem-to-jwk';

const privateKey = fs.readFileSync('./certs/private.pem');
const jwk = rsaPemToJwk(privateKey, { use: 'sig' }, 'public'); // It extracts the public key portion from the private key. extracts the public key (in JWK format).

console.log(JSON.stringify(jwk));
// this is json wek key inside this we have public key information with the help of this we can verify token signature from othher server's
// is key ko publically host karte hai /public/.well-known/jwks.json

// ✅ The private key is read only to extract the public key.
// ✅ The public key is then shared via JWKS_URI.
