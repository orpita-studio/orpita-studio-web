/**
 * ============================================================================
 * SOLUTION TRACKER
 * Manages and stores valid solutions
 * ============================================================================
 */

/**
 * Solution storage and management
 */
export class SolutionTracker {
    constructor(maxSolutions) {
        this.solutions = [];
        this.maxSolutions = maxSolutions;
    }
    
    /**
     * Add a solution if it meets criteria
     * Perfect solutions (all 3 conditions) are always added
     * 
     * @param {Object} solution - Solution data
     * @param {boolean} isPerfect - Has all 3 conditions
     * @returns {boolean} True if solution was added
     */
    addSolution(solution, isPerfect = false) {
        if (this.solutions.length < this.maxSolutions || isPerfect) {
            this.solutions.push(solution);
            return true;
        }
        return false;
    }
    
    /**
     * Create solution object from bomb arrays
     */
    createSolution(normC, powC, negC, sum, condStatus, blockedSwitches) {
        return {
            normalBombs: normC.slice(),
            powerBombs: powC.slice(),
            negativeBombs: negC.slice(),
            sum,
            conditionStatus: condStatus.slice(),
            switchState: Array.from(blockedSwitches)
        };
    }
    
    /**
     * Get all stored solutions
     */
    getSolutions() {
        return this.solutions;
    }
    
    /**
     * Get solution count
     */
    getCount() {
        return this.solutions.length;
    }
    
    /**
     * Clear all solutions
     */
    reset() {
        this.solutions = [];
    }
}