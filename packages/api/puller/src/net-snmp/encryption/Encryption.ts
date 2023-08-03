/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var Encryption = {};

Encryption.encryptPdu = function (
  privProtocol,
  scopedPdu,
  privPassword,
  authProtocol,
  engine
) {
  var encryptFunction = Encryption.algorithms[privProtocol].encryptPdu;
  return encryptFunction(
    scopedPdu,
    privProtocol,
    privPassword,
    authProtocol,
    engine
  );
};

Encryption.decryptPdu = function (
  privProtocol,
  encryptedPdu,
  privParameters,
  privPassword,
  authProtocol,
  engine
) {
  var decryptFunction = Encryption.algorithms[privProtocol].decryptPdu;
  return decryptFunction(
    encryptedPdu,
    privProtocol,
    privParameters,
    privPassword,
    authProtocol,
    engine
  );
};

Encryption.debugEncrypt = function (
  encryptionKey,
  iv,
  plainPdu,
  encryptedPdu
) {
  debug("Key: " + encryptionKey.toString("hex"));
  debug("IV:  " + iv.toString("hex"));
  debug("Plain:     " + plainPdu.toString("hex"));
  debug("Encrypted: " + encryptedPdu.toString("hex"));
};

Encryption.debugDecrypt = function (
  decryptionKey,
  iv,
  encryptedPdu,
  plainPdu
) {
  debug("Key: " + decryptionKey.toString("hex"));
  debug("IV:  " + iv.toString("hex"));
  debug("Encrypted: " + encryptedPdu.toString("hex"));
  debug("Plain:     " + plainPdu.toString("hex"));
};

Encryption.generateLocalizedKey = function (
  algorithm,
  authProtocol,
  privPassword,
  engineID
) {
  var privLocalizedKey;
  var encryptionKey;

  privLocalizedKey = Authentication.passwordToKey(
    authProtocol,
    privPassword,
    engineID
  );
  encryptionKey = Buffer.alloc(algorithm.KEY_LENGTH);
  privLocalizedKey.copy(encryptionKey, 0, 0, algorithm.KEY_LENGTH);

  return encryptionKey;
};

Encryption.generateLocalizedKeyBlumenthal = function (
  algorithm,
  authProtocol,
  privPassword,
  engineID
) {
  let authKeyLength;
  let privLocalizedKey;
  let encryptionKey;
  let rounds;
  let hashInput;
  let nextHash;
  let hashAlgorithm;

  authKeyLength = Authentication.algorithms[authProtocol].KEY_LENGTH;
  rounds = Math.ceil(algorithm.KEY_LENGTH / authKeyLength);
  encryptionKey = Buffer.alloc(algorithm.KEY_LENGTH);
  privLocalizedKey = Authentication.passwordToKey(
    authProtocol,
    privPassword,
    engineID
  );
  nextHash = privLocalizedKey;

  for (let round = 0; round < rounds; round++) {
    nextHash.copy(encryptionKey, round * authKeyLength, 0, authKeyLength);
    if (round < rounds - 1) {
      hashAlgorithm = crypto.createHash(
        Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM
      );
      hashInput = Buffer.alloc((round + 1) * authKeyLength);
      encryptionKey.copy(
        hashInput,
        round * authKeyLength,
        0,
        (round + 1) * authKeyLength
      );
      hashAlgorithm.update(hashInput);
      nextHash = hashAlgorithm.digest();
    }
  }

  return encryptionKey;
};

Encryption.generateLocalizedKeyReeder = function (
  algorithm,
  authProtocol,
  privPassword,
  engineID
) {
  let authKeyLength;
  let privLocalizedKey;
  let encryptionKey;
  let rounds;
  let nextPasswordInput;

  authKeyLength = Authentication.algorithms[authProtocol].KEY_LENGTH;
  rounds = Math.ceil(algorithm.KEY_LENGTH / authKeyLength);
  encryptionKey = Buffer.alloc(algorithm.KEY_LENGTH);
  nextPasswordInput = privPassword;

  for (let round = 0; round < rounds; round++) {
    privLocalizedKey = Authentication.passwordToKey(
      authProtocol,
      nextPasswordInput,
      engineID
    );
    privLocalizedKey.copy(
      encryptionKey,
      round * authKeyLength,
      0,
      authKeyLength
    );
    nextPasswordInput = privLocalizedKey;
  }

  return encryptionKey;
};

