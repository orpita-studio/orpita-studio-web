/**
 * ============================================================================
 * SOLVER WORKER - FIXED & OPTIMIZED
 * 100% Accurate score calculation
 * ============================================================================
 */

// ============================================================================
// SECTION 1: WORKER ENTRY POINT
// ============================================================================

self.onmessage = (e) => {
    if (e.data.cmd === 'solve') runSolver(e.data.config);
};

// ============================================================================
// SECTION 2: MATHEMATICAL UTILITIES
// ============================================================================

function nCrBig(n, r) {
    n = BigInt(n); r = BigInt(r);
    if (r < 0n || r > n) return 0n;
    if (r === 0n || r === n) return 1n;
    if (r > n / 2n) r = n - r;
    let res = 1n;
    for (let i = 1n; i <= r; i++) res = (res * (n - i + 1n)) / i;
    return res;
}

function* getCombinations(arr, k) {
    if (k === 0) { yield []; return; }
    if (k > arr.length) return;
    let indices = Array.from({ length: k }, (_, x) => x);
    while (true) {
        yield indices.map(x => arr[x]);
        let idx = k - 1;
        while (idx >= 0 && indices[idx] === idx + arr.length - k) idx--;
        if (idx < 0) break;
        indices[idx]++;
        for (let j = idx + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
    }
}

// ============================================================================
// SECTION 2.5: PERFORMANCE UTILITIES
// ============================================================================

class BitArray {
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

// ============================================================================
// SECTION 3: GRID & SCORING LOGIC
// ============================================================================

function computeNeighbors(rows, cols, total, blocksSet) {
    const neighbors = new Array(total);
    
    for (let i = 0; i < total; i++) {
        neighbors[i] = [];
        if (blocksSet.has(i)) continue;
        
        const r = (i / cols) | 0, c = i % cols;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const rr = r + dr, cc = c + dc;
                if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
                    const ni = rr * cols + cc;
                    if (!blocksSet.has(ni)) neighbors[i].push(ni);
                }
            }
        }
    }
    
    return neighbors;
}

/** 
 * ✅ FIXED: Calculate COMPLETE score with all bombs 
 * This is the reference implementation - 100% accurate
 */
