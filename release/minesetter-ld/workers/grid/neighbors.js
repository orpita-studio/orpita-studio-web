/**
 * ============================================================================
 * GRID NEIGHBORS COMPUTATION
 * Calculate adjacent cells for each grid position
 * ============================================================================
 */

/**
 * Compute neighbor indices for all cells in grid
 * @param {number} rows - Grid rows
 * @param {number} cols - Grid columns  
 * @param {number} total - Total cells (rows * cols)
 * @param {Set} blocksSet - Set of blocked cell indices
 * @returns {Array<Array<number>>} Array where each index contains its neighbors
 */
export function computeNeighbors(rows, cols, total, blocksSet) {
    const neighbors = new Array(total);
    
    for (let i = 0; i < total; i++) {
        neighbors[i] = [];
        if (blocksSet.has(i)) continue;
        
        const r = (i / cols) | 0;
        const c = i % cols;
        
        // Check all 8 directions
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const rr = r + dr;
                const cc = c + dc;
                
                if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
                    const ni = rr * cols + cc;
                    if (!blocksSet.has(ni)) {
                        neighbors[i].push(ni);
                    }
                }
            }
        }
    }
    
    return neighbors;
}