Encryption.encryptPduDes = function (
  scopedPdu,
  privProtocol,
  privPassword,
  authProtocol,
  engine
) {
  var des = Encryption.algorithms[PrivProtocols.des];
  var privLocalizedKey;
  var encryptionKey;
  var preIv;
  var salt;
  var iv;
  var i;
  var paddedScopedPduLength;
  var paddedScopedPdu;
  var encryptedPdu;
  var cipher;

  encryptionKey = Encryption.generateLocalizedKey(
    des,
    authProtocol,
    privPassword,
    engine.engineID
  );
  privLocalizedKey = Authentication.passwordToKey(
    authProtocol,
    privPassword,
    engine.engineID
  );
  encryptionKey = Buffer.alloc(des.KEY_LENGTH);
  privLocalizedKey.copy(encryptionKey, 0, 0, des.KEY_LENGTH);
  preIv = Buffer.alloc(des.BLOCK_LENGTH);
  privLocalizedKey.copy(
    preIv,
    0,
    des.KEY_LENGTH,
    des.KEY_LENGTH + des.BLOCK_LENGTH
  );

  salt = Buffer.alloc(des.BLOCK_LENGTH);
  // set local SNMP engine boots part of salt to 1, as we have no persistent engine state
  salt.fill("00000001", 0, 4, "hex");
  // set local integer part of salt to random
  salt.fill(crypto.randomBytes(4), 4, 8);
  iv = Buffer.alloc(des.BLOCK_LENGTH);
  for (i = 0; i < iv.length; i++) {
    iv[i] = preIv[i] ^ salt[i];
  }

  if (scopedPdu.length % des.BLOCK_LENGTH == 0) {
    paddedScopedPdu = scopedPdu;
  } else {
    paddedScopedPduLength =
      des.BLOCK_LENGTH *
      (Math.floor(scopedPdu.length / des.BLOCK_LENGTH) + 1);
    paddedScopedPdu = Buffer.alloc(paddedScopedPduLength);
    scopedPdu.copy(paddedScopedPdu, 0, 0, scopedPdu.length);
  }
  cipher = crypto.createCipheriv(des.CRYPTO_ALGORITHM, encryptionKey, iv);
  encryptedPdu = cipher.update(paddedScopedPdu);
  encryptedPdu = Buffer.concat([encryptedPdu, cipher.final()]);
  // Encryption.debugEncrypt (encryptionKey, iv, paddedScopedPdu, encryptedPdu);

  return {
    encryptedPdu: encryptedPdu,
    msgPrivacyParameters: salt,
  };
};

Encryption.decryptPduDes = function (
  encryptedPdu,
  privProtocol,
  privParameters,
  privPassword,
  authProtocol,
  engine
) {
  var des = Encryption.algorithms[PrivProtocols.des];
  var privLocalizedKey;
  var decryptionKey;
  var preIv;
  var salt;
  var iv;
  var i;
  var decryptedPdu;
  var decipher;

  privLocalizedKey = Authentication.passwordToKey(
    authProtocol,
    privPassword,
    engine.engineID
  );
  decryptionKey = Buffer.alloc(des.KEY_LENGTH);
  privLocalizedKey.copy(decryptionKey, 0, 0, des.KEY_LENGTH);
  preIv = Buffer.alloc(des.BLOCK_LENGTH);
  privLocalizedKey.copy(
    preIv,
    0,
    des.KEY_LENGTH,
    des.KEY_LENGTH + des.BLOCK_LENGTH
  );

  salt = privParameters;
  iv = Buffer.alloc(des.BLOCK_LENGTH);
  for (i = 0; i < iv.length; i++) {
    iv[i] = preIv[i] ^ salt[i];
  }

  decipher = crypto.createDecipheriv(des.CRYPTO_ALGORITHM, decryptionKey, iv);
  decipher.setAutoPadding(false);
  decryptedPdu = decipher.update(encryptedPdu);
  decryptedPdu = Buffer.concat([decryptedPdu, decipher.final()]);
  // Encryption.debugDecrypt (decryptionKey, iv, encryptedPdu, decryptedPdu);

  return decryptedPdu;
};

