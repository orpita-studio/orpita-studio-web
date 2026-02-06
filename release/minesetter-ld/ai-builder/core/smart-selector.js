/**
 * =================================================================
 * SMART-SELECTOR.JS - Smart Target Range Selector
 * Analyzes target stats to find optimal score range
 * =================================================================
 */

export class SmartSelector {
    /**
     * Select optimal target range based on win rate
     * @param {Object} targetStats - Score distribution statistics
     * @param {BigInt} totalCombinations - Total combinations analyzed
     * @param {number} minWinPct - Minimum win percentage
     * @param {number} maxWinPct - Maximum win percentage
     * @param {Function} logFn - Logging function
     * @returns {Object} Selection result {success: boolean, tmin?: number, tmax?: number}
     */
    static selectTarget(targetStats, totalCombinations, minWinPct, maxWinPct, logFn) {
        logFn(`> Phase 2: Double-Loop Range Analysis...`, 'info');

        if (!totalCombinations || totalCombinations === 0n) {
            return { success: false };
        }

        // Convert to sorted array
        const sortedData = Object.entries(targetStats)
            .map(([score, count]) => ({
                score: parseInt(score),
                count: BigInt(count)
            }))
            .sort((a, b) => a.score - b.score);

        const validRanges = [];

        // Double loop to find all valid ranges
        for (let i = 0; i < sortedData.length; i++) {
            let currentRangeSolutions = 0n;

            for (let j = i; j < sortedData.length; j++) {
                currentRangeSolutions += sortedData[j].count;

                const rangeWinRate = Number((currentRangeSolutions * 10000n) / totalCombinations) / 100;

                if (rangeWinRate >= minWinPct && rangeWinRate <= maxWinPct) {
                    validRanges.push({
                        tmin: sortedData[i].score,
                        tmax: sortedData[j].score,
                        winRate: rangeWinRate
                    });
                }

                if (rangeWinRate > maxWinPct) break;
            }
        }

        logFn(`> Found ${validRanges.length} valid range combinations.`, 'muted');

        if (validRanges.length === 0) {
            logFn(`> No valid ranges found for the requested win rate.`, 'warning');
            return { success: false };
        }

        // Select middle range for balance
        const midIndex = Math.floor(validRanges.length / 2);
        const finalChoice = validRanges[midIndex];

        logFn(`> Smart Selection Successful: Range [${finalChoice.tmin} to ${finalChoice.tmax}] (${finalChoice.winRate.toFixed(2)}%)`, 'success');

        return {
            success: true,
            tmin: finalChoice.tmin,
            tmax: finalChoice.tmax
        };
    }
}