/**
 * ============================================================================
 * SOLVER WORKER - MAIN ENTRY POINT
 * Modular architecture with separated analysis components
 * ============================================================================
 */

// Import utilities
import { BitArray } from './utils/bit-array.js';
import { nCrBig, getCombinations } from './utils/math-utils.js';

// Import grid functions
import { computeNeighbors } from './grid/neighbors.js';
import { calculateCompleteScore, calculateCellValues } from './grid/scoring.js';

// Import condition checker
import { checkCondition } from './conditions/condition-checker.js';

// Import analyzers
import { HeatmapAnalyzer } from './analysis/heatmap-analyzer.js';
import { StatsAnalyzer } from './analysis/stats-analyzer.js';
import { SolutionTracker } from './analysis/solution-tracker.js';

// ============================================================================
// WORKER ENTRY POINT
// ============================================================================

self.onmessage = (e) => {
    if (e.data.cmd === 'solve') runSolver(e.data.config);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendLogToMain(message, type = 'default') {
    self.postMessage({ type: 'worker-log', message, logType: type });
}

function estimateCombinations(availCount, switches, bombs1, bombs2, bombsNeg) {
    if (availCount < (bombs1 + bombs2 + bombsNeg)) {
        return 0n;
    }
    
    let totalSum = 0n;
    const M = BigInt(availCount);
    const S = BigInt(switches.length);
    const N1 = BigInt(bombs1);
    const N2 = BigInt(bombs2);
    const N3 = BigInt(bombsNeg);
    
    for (let x = 0n; x <= S; x++) {
        const term = nCrBig(M - x, N1) * 
                     nCrBig(M - x - N1, N2) * 
                     nCrBig(M - x - N1 - N2, N3) * 
                     nCrBig(S, x);
        totalSum += term;
    }
    
    return totalSum;
}

// ============================================================================
// MAIN SOLVER EXECUTION
// ============================================================================

function runSolver(config) {
    const { 
        rows, cols, blocks, mustBombs, switches, 
        bombs1, bombs2, bombsNeg, 
        tmin, tmax, 
        maxSolutions, 
        starConditions, 
        maxAnalysisSolutions 
    } = config;
    
    const totalCells = rows * cols;
    const numSwitchStates = 1 << switches.length;
    
    // Initialize analyzers
    const heatmap = new HeatmapAnalyzer(totalCells);
    const stats = new StatsAnalyzer();
    const solutionTracker = new SolutionTracker(maxSolutions);
    
    // Calculate available cells and estimate combinations
    const availCount = totalCells - blocks.length - mustBombs.length;
    const estimatedCombos = estimateCombinations(availCount, switches, bombs1, bombs2, bombsNeg);
    
    // Log initial info
    sendLogToMain(`- Solver Inputs: M=${availCount}, S=${switches.length}, N1=${bombs1}, N2=${bombs2}, N3=${bombsNeg}`, 'muted');
    sendLogToMain(`- Est. Combos: ${estimatedCombos.toString()}`, 'muted');
    self.postMessage({ type: 'estUpdate', value: estimatedCombos.toString() });
    
    // Progress tracking
    let processedCount = 0n;
    let lastTime = Date.now();
    
    // Parse conditions
    const hasConditions = starConditions && starConditions.length > 0;
    const cond0 = hasConditions && starConditions[0]?.length ? starConditions[0][0] : null;
    const cond1 = hasConditions && starConditions[1]?.length ? starConditions[1][0] : null;
    const cond2 = hasConditions && starConditions[2]?.length ? starConditions[2][0] : null;
    const needCellValues = cond0 || cond1 || cond2;
    
    // Main solving loop
    outerLoop:
    for (let i = 0; i < numSwitchStates; i++) {
        // Calculate blocked switches for this state
        const blockedSwitches = new Set();
        for (let j = 0; j < switches.length; j++) {
            if ((i >> j) & 1) blockedSwitches.add(switches[j]);
        }
        
        // Compute current blocks and neighbors
        const currentBlocks = new Set([...blocks, ...blockedSwitches]);
        const neighbors = computeNeighbors(rows, cols, totalCells, currentBlocks);
        
        // Get available cells for this switch state
        const avail = [];
        for (let k = 0; k < totalCells; k++) {
            if (!currentBlocks.has(k) && !mustBombs.includes(k)) {
                avail.push(k);
            }
        }
        
        if (avail.length < bombs1 + bombs2 + bombsNeg) continue;
        
        // Iterate through all bomb combinations
        for (const normC of getCombinations(avail, bombs1)) {
            const rem1 = avail.filter(x => !normC.includes(x));
            
            for (const powC of getCombinations(rem1, bombs2)) {
                const rem2 = rem1.filter(x => !powC.includes(x));
                
                // Update progress
                processedCount += nCrBig(rem2.length, bombsNeg);
                if (Date.now() - lastTime > 100) {
                    let pct = estimatedCombos > 0n ? 
                        Number((processedCount * 100n) / estimatedCombos) : 0;
                    self.postMessage({ type: 'progress', value: Math.min(pct, 100) });
                    lastTime = Date.now();
                }
                
                for (const negC of getCombinations(rem2, bombsNeg)) {
                    // Calculate score
                    const sum = calculateCompleteScore(normC, powC, negC, mustBombs, neighbors, totalCells);
                    
                    // Check if score is in target range
                    if (sum >= tmin && sum <= tmax) {
                        if (heatmap.hasReachedLimit(maxAnalysisSolutions)) {
                            break outerLoop;
                        }
                        
                        // Record in heatmap and stats
                        const finalNorm = [...mustBombs, ...normC];
                        heatmap.recordSolution(finalNorm, powC, negC);
                        stats.recordScore(sum);
                        
                        // Check conditions if needed
                        let condStatus = [false, false, false];
                        
                        if (needCellValues) {
                            const cellVals = calculateCellValues(normC, powC, negC, mustBombs, neighbors, totalCells);
                            const allBombsSet = new Set([...finalNorm, ...powC, ...negC]);
                            const ctx = { sum, allBombsSet, cellValues: cellVals, blockedSwitches };
                            
                            if (cond0) condStatus[0] = checkCondition(cond0, ctx);
                            if (cond1) condStatus[1] = checkCondition(cond1, ctx);
                            if (cond2) condStatus[2] = checkCondition(cond2, ctx);
                        }
                        
                        // Record condition stats
                        stats.recordConditions(condStatus);
                        
                        // Store solution if it qualifies
                        const isPerfect = condStatus[0] && condStatus[1] && condStatus[2];
                        const solution = solutionTracker.createSolution(
                            normC, powC, negC, sum, condStatus, blockedSwitches
                        );
                        solutionTracker.addSolution(solution, isPerfect);
                    }
                }
            }
        }
    }
    
    // Send final results
    const statsExport = stats.export();
    self.postMessage({
        type: 'done',
        solutions: solutionTracker.getSolutions(),
        stats: heatmap.export(),
        targetStats: statsExport.targetStats,
        conditionStats: statsExport.conditionStats,
        validSolutionsCountBig: statsExport.validSolutionsCountBig,
        lastTotalCombinations: estimatedCombos.toString()
    });
}