Encryption.generateIvAes = function (aes, engineBoots, engineTime, salt) {
  var iv;
  var engineBootsBuffer;
  var engineTimeBuffer;

  // iv = engineBoots(4) | engineTime(4) | salt(8)
  iv = Buffer.alloc(aes.BLOCK_LENGTH);
  engineBootsBuffer = Buffer.alloc(4);
  engineBootsBuffer.writeUInt32BE(engineBoots);
  engineTimeBuffer = Buffer.alloc(4);
  engineTimeBuffer.writeUInt32BE(engineTime);
  engineBootsBuffer.copy(iv, 0, 0, 4);
  engineTimeBuffer.copy(iv, 4, 0, 4);
  salt.copy(iv, 8, 0, 8);

  return iv;
};

Encryption.encryptPduAes = function (
  scopedPdu,
  privProtocol,
  privPassword,
  authProtocol,
  engine
) {
  var aes = Encryption.algorithms[privProtocol];
  var localizationAlgorithm = aes.localizationAlgorithm;
  var encryptionKey;
  var salt;
  var iv;
  var cipher;
  var encryptedPdu;

  encryptionKey = localizationAlgorithm(
    aes,
    authProtocol,
    privPassword,
    engine.engineID
  );
  salt = Buffer.alloc(8).fill(crypto.randomBytes(8), 0, 8);
  iv = Encryption.generateIvAes(
    aes,
    engine.engineBoots,
    engine.engineTime,
    salt
  );
  cipher = crypto.createCipheriv(aes.CRYPTO_ALGORITHM, encryptionKey, iv);
  encryptedPdu = cipher.update(scopedPdu);
  encryptedPdu = Buffer.concat([encryptedPdu, cipher.final()]);
  // Encryption.debugEncrypt (encryptionKey, iv, scopedPdu, encryptedPdu);

  return {
    encryptedPdu: encryptedPdu,
    msgPrivacyParameters: salt,
  };
};

Encryption.decryptPduAes = function (
  encryptedPdu,
  privProtocol,
  privParameters,
  privPassword,
  authProtocol,
  engine
) {
  var aes = Encryption.algorithms[privProtocol];
  var localizationAlgorithm = aes.localizationAlgorithm;
  var decryptionKey;
  var iv;
  var decipher;
  var decryptedPdu;

  decryptionKey = localizationAlgorithm(
    aes,
    authProtocol,
    privPassword,
    engine.engineID
  );
  iv = Encryption.generateIvAes(
    aes,
    engine.engineBoots,
    engine.engineTime,
    privParameters
  );
  decipher = crypto.createDecipheriv(aes.CRYPTO_ALGORITHM, decryptionKey, iv);
  decryptedPdu = decipher.update(encryptedPdu);
  decryptedPdu = Buffer.concat([decryptedPdu, decipher.final()]);
  // Encryption.debugDecrypt (decryptionKey, iv, encryptedPdu, decryptedPdu);

  return decryptedPdu;
};

Encryption.algorithms = {};

Encryption.algorithms[PrivProtocols.des] = {
  CRYPTO_ALGORITHM: "des-cbc",
  KEY_LENGTH: 8,
  BLOCK_LENGTH: 8,
  encryptPdu: Encryption.encryptPduDes,
  decryptPdu: Encryption.decryptPduDes,
  localizationAlgorithm: Encryption.generateLocalizedKey,
};

