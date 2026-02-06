/**
 * =================================================================
 * PREVIEW.JS - Level Preview Handler
 * Updates the game board UI with generated level data
 * =================================================================
 */

export class Preview {
    /**
     * Update grid UI with level configuration
     * @param {Object} config - Level configuration
     */
    static previewLevel(config) {
        if (typeof setUIFromLevelData !== 'function') {
            console.warn('setUIFromLevelData function not found');
            return;
        }

        const levelData = {
            gridColumns: config.cols,
            gridRows: config.rows,
            bombsCount: config.bombs1,
            bombsPlusCount: config.bombs2,
            bombsNegCount: config.bombsNeg,
            targetMin: config.tmin,
            targetMax: config.tmax,
            initialCells: [
                ...config.blocks.map(id => ({ id, state: 'BLOCK' })),
                ...config.switches.map(id => ({ id, state: 'SWITCH_ON' })),
                ...config.mustBombs.map(id => ({ id, state: 'BOMB' }))
            ],
            starConditions: config.starConditions
        };

        setUIFromLevelData(levelData);
    }
}