/**
 * ============================================================================
 * MATHEMATICAL UTILITIES
 * Combinatorics and BigInt calculations
 * ============================================================================
 */

/**
 * Calculate nCr (combinations) using BigInt for large numbers
 */
export function nCrBig(n, r) {
    n = BigInt(n); 
    r = BigInt(r);
    
    if (r < 0n || r > n) return 0n;
    if (r === 0n || r === n) return 1n;
    if (r > n / 2n) r = n - r;
    
    let res = 1n;
    for (let i = 1n; i <= r; i++) {
        res = (res * (n - i + 1n)) / i;
    }
    return res;
}

/**
 * Generator for combinations - memory efficient
 */
export function* getCombinations(arr, k) {
    if (k === 0) { 
        yield []; 
        return; 
    }
    if (k > arr.length) return;
    
    let indices = Array.from({ length: k }, (_, x) => x);
    
    while (true) {
        yield indices.map(x => arr[x]);
        
        let idx = k - 1;
        while (idx >= 0 && indices[idx] === idx + arr.length - k) idx--;
        if (idx < 0) break;
        
        indices[idx]++;
        for (let j = idx + 1; j < k; j++) {
            indices[j] = indices[j - 1] + 1;
        }
    }
}