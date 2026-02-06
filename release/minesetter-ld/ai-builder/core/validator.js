/**
 * =================================================================
 * VALIDATOR.JS - Configuration Validator
 * Validates user settings before generation
 * =================================================================
 */

import { Helpers } from '../utils/helpers.js';

export class Validator {
    /**
     * Validate configuration constraints
     * @param {Function} logFn - Logging function
     * @returns {Object} Validation result {valid: boolean, message?: string}
     */
    static validateConstraints(logFn) {
        logFn("Checking Constraints...", "muted");

        const maxCols = Helpers.getVal('aiGridXMax');
        const maxRows = Helpers.getVal('aiGridYMax');
        const maxArea = maxCols * maxRows;

        let totalMinRequired = 0;

        if (Helpers.getChecked('aiAllowBombs1'))
            totalMinRequired += Helpers.getVal('aiBombs1Min');
        if (Helpers.getChecked('aiAllowBombs2'))
            totalMinRequired += Helpers.getVal('aiBombs2Min');
        if (Helpers.getChecked('aiAllowBombsNeg'))
            totalMinRequired += Helpers.getVal('aiBombsNegMin');
        if (Helpers.getChecked('aiAllowBlocks'))
            totalMinRequired += Helpers.getVal('aiBlocksMin');
        if (Helpers.getChecked('aiAllowSwitches'))
            totalMinRequired += Helpers.getVal('aiSwitchesMin');
        if (Helpers.getChecked('aiAllowMustBombs'))
            totalMinRequired += Helpers.getVal('aiMustBombsMin');

        if (totalMinRequired > maxArea) {
            return {
                valid: false,
                message: `Config Error: Min Elements (${totalMinRequired}) > Grid Area (${maxArea}).`
            };
        }

        return { valid: true };
    }
}