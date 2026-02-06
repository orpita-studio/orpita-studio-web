/**
 * ============================================================================
 * HEATMAP ANALYZER
 * Tracks frequency of bomb placements across solutions
 * ============================================================================
 */

/**
 * Heatmap tracker for analyzing bomb placement patterns
 */
export class HeatmapAnalyzer {
    constructor(totalCells) {
        this.normal = new Uint32Array(totalCells);
        this.power = new Uint32Array(totalCells);
        this.negative = new Uint32Array(totalCells);
        this.totalFound = 0;
    }
    
    /**
     * Record a solution in the heatmap
     */
    recordSolution(normalBombs, powerBombs, negativeBombs) {
        this.totalFound++;
        
        for (let x of normalBombs) {
            this.normal[x]++;
        }
        
        for (let x of powerBombs) {
            this.power[x]++;
        }
        
        for (let x of negativeBombs) {
            this.negative[x]++;
        }
    }
    
    /**
     * Check if max solutions limit reached
     */
    hasReachedLimit(maxSolutions) {
        return this.totalFound >= maxSolutions;
    }
    
    /**
     * Get heatmap data for export
     */
    export() {
        return {
            normal: this.normal,
            power: this.power,
            negative: this.negative,
            totalFound: this.totalFound
        };
    }
    
    /**
     * Reset all counters
     */
    reset() {
        this.normal.fill(0);
        this.power.fill(0);
        this.negative.fill(0);
        this.totalFound = 0;
    }
}