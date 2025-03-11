import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksClient from 'jwks-rsa';
import { Config } from '../config';
import { Request } from 'express';
import { AuthCookie } from '../types';

// JWT middleware verifies the accessToken, not the refreshToken
// It validates JWT tokens included in incoming requests.
// It retrieves the public key dynamically from a JWKS (JSON Web Key Set) endpoint.
// It extracts the JWT token either from:
// Authorization header (Bearer <token>)
// Cookies (accessToken)
// It uses the RS256 algorithm for verifying tokens.
// export default expressjwt({ ... }) This sets up JWT authentication middleware. (returns a middleware)

// When a Request Comes In
// The JWT middleware extracts the token from the request.
// It fetches the public key from the JWKS endpoint.
// It verifies the JWT using RS256.
// If valid, req.auth will contain the decoded JWT payload.
// If invalid, it rejects the request with a 401 error.

// Can Someone Use the Public Key to Fake a JWT? -> No
// The public key only verifies JWTs.
// It cannot create or modify JWTs.
// If someone tries to generate a fake JWT and sign it, they need the private key, which is securely stored by the identity provider.

// ✅ Step 1: The identity provider (Auth0, Keycloak, AWS Cognito, etc.) signs the JWT using the private key.
// ✅ Step 2: The API server (your app) verifies the JWT using the public key.

// This ensures:

// The JWT was actually issued by the trusted identity provider.
// The token was not tampered with (since modifying the payload would break the signature).
// Without the public key, the server cannot verify if the token is legit.

// ✅ The private key is read only to extract the public key.
// ✅ The public key is then shared via JWKS_URI.

export default expressjwt({
  secret: jwksClient.expressJwtSecret({
    jwksUri: Config.JWKS_URI!,
    cache: true,
    rateLimit: true,
  }) as GetVerificationKey,
  algorithms: ['RS256'],
  getToken(req: Request) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(' ')[1] !== 'undefined') {
      const token = authHeader.split(' ')[1];
      if (token) {
        return token;
      }
    }

    const { accessToken } = req.cookies as AuthCookie;
    return accessToken;
  },
});

// in my words
// a private key contains enough information to derive its corresponding public key. (rsaPemToJwk(privateKey, { use: 'sig' }, 'public');)
// The private key (private.pem) can be used to derive the public key (public.pem). The public key is extracted from the private key and hosted publicly (e.g., JWKS_URI) so that other services can use it to verify JWT tokens sent with requests.
// The private key contains enough information to derive the public key. When a JWT is signed using the private key, it generates a signature (not the private key itself). The JWT is created using a combination of the payload and the private key, ensuring its authenticity.
// During verification, the public key (hosted in JWKS_URI) checks the JWT’s signature. Since the public key can be derived from the private key, it can verify whether the signature was genuinely created using the corresponding private key.
// If the signature matches, the JWT is valid, and authentication succeeds. If not, the server responds with 401 Unauthorized (token is invalid, expired, or tampered with).
