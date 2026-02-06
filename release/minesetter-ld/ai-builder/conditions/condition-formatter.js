/**
 * =================================================================
 * CONDITION-FORMATTER.JS - Star Condition Formatter
 * Formats star conditions for display
 * =================================================================
 */

export class ConditionFormatter {
    /**
     * Format star condition to readable text
     * @param {Object} cond - Condition object
     * @returns {string} Formatted condition text
     */
    static format(cond) {
        if (!cond) return 'Invalid Condition';

        switch (cond.type) {
            case 'getScore':
                return `Exact Score = ${cond.value}`;

            case 'placeBombAt':
                return `Bomb at Cell(s) = [${cond.cells.join(', ')}]`;

            case 'anyCellValue':
                return `Any Cell Value = ${cond.value}`;

            case 'cellValues':
                return `Specific Cell Value: ID ${cond.requirements[0].id} = ${cond.requirements[0].value}`;

            case 'emptyCellsCount':
                return `Empty Cells Count = ${cond.value}`;

            case 'setSwitches':
                return `Switch State: ID ${cond.requirements[0].id} is ${cond.requirements[0].state}`;

            default:
                return cond.type;
        }
    }
}