Encryption.algorithms[PrivProtocols.aes] = {
  CRYPTO_ALGORITHM: "aes-128-cfb",
  KEY_LENGTH: 16,
  BLOCK_LENGTH: 16,
  encryptPdu: Encryption.encryptPduAes,
  decryptPdu: Encryption.decryptPduAes,
  localizationAlgorithm: Encryption.generateLocalizedKey,
};

Encryption.algorithms[PrivProtocols.aes256b] = {
  CRYPTO_ALGORITHM: "aes-256-cfb",
  KEY_LENGTH: 32,
  BLOCK_LENGTH: 16,
  encryptPdu: Encryption.encryptPduAes,
  decryptPdu: Encryption.decryptPduAes,
  localizationAlgorithm: Encryption.generateLocalizedKeyBlumenthal,
};

Encryption.algorithms[PrivProtocols.aes256r] = {
  CRYPTO_ALGORITHM: "aes-256-cfb",
  KEY_LENGTH: 32,
  BLOCK_LENGTH: 16,
  encryptPdu: Encryption.encryptPduAes,
  decryptPdu: Encryption.decryptPduAes,
  localizationAlgorithm: Encryption.generateLocalizedKeyReeder,
};
```
*/

import { Hash, createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { AuthProtocol, Authentication } from '../authentication/Authentication';
import { PrivProtocols } from '../constants';

export interface EncryptPduResult {
  encryptedPdu: Buffer;
  msgPrivacyParameters: Buffer;
}

interface EncryptionAlgorithmPayload {
  CRYPTO_ALGORITHM: string;
  KEY_LENGTH: number;
  BLOCK_LENGTH: number;
  encryptPdu: any;
  decryptPdu: any;
  localizationAlgorithm: any;
}
type PrivProtocol =
  | PrivProtocols.des
  | PrivProtocols.aes
  | PrivProtocols.aes256b
  | PrivProtocols.aes256r;
type EncryptionAlgorithms = {
  [protocol in PrivProtocol]: EncryptionAlgorithmPayload;
};

export class Encryption {
  public static algorithms: EncryptionAlgorithms = {
    [PrivProtocols.des]: {
      CRYPTO_ALGORITHM: 'des-cbc',
      KEY_LENGTH: 8,
      BLOCK_LENGTH: 8,
      encryptPdu: Encryption.encryptPduDes,
      decryptPdu: Encryption.decryptPduDes,
      localizationAlgorithm: Encryption.generateLocalizedKey,
    },
    [PrivProtocols.aes]: {
      CRYPTO_ALGORITHM: 'aes-128-cfb',
      KEY_LENGTH: 16,
      BLOCK_LENGTH: 16,
      encryptPdu: Encryption.encryptPduAes,
      decryptPdu: Encryption.decryptPduAes,
      localizationAlgorithm: Encryption.generateLocalizedKey,
    },
    [PrivProtocols.aes256b]: {
      CRYPTO_ALGORITHM: 'aes-256-cfb',
      KEY_LENGTH: 32,
      BLOCK_LENGTH: 16,
      encryptPdu: Encryption.encryptPduAes,
      decryptPdu: Encryption.decryptPduAes,
      localizationAlgorithm: Encryption.generateLocalizedKeyBlumenthal,
    },
    [PrivProtocols.aes256r]: {
      CRYPTO_ALGORITHM: 'aes-256-cfb',
      KEY_LENGTH: 32,
      BLOCK_LENGTH: 16,
      encryptPdu: Encryption.encryptPduAes,
      decryptPdu: Encryption.decryptPduAes,
      localizationAlgorithm: Encryption.generateLocalizedKeyReeder,
    },
  };

  public static encryptPdu(
    privProtocol: PrivProtocol,
    scopedPdu: Buffer,
    privPassword: string,
    authProtocol: string,
    engine: any
  ) {
    const encryptFunction = Encryption.algorithms[privProtocol].encryptPdu;
    return encryptFunction(scopedPdu, privProtocol, privPassword, authProtocol, engine);
  }

  public static decryptPdu(
    privProtocol: PrivProtocol,
    encryptedPdu: Buffer,
    privParameters: Buffer,
    privPassword: string,
    authProtocol: string,
    engine: any
  ) {
    const decryptFunction = Encryption.algorithms[privProtocol].decryptPdu;
    return decryptFunction(
      encryptedPdu,
      privProtocol,
      privParameters,
      privPassword,
      authProtocol,
      engine
    );
  }

  public static debugEncrypt(
    encryptionKey: Buffer,
    iv: Buffer,
    plainPdu: Buffer,
    encryptedPdu: Buffer
  ) {
    console.log('Encryption key: ' + encryptionKey.toString('hex'));
    console.log('IV: ' + iv.toString('hex'));
    console.log('Plain PDU: ' + plainPdu.toString('hex'));
    console.log('Encrypted PDU: ' + encryptedPdu.toString('hex'));
  }

  public static debugDecrypt(
    decryptionKey: Buffer,
    iv: Buffer,
    encryptedPdu: Buffer,
    plainPdu: Buffer
  ) {
    console.log('Decryption key: ' + decryptionKey.toString('hex'));
    console.log('IV: ' + iv.toString('hex'));
    console.log('Encrypted PDU: ' + encryptedPdu.toString('hex'));
    console.log('Plain PDU: ' + plainPdu.toString('hex'));
  }

  public static generateLocalizedKey(
    encryptionAlgorithm: EncryptionAlgorithmPayload,
    authProtocol: AuthProtocol,
    privPassword: string,
    engineID: Buffer
  ) {
    const privLocalizedKey = Authentication.passwordToKey(authProtocol, privPassword, engineID);
    const encryptionKey = Buffer.alloc(encryptionAlgorithm.KEY_LENGTH);
    privLocalizedKey.copy(encryptionKey, 0, 0, encryptionAlgorithm.KEY_LENGTH);

    return encryptionKey;
  }

  public static generateLocalizedKeyBlumenthal(
    encryptionAlgorithm: EncryptionAlgorithmPayload,
    authProtocol: AuthProtocol,
    privPassword: string,
    engineID: Buffer
  ) {
    const authKeyLength = Authentication.algorithms[authProtocol].KEY_LENGTH;
    const rounds = Math.ceil(encryptionAlgorithm.KEY_LENGTH / authKeyLength);
    const encryptionKey = Buffer.alloc(encryptionAlgorithm.KEY_LENGTH);
    const privLocalizedKey = Authentication.passwordToKey(authProtocol, privPassword, engineID);
    let nextHash = privLocalizedKey;
    let hashAlgorithm: Hash;

    for (let round = 0; round < rounds; round++) {
      nextHash.copy(encryptionKey, round * authKeyLength, 0, authKeyLength);
      if (round < rounds - 1) {
        hashAlgorithm = createHash(Authentication.algorithms[authProtocol].CRYPTO_ALGORITHM);
        const hashInput = Buffer.alloc((round + 1) * authKeyLength);
        encryptionKey.copy(hashInput, round * authKeyLength, 0, (round + 1) * authKeyLength);
        hashAlgorithm.update(hashInput);
        nextHash = hashAlgorithm.digest();
      }
    }

    return encryptionKey;
  }

  public static generateLocalizedKeyReeder(
    encryptionAlgorithm: EncryptionAlgorithmPayload,
    authProtocol: AuthProtocol,
    privPassword: string,
    engineID: Buffer
  ) {
    const authKeyLength = Authentication.algorithms[authProtocol].KEY_LENGTH;
    const rounds = Math.ceil(encryptionAlgorithm.KEY_LENGTH / authKeyLength);
    const encryptionKey = Buffer.alloc(encryptionAlgorithm.KEY_LENGTH);
    let nextPasswordInput = privPassword;
    let privLocalizedKey: Buffer;

    for (let round = 0; round < rounds; round++) {
      privLocalizedKey = Authentication.passwordToKey(authProtocol, nextPasswordInput, engineID);
      privLocalizedKey.copy(encryptionKey, round * authKeyLength, 0, authKeyLength);
      // TODO: Check type (string|Buffer) Authentication.passwordToKey() receives string, encoding?
      nextPasswordInput = privLocalizedKey.toString('hex');
    }

    return encryptionKey;
  }

  public static encryptPduDes(
    scopedPdu: Buffer,
    privProtocol: any,
    privPassword: string,
    authProtocol: AuthProtocol,
    engine: any
  ): EncryptPduResult {
    const desAlgorithm = Encryption.algorithms[PrivProtocols.des];
    // TODO: Removed since it is immediately reassigned
    // let encryptionKey = Encryption.generateLocalizedKey(
    //   desEncryptionAlgorithm,
    //   authProtocol,
    //   privPassword,
    //   engine.engineID
    // );
    const privLocalizedKey = Authentication.passwordToKey(
      authProtocol,
      privPassword,
      engine.engineID
    );

    const encryptionKey = Buffer.alloc(desAlgorithm.KEY_LENGTH);
    privLocalizedKey.copy(encryptionKey, 0, 0, desAlgorithm.KEY_LENGTH);

    const preInitVector = Buffer.alloc(desAlgorithm.BLOCK_LENGTH);
    privLocalizedKey.copy(
      preInitVector,
      0,
      desAlgorithm.KEY_LENGTH,
      desAlgorithm.KEY_LENGTH + desAlgorithm.BLOCK_LENGTH
    );

    const salt = Buffer.alloc(desAlgorithm.BLOCK_LENGTH);
    // set local SNMP engine boots part of salt to 1, as we have no persistent engine state
    salt.fill('00000001', 0, 4, 'hex');
    // set local integer part of salt to random
    salt.fill(randomBytes(4), 4, 8);
    const initVector = Buffer.alloc(desAlgorithm.BLOCK_LENGTH);
    for (let pos = 0; pos < initVector.length; pos++) {
      initVector[pos] = preInitVector[pos] ^ salt[pos];
    }

    let paddedScopedPdu: Buffer;
    if (scopedPdu.length % desAlgorithm.BLOCK_LENGTH == 0) {
      paddedScopedPdu = scopedPdu;
    } else {
      const paddedScopedPduLength =
        desAlgorithm.BLOCK_LENGTH * (Math.floor(scopedPdu.length / desAlgorithm.BLOCK_LENGTH) + 1);
      paddedScopedPdu = Buffer.alloc(paddedScopedPduLength);
      scopedPdu.copy(paddedScopedPdu, 0, 0, scopedPdu.length);
    }
    const cipher = createCipheriv(desAlgorithm.CRYPTO_ALGORITHM, encryptionKey, initVector);
    let encryptedPdu = cipher.update(paddedScopedPdu);
    encryptedPdu = Buffer.concat([encryptedPdu, cipher.final()]);
    // Encryption.debugEncrypt (encryptionKey, iv, paddedScopedPdu, encryptedPdu);

    const result: EncryptPduResult = {
      encryptedPdu: encryptedPdu,
      msgPrivacyParameters: salt,
    };
    return result;
  }

  public static decryptPduDes(
    encryptedPdu: Buffer,
    privProtocol: any,
    privParameters: Buffer,
    privPassword: string,
    authProtocol: AuthProtocol,
    engine: any
  ): Buffer {
    const desAlgorithm = Encryption.algorithms[PrivProtocols.des];
    const privLocalizedKey = Authentication.passwordToKey(
      authProtocol,
      privPassword,
      engine.engineID
    );
    const decryptionKey = Buffer.alloc(desAlgorithm.KEY_LENGTH);
    privLocalizedKey.copy(decryptionKey, 0, 0, desAlgorithm.KEY_LENGTH);
    const preInitVector = Buffer.alloc(desAlgorithm.BLOCK_LENGTH);
    privLocalizedKey.copy(
      preInitVector,
      0,
      desAlgorithm.KEY_LENGTH,
      desAlgorithm.KEY_LENGTH + desAlgorithm.BLOCK_LENGTH
    );

    const salt = privParameters;
    const initVector = Buffer.alloc(desAlgorithm.BLOCK_LENGTH);
    for (let pos = 0; pos < initVector.length; pos++) {
      initVector[pos] = preInitVector[pos] ^ salt[pos];
    }

    const decipher = createDecipheriv(desAlgorithm.CRYPTO_ALGORITHM, decryptionKey, initVector);
    decipher.setAutoPadding(false);
    let decryptedPdu = decipher.update(encryptedPdu);
    decryptedPdu = Buffer.concat([decryptedPdu, decipher.final()]);

    return decryptedPdu;
  }

  public static generateIvAes(
    aesAlgorithm: EncryptionAlgorithmPayload,
    engineBoots: number,
    engineTime: number,
    salt: Buffer
  ): Buffer {
    // Initialization vector iv = engineBoots(4) | engineTime(4) | salt(8)
    const iv = Buffer.alloc(aesAlgorithm.BLOCK_LENGTH);
    const engineBootsBuffer = Buffer.alloc(4);
    engineBootsBuffer.writeUInt32BE(engineBoots);
    const engineTimeBuffer = Buffer.alloc(4);
    engineTimeBuffer.writeUInt32BE(engineTime);
    engineBootsBuffer.copy(iv, 0, 0, 4);
    engineTimeBuffer.copy(iv, 4, 0, 4);
    salt.copy(iv, 8, 0, 8);

    return iv;
  }

  public static encryptPduAes(
    scopedPdu: Buffer,
    privProtocol: any,
    privPassword: string,
    authProtocol: AuthProtocol,
    engine: any
  ): EncryptPduResult {
    const aesAlgorithm = Encryption.algorithms[privProtocol];
    const localizationAlgorithm = aesAlgorithm.localizationAlgorithm;
    const encryptionKey = localizationAlgorithm(
      aesAlgorithm,
      authProtocol,
      privPassword,
      engine.engineID
    );

    const salt = Buffer.alloc(8).fill(randomBytes(8), 0, 8);
    const initVector = Encryption.generateIvAes(
      aesAlgorithm,
      engine.engineBoots,
      engine.engineTime,
      salt
    );

    const cipher = createCipheriv(aesAlgorithm.CRYPTO_ALGORITHM, encryptionKey, initVector);
    let encryptedPdu = cipher.update(scopedPdu);
    encryptedPdu = Buffer.concat([encryptedPdu, cipher.final()]);
    // Encryption.debugEncrypt (encryptionKey, iv, scopedPdu, encryptedPdu);

    const result: EncryptPduResult = {
      encryptedPdu: encryptedPdu,
      msgPrivacyParameters: salt,
    };
    return result;
  }

  public static decryptPduAes(
    encryptedPdu: Buffer,
    privProtocol: any,
    privParameters: Buffer,
    privPassword: string,
    authProtocol: AuthProtocol,
    engine: any
  ): Buffer {
    const aesAlgorithm = Encryption.algorithms[privProtocol];
    const localizationAlgorithm = aesAlgorithm.localizationAlgorithm;
    const decryptionKey = localizationAlgorithm(
      aesAlgorithm,
      authProtocol,
      privPassword,
      engine.engineID
    );

    const initVector = Encryption.generateIvAes(
      aesAlgorithm,
      engine.engineBoots,
      engine.engineTime,
      privParameters
    );

    const decipher = createDecipheriv(aesAlgorithm.CRYPTO_ALGORITHM, decryptionKey, initVector);
    let decryptedPdu = decipher.update(encryptedPdu);
    decryptedPdu = Buffer.concat([decryptedPdu, decipher.final()]);

    return decryptedPdu;
  }
}
