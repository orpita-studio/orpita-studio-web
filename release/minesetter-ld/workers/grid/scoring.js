/**
 * ============================================================================
 * SCORING ENGINE
 * 100% Accurate score calculation with all bomb types
 * ============================================================================
 */

import { BitArray } from '/workers/utils/bit-array.js';

/**
 * ✅ FIXED: Calculate COMPLETE score with all bombs
 * This is the reference implementation - 100% accurate
 * 
 * @param {Array<number>} normC - Normal bomb positions
 * @param {Array<number>} powC - Power bomb positions
 * @param {Array<number>} negC - Negative bomb positions
 * @param {Array<number>} mustBombs - Required bomb positions
 * @param {Array<Array<number>>} neighbors - Precomputed neighbor arrays
 * @param {number} totalCells - Total grid cells
 * @returns {number} Total score
 */
export function calculateCompleteScore(normC, powC, negC, mustBombs, neighbors, totalCells) {
    // Create bitmap with ALL bombs
    const bombsBitArray = new BitArray(totalCells);
    
    for (let b of normC) bombsBitArray.set(b);
    for (let b of powC) bombsBitArray.set(b);
    for (let b of negC) bombsBitArray.set(b);
    for (let b of mustBombs) bombsBitArray.set(b);
    
    let score = 0;
    
    // Calculate impact from all normal bombs (including mustBombs)
    const allNormal = [...normC, ...mustBombs];
    for (let i = 0; i < allNormal.length; i++) {
        const b = allNormal[i];
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            // Only count if neighbor is NOT a bomb
            if (!bombsBitArray.has(n)) {
                score += 1;
            }
        }
    }
    
    // Calculate impact from power bombs
    for (let i = 0; i < powC.length; i++) {
        const b = powC[i];
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            if (!bombsBitArray.has(n)) {
                score += 2;
            }
        }
    }
    
    // Calculate impact from negative bombs
    for (let i = 0; i < negC.length; i++) {
        const b = negC[i];
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            if (!bombsBitArray.has(n)) {
                score -= 1;
            }
        }
    }
    
    return score;
}

/**
 * Calculate cell values (numbers displayed on grid)
 * 
 * @param {Array<number>} normC - Normal bomb positions
 * @param {Array<number>} powC - Power bomb positions
 * @param {Array<number>} negC - Negative bomb positions
 * @param {Array<number>} mustBombs - Required bomb positions
 * @param {Array<Array<number>>} neighbors - Precomputed neighbor arrays
 * @param {number} totalCells - Total grid cells
 * @returns {Map<number, number>} Map of cell index to its value
 */
export function calculateCellValues(normC, powC, negC, mustBombs, neighbors, totalCells) {
    // Create bitmap for cell value calculation
    const bombsBitArray = new BitArray(totalCells);
    for (let b of normC) bombsBitArray.set(b);
    for (let b of powC) bombsBitArray.set(b);
    for (let b of negC) bombsBitArray.set(b);
    for (let b of mustBombs) bombsBitArray.set(b);
    
    const cellVals = new Map();
    for (let c = 0; c < totalCells; c++) cellVals.set(c, 0);
    
    // Normal + Must bombs
    const allNormal = [...normC, ...mustBombs];
    for (let b of allNormal) {
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            if (!bombsBitArray.has(n)) {
                cellVals.set(n, cellVals.get(n) + 1);
            }
        }
    }
    
    // Power bombs
    for (let b of powC) {
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            if (!bombsBitArray.has(n)) {
                cellVals.set(n, cellVals.get(n) + 2);
            }
        }
    }
    
    // Negative bombs
    for (let b of negC) {
        const neighs = neighbors[b];
        for (let j = 0; j < neighs.length; j++) {
            const n = neighs[j];
            if (!bombsBitArray.has(n)) {
                cellVals.set(n, cellVals.get(n) - 1);
            }
        }
    }
    
    return cellVals;
}