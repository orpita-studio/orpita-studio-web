/**
 * ============================================================================
 * SOLVER WORKER - FIXED & OPTIMIZED WITH ADVANCED ANALYTICS
 * 100% Accurate score calculation + Comprehensive Analysis
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
    
    // 🆕 NEW ANALYTICS
    // 1. Cell Values Analysis - لكل خلية، كل رقم ظهر فيها كام مرة
    const cellValuesAnalysis = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
        cellValuesAnalysis[i] = new Map(); // Map<value, count>
    }
    
    // 2. Number Frequency Analysis - كل رقم ظهر كام مرة في الشبكة كلها
    const numberFrequency = new Map(); // Map<value, count>
    
    // 3. Empty Cells Count Analysis - عدد الخلايا الفارغة في كل solution
    const emptyCellsStats = {}; // {count: frequency}
    
    // 4. Switch State Analysis - كل سويتش مفتوح/مقفول كام مرة
    const switchAnalysis = new Map(); // Map<switchId, {on: count, off: count}>
    for (let sw of switches) {
        switchAnalysis.set(sw, { on: 0, off: 0 });
    }
    
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

                        // Calculate cell values for analytics (always needed now)
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

                        // 🆕 ANALYTICS COLLECTION
                        
                        // 1. Cell Values Analysis - record what value appeared in each cell
                        for (let cellId = 0; cellId < totalCells; cellId++) {
                            if (!bombsBitArray.has(cellId)) {
                                const val = cellVals.get(cellId);
                                const cellMap = cellValuesAnalysis[cellId];
                                cellMap.set(val, (cellMap.get(val) || 0) + 1);
                            }
                        }
                        
                        // 2. Number Frequency Analysis - count how many times each number appears
                        for (let [cellId, val] of cellVals) {
                            if (!bombsBitArray.has(cellId)) {
                                numberFrequency.set(val, (numberFrequency.get(val) || 0) + 1);
                            }
                        }
                        
                        // 3. Empty Cells Count Analysis
                        let emptyCells = 0;
                        for (let [cellId, val] of cellVals) {
                            if (val === 0 && !bombsBitArray.has(cellId)) {
                                emptyCells++;
                            }
                        }
                        emptyCellsStats[emptyCells] = (emptyCellsStats[emptyCells] || 0) + 1;
                        
                        // 4. Switch State Analysis
                        for (let sw of switches) {
                            if (blockedSwitches.has(sw)) {
                                switchAnalysis.get(sw).off++;
                            } else {
                                switchAnalysis.get(sw).on++;
                            }
                        }

                        // Condition checking
                        let cSt = [false, false, false];
                        
                        if (needCellValues) {
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

    // 🆕 Convert analytics to serializable format
    const cellValuesAnalysisSerialized = cellValuesAnalysis.map(cellMap => {
        const obj = {};
        for (let [val, count] of cellMap) {
            obj[val] = count;
        }
        return obj;
    });
    
    const numberFrequencySerialized = {};
    for (let [val, count] of numberFrequency) {
        numberFrequencySerialized[val] = count;
    }
    
    const switchAnalysisSerialized = {};
    for (let [swId, states] of switchAnalysis) {
        switchAnalysisSerialized[swId] = states;
    }

    // 🆕 Prepare analytics messages for Logger
    const analyticsMessages = formatAnalyticsForLogger({
        totalSolutions: heatmap.totalFound,
        targetStats,
        cellValuesAnalysis: cellValuesAnalysisSerialized,
        numberFrequency: numberFrequencySerialized,
        emptyCellsStats,
        switchAnalysis: switchAnalysisSerialized,
        conditionStats: condStats,
        rows,
        cols
    });

    self.postMessage({
        type: 'done',
        solutions,
        stats: heatmap,
        targetStats,
        conditionStats: condStats,
        validSolutionsCountBig: validSolutionsCountBig.toString(),
        lastTotalCombinations: estimatedCombos.toString(),
        // 🆕 NEW ANALYTICS
        cellValuesAnalysis: cellValuesAnalysisSerialized,
        numberFrequency: numberFrequencySerialized,
        emptyCellsStats,
        switchAnalysis: switchAnalysisSerialized,
        analyticsMessages, // 🆕 Ready-to-log messages
        rows,
        cols
    });
}

// ============================================================================
// SECTION 6: ANALYTICS FORMATTING FOR UI
// ============================================================================

/**
 * Format analytics data for display in Logger UI
 * This is called from main thread, not from worker
 */
