/**
 * ============================================================================
 * SOLVER WORKER - OPTIMIZED & REFACTORED
 * Handles intensive combinatorial search, score calculation, and constraint analysis.
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

/** Calculates combinations (nCr) using BigInt to prevent overflow. */
function nCrBig(n, r) {
    n = BigInt(n); r = BigInt(r);
    if (r < 0n || r > n) return 0n;
    if (r === 0n || r === n) return 1n;
    if (r > n / 2n) r = n - r;
    let res = 1n;
    for (let i = 1n; i <= r; i++) res = (res * (n - i + 1n)) / i;
    return res;
}

/** Generator: Yields all combinations of size k from array arr. */
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
// SECTION 3: GRID & SCORING LOGIC
// ============================================================================

/** Pre-computes non-blocked neighbors for every cell to speed up analysis. */
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

/** Calculates the total score based on bomb placements and neighbors. */
function calculateScoreImpact(normal, power, neg, allBombsSet, neighborsMap, mustBombs) {
    let s = 0;
    // Helper to sum impact
    const calc = (bombs, val) => {
        for (let b of bombs) {
            for (let n of neighborsMap[b]) {
                if (!allBombsSet.has(n)) s += val;
            }
        }
    };
    calc([...mustBombs, ...normal], 1);
    calc(power, 2);
    calc(neg, -1);
    return s;
}

// ============================================================================
// SECTION 4: CONDITION CHECKING
// ============================================================================

/** Validates specific 'Star Conditions' against the current context. */
function checkCondition(cond, ctx) {
    if (!cond) return false;
    const { sum, allBombsSet, cellValues, blockedSwitches } = ctx;
    
    switch (cond.type) {
        case 'getScore': 
            return sum === cond.value;
        case 'placeBombAt': 
            return cond.cells?.every(id => allBombsSet.has(id));
        case 'anyCellValue': 
            for (let val of cellValues.values()) if (val === cond.value) return true;
            return false;
        case 'cellValues': 
            return cond.requirements?.every(r => cellValues.get(r.id) === r.value);
        case 'emptyCellsCount':
            let zeros = 0;
            for (let [id, val] of cellValues) if (val === 0 && !allBombsSet.has(id)) zeros++;
            return zeros === cond.value;
        case 'setSwitches': 
            return cond.requirements?.every(req => {
                const isBlocked = blockedSwitches.has(req.id);
                return req.state === 'SWITCH_OFF' ? isBlocked : !isBlocked;
            });
        default: return false;
    }
}

// ============================================================================
// SECTION 5: MAIN SOLVER EXECUTION
// ============================================================================