function calculateCompleteScore(normC, powC, negC, mustBombs, neighbors, totalCells) {
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

// ============================================================================
// SECTION 4: CONDITION CHECKING
// ============================================================================

function checkCondition(cond, ctx) {
    if (!cond) return false;
    const { sum, allBombsSet, cellValues, blockedSwitches } = ctx;
    
    switch (cond.type) {
        case 'getScore': 
            return sum === cond.value;
            
        case 'placeBombAt': 
            if (!cond.cells) return false;
            for (let i = 0; i < cond.cells.length; i++) {
                if (!allBombsSet.has(cond.cells[i])) return false;
            }
            return true;
            
        case 'anyCellValue':
            for (let val of cellValues.values()) {
                if (val === cond.value) return true;
            }
            return false;
            
        case 'cellValues':
            if (!cond.requirements) return false;
            for (let i = 0; i < cond.requirements.length; i++) {
                const r = cond.requirements[i];
                if (cellValues.get(r.id) !== r.value) return false;
            }
            return true;
            
        case 'emptyCellsCount':
            let zeros = 0;
            for (let [id, val] of cellValues) {
                if (val === 0 && !allBombsSet.has(id)) zeros++;
            }
            return zeros === cond.value;
            
        case 'setSwitches':
            if (!cond.requirements) return false;
            for (let i = 0; i < cond.requirements.length; i++) {
                const req = cond.requirements[i];
                const isBlocked = blockedSwitches.has(req.id);
                const expected = req.state === 'SWITCH_OFF' ? isBlocked : !isBlocked;
                if (!expected) return false;
            }
            return true;
            
        default: 
            return false;
    }
}

// ============================================================================
// SECTION 5: MAIN SOLVER EXECUTION
// ============================================================================

function runSolver(config) {
    const { rows, cols, blocks, mustBombs, switches, bombs1, bombs2, bombsNeg, tmin, tmax, maxSolutions, starConditions, maxAnalysisSolutions } = config;
    const totalCells = rows * cols;
    const numSwitchStates = 1 << switches.length;
    
    const solutions = []; 
    const targetStats = {}; 
    const heatmap = { 
        normal: new Uint32Array(totalCells), 
        power: new Uint32Array(totalCells), 
        negative: new Uint32Array(totalCells), 
        totalFound: 0 
    };
    const condStats = { 'C1_Only':0, 'C2_Only':0, 'C3_Only':0, 'C1_C2':0, 'C1_C3':0, 'C2_C3':0, 'C1_C2_C3':0, 'None':0 };
    let validSolutionsCountBig = 0n;

    const availCount = totalCells - blocks.length - mustBombs.length;
    let estimatedCombos = 0n;
    
    function sendLogToMain(message, type = 'default') {
        self.postMessage({ type: 'worker-log', message, logType: type });
    }

    if (availCount >= (bombs1 + bombs2 + bombsNeg)) {
        let totalSum = 0n;
        const M = BigInt(availCount);
        const S = BigInt(switches.length);
        const N1 = BigInt(bombs1);
        const N2 = BigInt(bombs2);
        const N3 = BigInt(bombsNeg);

        sendLogToMain(`- Solver Inputs: M=${M}, S=${S}, N1=${N1}, N2=${N2}, N3=${N3}`, 'muted');

        for (let x = 0n; x <= S; x++) {
            const term = nCrBig(M - x, N1) * nCrBig(M - x - N1, N2) * nCrBig(M - x - N1 - N2, N3) * nCrBig(S, x);
            totalSum += term;
        }
        estimatedCombos = totalSum;
    } else {
        estimatedCombos = 0n;
        sendLogToMain(`- Solver Inputs: Not enough available cells.`, 'warning');
    }
    
    sendLogToMain(`- Est. Combos: ${estimatedCombos.toString()}`, 'muted');
    self.postMessage({ type: 'estUpdate', value: estimatedCombos.toString() });

    let processedCount = 0n, lastTime = Date.now();

    const hasConditions = starConditions && starConditions.length > 0;
    const cond0 = hasConditions && starConditions[0]?.length ? starConditions[0][0] : null;
    const cond1 = hasConditions && starConditions[1]?.length ? starConditions[1][0] : null;
    const cond2 = hasConditions && starConditions[2]?.length ? starConditions[2][0] : null;
    const needCellValues = cond0 || cond1 || cond2;

    outerLoop:
    for (let i = 0; i < numSwitchStates; i++) {
        const blockedSwitches = new Set();
        for (let j = 0; j < switches.length; j++) {
            if ((i >> j) & 1) blockedSwitches.add(switches[j]);
        }

        const currentBlocks = new Set([...blocks, ...blockedSwitches]);
        const neighbors = computeNeighbors(rows, cols, totalCells, currentBlocks);
        
        const avail = [];
        for (let k = 0; k < totalCells; k++) {
            if (!currentBlocks.has(k) && !mustBombs.includes(k)) {
                avail.push(k);
            }
        }
        
        if (avail.length < bombs1 + bombs2 + bombsNeg) continue;

        for (const normC of getCombinations(avail, bombs1)) {
            const rem1 = avail.filter(x => !normC.includes(x));
            
            for (const powC of getCombinations(rem1, bombs2)) {
                const rem2 = rem1.filter(x => !powC.includes(x));
                
                // Update Progress
                processedCount += nCrBig(rem2.length, bombsNeg);
                if (Date.now() - lastTime > 100) {
                    let pct = estimatedCombos > 0n ? Number((processedCount * 100n) / estimatedCombos) : 0;
                    self.postMessage({ type: 'progress', value: Math.min(pct, 100) });
                    lastTime = Date.now();
                }

                for (const negC of getCombinations(rem2, bombsNeg)) {
                    
                    // ✅ FIXED: Calculate complete score in one go
                    const sum = calculateCompleteScore(normC, powC, negC, mustBombs, neighbors, totalCells);

                    if (sum >= tmin && sum <= tmax) {
                        if (heatmap.totalFound >= maxAnalysisSolutions) break outerLoop;

                        heatmap.totalFound++;
                        validSolutionsCountBig++;
                        targetStats[sum] = (targetStats[sum] || 0) + 1;
                        
                        const finalNorm = [...mustBombs, ...normC];
                        for (let x of finalNorm) heatmap.normal[x]++;
                        for (let x of powC) heatmap.power[x]++;
                        for (let x of negC) heatmap.negative[x]++;

                        let cellVals = null;
                        let cSt = [false, false, false];
                        
                        if (needCellValues) {
                            // Create bitmap for cell value calculation
                            const bombsBitArray = new BitArray(totalCells);
                            for (let b of normC) bombsBitArray.set(b);
                            for (let b of powC) bombsBitArray.set(b);
                            for (let b of negC) bombsBitArray.set(b);
                            for (let b of mustBombs) bombsBitArray.set(b);
                            
                            cellVals = new Map();
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

                            const allBombsSet = new Set([...finalNorm, ...powC, ...negC]);
                            const ctx = { sum, allBombsSet, cellValues: cellVals, blockedSwitches };
                            
                            if (cond0) cSt[0] = checkCondition(cond0, ctx);
                            if (cond1) cSt[1] = checkCondition(cond1, ctx);
                            if (cond2) cSt[2] = checkCondition(cond2, ctx);
                        }

                        const active = cSt[0] + cSt[1] + cSt[2];
                        
                        if (active === 0) condStats['None']++;
                        else if (cSt[0] && cSt[1] && cSt[2]) condStats['C1_C2_C3']++;
                        else if (cSt[0] && cSt[1]) condStats['C1_C2']++;
                        else if (cSt[0] && cSt[2]) condStats['C1_C3']++;
                        else if (cSt[1] && cSt[2]) condStats['C2_C3']++;
                        else if (cSt[0]) condStats['C1_Only']++;
                        else if (cSt[1]) condStats['C2_Only']++;
                        else if (cSt[2]) condStats['C3_Only']++;

                        const isPerfect = cSt[0] && cSt[1] && cSt[2];
                        if (solutions.length < maxSolutions || isPerfect) {
                            solutions.push({
                                normalBombs: normC.slice(),
                                powerBombs: powC.slice(),
                                negativeBombs: negC.slice(),
                                sum,
                                conditionStatus: cSt.slice(),
                                switchState: Array.from(blockedSwitches)
                            });
                        }
                    }
                }
            }
        }
    }

    self.postMessage({
        type: 'done',
        solutions,
        stats: heatmap,
        targetStats,
        conditionStats: condStats,
        validSolutionsCountBig: validSolutionsCountBig.toString(),
        lastTotalCombinations: estimatedCombos.toString()
    });
}