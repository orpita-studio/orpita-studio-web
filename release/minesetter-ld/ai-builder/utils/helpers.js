/**
 * =================================================================
 * HELPERS.JS - Utility Functions
 * Basic helper functions used across the AI Builder
 * =================================================================
 */

export const Helpers = {
    /**
     * Get numeric value from input element
     * @param {string} id - Element ID
     * @returns {number} Parsed integer value or 0
     */
    getVal(id) {
        const el = document.getElementById(id);
        return el ? parseInt(el.value) || 0 : 0;
    },

    /**
     * Check if checkbox is checked
     * @param {string} id - Element ID
     * @returns {boolean} Checked state
     */
    getChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    },

    /**
     * Generate random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Fisher-Yates shuffle algorithm
     * @param {Array} array - Array to shuffle (modified in place)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};