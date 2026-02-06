/**
 * ============================================================================
 * BIT ARRAY UTILITY
 * High-performance bitmap for bomb tracking
 * ============================================================================
 */

export class BitArray {
    constructor(size) {
        this.size = size;
        this.data = new Uint32Array(Math.ceil(size / 32));
    }
    
    set(index) {
        this.data[index >>> 5] |= (1 << (index & 31));
    }
    
    has(index) {
        return (this.data[index >>> 5] & (1 << (index & 31))) !== 0;
    }
    
    clear() {
        this.data.fill(0);
    }
}