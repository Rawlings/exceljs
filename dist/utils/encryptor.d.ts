declare const Encryptor: {
    /**
     * Calculate a hash of the concatenated buffers with the given algorithm.
     * @param {string} algorithm - The hash algorithm.
     * @returns {Buffer} The hash
     */
    hash(algorithm: any, ...buffers: any): any;
    /**
     * Convert a password into an encryption key
     * @param {string} password - The password
     * @param {string} hashAlgorithm - The hash algoritm
     * @param {string} saltValue - The salt value
     * @param {number} spinCount - The spin count
     * @param {number} keyBits - The length of the key in bits
     * @param {Buffer} blockKey - The block key
     * @returns {Buffer} The encryption key
     */
    convertPasswordToHash(password: any, hashAlgorithm: any, saltValue: any, spinCount: any): any;
    /**
     * Generates cryptographically strong pseudo-random data.
     * @param size The size argument is a number indicating the number of bytes to generate.
     */
    randomBytes(size: any): any;
};
export default Encryptor;
