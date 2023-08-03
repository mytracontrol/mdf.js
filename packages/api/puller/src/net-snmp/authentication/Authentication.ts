import { Hash, createHash, createHmac } from 'crypto';
import { AuthProtocols } from '../constants';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var Authentication = {};

Authentication.HMAC_BUFFER_SIZE = 1024 * 1024;

Authentication.algorithms = {};

Authentication.algorithms[AuthProtocols.md5] = {
	KEY_LENGTH: 16,
	AUTHENTICATION_CODE_LENGTH: 12,
	CRYPTO_ALGORITHM: "md5",
};

Authentication.algorithms[AuthProtocols.sha] = {
	KEY_LENGTH: 20,
	AUTHENTICATION_CODE_LENGTH: 12,
	CRYPTO_ALGORITHM: "sha1",
};

Authentication.algorithms[AuthProtocols.sha224] = {
	KEY_LENGTH: 28,
	AUTHENTICATION_CODE_LENGTH: 16,
	CRYPTO_ALGORITHM: "sha224",
};

Authentication.algorithms[AuthProtocols.sha256] = {
	KEY_LENGTH: 32,
	AUTHENTICATION_CODE_LENGTH: 24,
	CRYPTO_ALGORITHM: "sha256",
};

Authentication.algorithms[AuthProtocols.sha384] = {
	KEY_LENGTH: 48,
	AUTHENTICATION_CODE_LENGTH: 32,
	CRYPTO_ALGORITHM: "sha384",
};

Authentication.algorithms[AuthProtocols.sha512] = {
	KEY_LENGTH: 64,
	AUTHENTICATION_CODE_LENGTH: 48,
	CRYPTO_ALGORITHM: "sha512",
};

Authentication.authToKeyCache = {};

Authentication.computeCacheKey = function (
	authProtocol,
	authPasswordString,
	engineID
) {
	var engineIDString = engineID.toString("base64");
	return authProtocol + authPasswordString + engineIDString;
};

// Adapted from RFC3414 Appendix A.2.1. Password to Key Sample Code for MD5
Authentication.passwordToKey = function (
	authProtocol,
	authPasswordString,
	engineID
) {
	var hashAlgorithm;
	var firstDigest;
	var finalDigest;
	var buf;
	var cryptoAlgorithm =
		Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM;

	var cacheKey = Authentication.computeCacheKey(
		authProtocol,
		authPasswordString,
		engineID
	);
	if (Authentication.authToKeyCache[cacheKey] !== undefined) {
		return Authentication.authToKeyCache[cacheKey];
	}

	buf = Buffer.alloc(Authentication.HMAC_BUFFER_SIZE, authPasswordString);

	hashAlgorithm = crypto.createHash(cryptoAlgorithm);
	hashAlgorithm.update(buf);
	firstDigest = hashAlgorithm.digest();
	// debug ("First digest:  " + firstDigest.toString('hex'));

	hashAlgorithm = crypto.createHash(cryptoAlgorithm);
	hashAlgorithm.update(firstDigest);
	hashAlgorithm.update(engineID);
	hashAlgorithm.update(firstDigest);
	finalDigest = hashAlgorithm.digest();
	// debug ("Localized key: " + finalDigest.toString('hex'));

	Authentication.authToKeyCache[cacheKey] = finalDigest;
	return finalDigest;
};

Authentication.getParametersLength = function (authProtocol) {
	return Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH;
};

Authentication.writeParameters = function (
	messageBuffer,
	authProtocol,
	authPassword,
	engineID,
	digestInMessage
) {
	var digestToAdd;

	digestToAdd = Authentication.calculateDigest(
		messageBuffer,
		authProtocol,
		authPassword,
		engineID
	);
	digestToAdd.copy(digestInMessage);
	// debug ("Added Auth Parameters: " + digestToAdd.toString('hex'));
};

Authentication.isAuthentic = function (
	messageBuffer,
	authProtocol,
	authPassword,
	engineID,
	digestInMessage
) {
	var savedDigest;
	var calculatedDigest;

	if (
		digestInMessage.length !==
		Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH
	)
		return false;

	// save original authenticationParameters field in message
	savedDigest = Buffer.from(digestInMessage);

	// clear the authenticationParameters field in message
	digestInMessage.fill(0);

	calculatedDigest = Authentication.calculateDigest(
		messageBuffer,
		authProtocol,
		authPassword,
		engineID
	);

	// replace previously cleared authenticationParameters field in message
	savedDigest.copy(digestInMessage);

	// debug ("Digest in message: " + digestInMessage.toString('hex'));
	// debug ("Calculated digest: " + calculatedDigest.toString('hex'));
	return calculatedDigest.equals(digestInMessage);
};

