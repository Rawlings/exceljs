import crypto from 'node:crypto';

const Encryptor = {
  hash(algorithm: string, ...buffers: Buffer[]): Buffer {
    const hash = crypto.createHash(algorithm);
    hash.update(Buffer.concat(buffers));
    return hash.digest();
  },

  convertPasswordToHash(
    password: string,
    hashAlgorithm: string,
    saltValue: string,
    spinCount: number
  ): string {
    const algo = hashAlgorithm.toLowerCase();
    const hashes = crypto.getHashes();
    if (!hashes.includes(algo)) {
      throw new Error(`Hash algorithm '${hashAlgorithm}' not supported!`);
    }

    const passwordBuffer = Buffer.from(password, 'utf16le');
    let key = this.hash(algo, Buffer.from(saltValue, 'base64'), passwordBuffer);
    for (let i = 0; i < spinCount; i++) {
      const iterator = Buffer.alloc(4);
      iterator.writeUInt32LE(i, 0);
      key = this.hash(algo, key, iterator);
    }
    return key.toString('base64');
  },

  randomBytes(size: number): Buffer {
    return crypto.randomBytes(size);
  },
};

export default Encryptor;