function runSolver(config) {
    // 5.1: Initialize Config & Variables
    const { rows, cols, blocks, mustBombs, switches, bombs1, bombs2, bombsNeg, tmin, tmax, maxSolutions, starConditions, maxAnalysisSolutions } = config;
    const totalCells = rows * cols;
    const numSwitchStates = 1 << switches.length;
    
    // Result Containers
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

    // 5.2: Progress Estimation
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
            const term = nCrBig(M - x, N1) 
                       * nCrBig(M - x - N1, N2) 
                       * nCrBig(M - x - N1 - N2, N3) 
                       * nCrBig(S, x);
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

    // 5.3: Main Search Loops
    // Loop 1: Switch States
    outerLoop:
    for (let i = 0; i < numSwitchStates; i++) {
        const blockedSwitches = new Set();
        for (let j = 0; j < switches.length; j++) if ((i >> j) & 1) blockedSwitches.add(switches[j]);

        const currentBlocks = new Set([...blocks, ...blockedSwitches]);
        const neighbors = computeNeighbors(rows, cols, totalCells, currentBlocks);
        
        // Filter available cells
        const avail = [];
        for (let k = 0; k < totalCells; k++) if (!currentBlocks.has(k) && !mustBombs.includes(k)) avail.push(k);
        if (avail.length < bombs1 + bombs2 + bombsNeg) continue;

        // Loop 2: Normal Bombs
        for (const normC of getCombinations(avail, bombs1)) {
            const rem1 = avail.filter(x => !normC.includes(x));
            
            // Loop 3: Power Bombs
            for (const powC of getCombinations(rem1, bombs2)) {
                const rem2 = rem1.filter(x => !powC.includes(x));
                
                // Update Progress
                processedCount += nCrBig(rem2.length, bombsNeg);
                if (Date.now() - lastTime > 100) {
                    let pct = estimatedCombos > 0n ? Number((processedCount * 100n) / estimatedCombos) : 0;
                    self.postMessage({ type: 'progress', value: Math.min(pct, 100) });
                    lastTime = Date.now();
                }

                // Loop 4: Negative Bombs
                for (const negC of getCombinations(rem2, bombsNeg)) {
                    
                    // 5.4: Solution Validation
                    const finalNorm = [...mustBombs, ...normC];
                    const allBombs = new Set([...finalNorm, ...powC, ...negC]);
                    const sum = calculateScoreImpact(normC, powC, negC, allBombs, neighbors, mustBombs);

                    if (sum >= tmin && sum <= tmax) {
                        // Check Limits
                        if (heatmap.totalFound >= maxAnalysisSolutions) break outerLoop;

                        // Record Statistics
                        heatmap.totalFound++;
                        validSolutionsCountBig++;
                        targetStats[sum] = (targetStats[sum] || 0) + 1;
                        
                        for (let x of finalNorm) heatmap.normal[x]++;
                        for (let x of powC) heatmap.power[x]++;
                        for (let x of negC) heatmap.negative[x]++;

                        // Calculate Cell Values (Expensive but needed for conditions)
                        const cellVals = new Map();
                        for(let c=0; c<totalCells; c++) cellVals.set(c, 0);
                        const addV = (arr, v) => {
                            for(let b of arr) for(let n of neighbors[b]) if(!allBombs.has(n)) cellVals.set(n, cellVals.get(n) + v);
                        };
                        addV(finalNorm.filter(x => !mustBombs.includes(x)), 1);
                        addV(mustBombs, 1);
                        addV(powC, 2);
                        addV(negC, -1);

                        // Check Star Conditions
                        const ctx = { sum, allBombsSet: allBombs, cellValues: cellVals, blockedSwitches };
                        const cSt = [false, false, false];
                        if (starConditions?.length) {
                            if (starConditions[0]?.length) cSt[0] = checkCondition(starConditions[0][0], ctx);
                            if (starConditions[1]?.length) cSt[1] = checkCondition(starConditions[1][0], ctx);
                            if (starConditions[2]?.length) cSt[2] = checkCondition(starConditions[2][0], ctx);
                        }

                        // Log Intersection Stats
                        const active = cSt.filter(Boolean).length;
                        if (active === 0) condStats['None']++;
                        else if (cSt[0] && cSt[1] && cSt[2]) condStats['C1_C2_C3']++;
                        else if (cSt[0] && cSt[1]) condStats['C1_C2']++;
                        else if (cSt[0] && cSt[2]) condStats['C1_C3']++;
                        else if (cSt[1] && cSt[2]) condStats['C2_C3']++;
                        else if (cSt[0]) condStats['C1_Only']++;
                        else if (cSt[1]) condStats['C2_Only']++;
                        else if (cSt[2]) condStats['C3_Only']++;

                        // Save Valid Solution
                        const isPerfect = cSt[0] && cSt[1] && cSt[2];
                        if (solutions.length < maxSolutions || isPerfect) {
                            solutions.push({
                                normalBombs: normC, powerBombs: powC, negativeBombs: negC,
                                sum, conditionStatus: cSt, switchState: Array.from(blockedSwitches)
                            });
                        }
                    }
                }
            }
        }
    }

    // 5.5: Final Report
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