Authentication.calculateDigest = function (
	messageBuffer,
	authProtocol,
	authPassword,
	engineID
) {
	var authKey = Authentication.passwordToKey(
		authProtocol,
		authPassword,
		engineID
	);

	var cryptoAlgorithm =
		Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM;
	var hmacAlgorithm = crypto.createHmac(cryptoAlgorithm, authKey);
	hmacAlgorithm.update(messageBuffer);
	var digest = hmacAlgorithm.digest();
	return digest.subarray(
		0,
		Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH
	);
};
```
*/
interface AuthAlgorithmPayload {
  KEY_LENGTH: number;
  AUTHENTICATION_CODE_LENGTH: number;
  CRYPTO_ALGORITHM: string;
}
export type AuthProtocol =
  | AuthProtocols.md5
  | AuthProtocols.sha
  | AuthProtocols.sha224
  | AuthProtocols.sha256
  | AuthProtocols.sha384
  | AuthProtocols.sha512;
type AuthAlgorithms = {
  [protocol: string]: AuthAlgorithmPayload;
};

export class Authentication {
  public static HMAC_BUFFER_SIZE = 1024 * 1024;
  public static algorithms: AuthAlgorithms = {
    [AuthProtocols.md5]: {
      KEY_LENGTH: 16,
      AUTHENTICATION_CODE_LENGTH: 12,
      CRYPTO_ALGORITHM: 'md5',
    },
    [AuthProtocols.sha]: {
      KEY_LENGTH: 20,
      AUTHENTICATION_CODE_LENGTH: 12,
      CRYPTO_ALGORITHM: 'sha1',
    },
    [AuthProtocols.sha224]: {
      KEY_LENGTH: 28,
      AUTHENTICATION_CODE_LENGTH: 16,
      CRYPTO_ALGORITHM: 'sha224',
    },
    [AuthProtocols.sha256]: {
      KEY_LENGTH: 32,
      AUTHENTICATION_CODE_LENGTH: 24,
      CRYPTO_ALGORITHM: 'sha256',
    },
    [AuthProtocols.sha384]: {
      KEY_LENGTH: 48,
      AUTHENTICATION_CODE_LENGTH: 32,
      CRYPTO_ALGORITHM: 'sha384',
    },
    [AuthProtocols.sha512]: {
      KEY_LENGTH: 64,
      AUTHENTICATION_CODE_LENGTH: 48,
      CRYPTO_ALGORITHM: 'sha512',
    },
  };
  public static authToKeyCache: {
    [key: string]: Buffer;
  } = {};

  public static computeCacheKey(
    // TODO: Check if it is a string or a number so we can use AuthProtocol type
    authProtocol: AuthProtocol,
    authPasswordString: string,
    engineID: Buffer
  ): string {
    const engineIDString = engineID.toString('base64');
    return authProtocol + authPasswordString + engineIDString;
  }

  // Adapted from RFC3414 Appendix A.2.1. Password to Key Sample Code for MD5
  public static passwordToKey(
    authProtocol: AuthProtocol,
    authPasswordString: string,
    engineID: Buffer
  ): Buffer {
    let hashAlgorithm: Hash;

    const cryptoAlgorithm = Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM;

    const cacheKey = Authentication.computeCacheKey(authProtocol, authPasswordString, engineID);
    if (Authentication.authToKeyCache[cacheKey] !== undefined) {
      return Authentication.authToKeyCache[cacheKey];
    }

    // TODO: Check const or let
    const buf = Buffer.alloc(Authentication.HMAC_BUFFER_SIZE, authPasswordString);
    hashAlgorithm = createHash(cryptoAlgorithm);
    hashAlgorithm.update(buf);

    // TODO: Check const or let
    const firstDigest = hashAlgorithm.digest();
    hashAlgorithm = createHash(cryptoAlgorithm);
    hashAlgorithm.update(firstDigest);
    hashAlgorithm.update(engineID);
    hashAlgorithm.update(firstDigest);

    // TODO: Check const or let
    const finalDigest = hashAlgorithm.digest();
    Authentication.authToKeyCache[cacheKey] = finalDigest;
    return finalDigest;
  }

  public static getParametersLength(authProtocol: AuthProtocol): number {
    return Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH;
  }

  public static writeParameters(
    messageBuffer: Buffer,
    authProtocol: AuthProtocol,
    authPassword: string,
    engineID: Buffer,
    digestInMessage: Buffer
  ): void {
    const digestToAdd = Authentication.calculateDigest(
      messageBuffer,
      authProtocol,
      authPassword,
      engineID
    );
    digestToAdd.copy(digestInMessage);
    // debug ("Added Auth Parameters: " + digestToAdd.toString('hex'));
  }

  public static isAuthentic(
    messageBuffer: Buffer,
    authProtocol: AuthProtocol,
    authPassword: string,
    engineID: Buffer,
    digestInMessage: Buffer
  ): boolean {
    if (
      digestInMessage.length !== Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH
    ) {
      return false;
    }

    // save original authenticationParameters field in message
    const savedDigest = Buffer.from(digestInMessage);

    // clear the authenticationParameters field in message
    digestInMessage.fill(0);

    const calculatedDigest = Authentication.calculateDigest(
      messageBuffer,
      authProtocol,
      authPassword,
      engineID
    );

    // replace previously cleared authenticationParameters field in message
    savedDigest.copy(digestInMessage);

    // debug ("Digest in message: " + digestInMessage.toString('hex'));
    // debug ("Calculated digest: " + calculatedDigest.toString('hex'));
    return calculatedDigest.equals(digestInMessage);
  }

  public static calculateDigest(
    messageBuffer: Buffer,
    authProtocol: AuthProtocol,
    authPassword: string,
    engineID: Buffer
  ): Buffer {
    const authKey = Authentication.passwordToKey(authProtocol, authPassword, engineID);

    const cryptoAlgorithm = Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM;
    const hmacAlgorithm = createHmac(cryptoAlgorithm, authKey);
    hmacAlgorithm.update(messageBuffer);
    const digest = hmacAlgorithm.digest();
    return digest.subarray(0, Authentication.algorithms[authProtocol].AUTHENTICATION_CODE_LENGTH);
  }
}
