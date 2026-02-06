/**
 * ============================================================================
 * CONDITION CHECKER
 * Validates star conditions for solutions
 * ============================================================================
 */

/**
 * Check if a condition is satisfied
 * 
 * @param {Object} cond - Condition object with type and parameters
 * @param {Object} ctx - Context object with sum, allBombsSet, cellValues, blockedSwitches
 * @returns {boolean} True if condition is met
 */
export function checkCondition(cond, ctx) {
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