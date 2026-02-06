/**
 * ============================================================================
 * STATISTICS ANALYZER
 * Tracks score distribution and condition combinations
 * ============================================================================
 */

/**
 * Statistics tracker for solver analysis
 */
export class StatsAnalyzer {
    constructor() {
        this.targetStats = {};
        this.condStats = {
            'C1_Only': 0,
            'C2_Only': 0,
            'C3_Only': 0,
            'C1_C2': 0,
            'C1_C3': 0,
            'C2_C3': 0,
            'C1_C2_C3': 0,
            'None': 0
        };
        this.validSolutionsCount = 0n;
    }
    
    /**
     * Record a valid solution's score
     */
    recordScore(score) {
        this.targetStats[score] = (this.targetStats[score] || 0) + 1;
        this.validSolutionsCount++;
    }
    
    /**
     * Record condition combination
     * @param {Array<boolean>} condStatus - [c1, c2, c3] status
     */
    recordConditions(condStatus) {
        const [c1, c2, c3] = condStatus;
        const active = c1 + c2 + c3;
        
        if (active === 0) {
            this.condStats['None']++;
        } else if (c1 && c2 && c3) {
            this.condStats['C1_C2_C3']++;
        } else if (c1 && c2) {
            this.condStats['C1_C2']++;
        } else if (c1 && c3) {
            this.condStats['C1_C3']++;
        } else if (c2 && c3) {
            this.condStats['C2_C3']++;
        } else if (c1) {
            this.condStats['C1_Only']++;
        } else if (c2) {
            this.condStats['C2_Only']++;
        } else if (c3) {
            this.condStats['C3_Only']++;
        }
    }
    
    /**
     * Get all statistics for export
     */
    export() {
        return {
            targetStats: this.targetStats,
            conditionStats: this.condStats,
            validSolutionsCountBig: this.validSolutionsCount.toString()
        };
    }
    
    /**
     * Reset all statistics
     */
    reset() {
        this.targetStats = {};
        Object.keys(this.condStats).forEach(k => this.condStats[k] = 0);
        this.validSolutionsCount = 0n;
    }
}