function formatAnalyticsForLogger(data) {
    const { totalSolutions, targetStats, cellValuesAnalysis, numberFrequency, 
            emptyCellsStats, switchAnalysis, conditionStats, rows, cols } = data;
    
    const messages = [];
    
    // Header
    messages.push({
        text: '═'.repeat(60),
        type: 'info'
    });
    messages.push({
        text: '🎯 ANALYTICS REPORT',
        type: 'info'
    });
    messages.push({
        text: '═'.repeat(60),
        type: 'info'
    });
    
    // 1. Overall Stats
    messages.push({
        text: '📊 OVERALL STATISTICS',
        type: 'info'
    });
    messages.push({
        text: `Total Valid Solutions: <b>${totalSolutions.toLocaleString()}</b>`,
        type: 'default'
    });
    
    // 2. Score Distribution
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '🎲 SCORE DISTRIBUTION',
        type: 'info'
    });
    const scores = Object.keys(targetStats).map(Number).sort((a, b) => a - b);
    for (let score of scores) {
        const count = targetStats[score];
        const percentage = ((count / totalSolutions) * 100).toFixed(2);
        const barLength = Math.min(Math.floor(count / totalSolutions * 20), 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        messages.push({
            text: `Score ${score.toString().padStart(3)} : ${count.toString().padStart(6)} (${percentage.padStart(6)}%)  |${bar}|`,
            type: 'muted'
        });
    }
    
    // 3. Number Frequency Analysis
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '🔢 NUMBER FREQUENCY (Total occurrences)',
        type: 'info'
    });
    const numbers = Object.keys(numberFrequency).map(Number).sort((a, b) => a - b);
    const totalNumbers = Object.values(numberFrequency).reduce((a, b) => a + b, 0);
    for (let num of numbers) {
        const count = numberFrequency[num];
        const percentage = ((count / totalNumbers) * 100).toFixed(1);
        const barLength = Math.min(Math.floor(count / totalNumbers * 20), 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        messages.push({
            text: `Number ${num.toString().padStart(2)} : ${count.toString().padStart(8)}x (${percentage.padStart(5)}%) |${bar}|`,
            type: 'muted'
        });
    }
    
    // 4. Empty Cells Distribution
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '⬜ EMPTY CELLS DISTRIBUTION',
        type: 'info'
    });
    const emptyCounts = Object.keys(emptyCellsStats).map(Number).sort((a, b) => a - b);
    for (let count of emptyCounts) {
        const freq = emptyCellsStats[count];
        const percentage = ((freq / totalSolutions) * 100).toFixed(2);
        const barLength = Math.min(Math.floor(freq / totalSolutions * 20), 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        messages.push({
            text: `${count.toString().padStart(2)} empty cells : ${freq.toString().padStart(6)} sols (${percentage.padStart(6)}%) |${bar}|`,
            type: 'muted'
        });
    }
    
    // 5. Switch Analysis
    if (Object.keys(switchAnalysis).length > 0) {
        messages.push({
            text: '',
            type: 'default'
        });
        messages.push({
            text: '🔀 SWITCH STATE ANALYSIS',
            type: 'info'
        });
        for (let [swId, states] of Object.entries(switchAnalysis)) {
            const total = states.on + states.off;
            const onPct = ((states.on / total) * 100).toFixed(1);
            const offPct = ((states.off / total) * 100).toFixed(1);
            
            const onBarLength = Math.min(Math.floor(states.on / total * 20), 20);
            const offBarLength = Math.min(Math.floor(states.off / total * 20), 20);
            
            const onBar = '█'.repeat(onBarLength) + '░'.repeat(20 - onBarLength);
            const offBar = '█'.repeat(offBarLength) + '░'.repeat(20 - offBarLength);
            
            messages.push({
                text: `Switch ${swId.toString().padStart(3)}:`,
                type: 'warning'
            });
            messages.push({
                text: `  ON  (🟢): ${states.on.toString().padStart(6)} (${onPct.padStart(5)}%) |${onBar}|`,
                type: 'muted'
            });
            messages.push({
                text: `  OFF (🔴): ${states.off.toString().padStart(6)} (${offPct.padStart(5)}%) |${offBar}|`,
                type: 'muted'
            });
        }
    }
    
    // 6. Cell Values Analysis (top cells)
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '🎨 CELL VALUES ANALYSIS (Top 10 Varied Cells)',
        type: 'info'
    });
    const cellVariations = cellValuesAnalysis.map((valMap, cellId) => {
        const values = Object.keys(valMap).map(Number);
        return {
            cellId,
            variation: values.length,
            values: valMap,
            row: Math.floor(cellId / cols),
            col: cellId % cols
        };
    }).filter(c => c.variation > 0)
      .sort((a, b) => b.variation - a.variation)
      .slice(0, 64);
    
    for (let cell of cellVariations) {
        messages.push({
            text: `Cell ${cell.cellId.toString().padStart(3)} (R:${cell.row}, C:${cell.col}) - ${cell.variation} values:`,
            type: 'warning'
        });
        const sortedValues = Object.keys(cell.values).map(Number).sort((a, b) => a - b);
        for (let val of sortedValues) {
            const count = cell.values[val];
            const pct = ((count / totalSolutions) * 100).toFixed(1);
            const barLength = Math.min(Math.floor(count / totalSolutions * 15), 15);
            const bar = '█'.repeat(barLength) + '░'.repeat(15 - barLength);
            messages.push({
                text: `  Val ${val.toString().padStart(2)}: ${count.toString().padStart(6)}x (${pct.padStart(5)}%) |${bar}|`,
                type: 'muted'
            });
        }
    }
    
    // 7. Condition Stats
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '⭐ CONDITION STATISTICS',
        type: 'info'
    });
    const condEntries = Object.entries(conditionStats).filter(([_, count]) => count > 0);
    for (let [cond, count] of condEntries) {
        const percentage = ((count / totalSolutions) * 100).toFixed(2);
        const bar = '█'.repeat(Math.min(Math.floor(count / totalSolutions * 30), 30));
        messages.push({
            text: `${cond.padEnd(15)}: ${count.toString().padStart(6)} (${percentage.padStart(6)}%) ${bar}`,
            type: 'default'
        });
    }
    
    // Footer
    messages.push({
        text: '',
        type: 'default'
    });
    messages.push({
        text: '═'.repeat(60),
        type: 'info'
    });
    messages.push({
        text: '✅ END OF ANALYTICS REPORT',
        type: 'success'
    });
    messages.push({
        text: '═'.repeat(60),
        type: 'info'
    });
    
    return messages;
}