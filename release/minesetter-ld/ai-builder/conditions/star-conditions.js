/**
 * =================================================================
 * STAR-CONDITIONS.JS - Star Condition Generator
 * Generates random star conditions based on config
 * =================================================================
 */

import { Helpers } from '../utils/helpers.js';

export class StarConditions {
    /**
     * Generate star conditions for a level
     * @param {Object} config - Level configuration
     * @param {Function} logFn - Logging function
     * @param {Object} analysisResult - Full analysis data from worker
     * @returns {Array} Array of star conditions
     */
    static generate(config, logFn, analysisResult = null) {
        const availableTypes = [];

        // ✅ فلترة مبدئية: تحقق من الشروط الأساسية
        if (Helpers.getChecked('allowCondScore') && config.tmin != config.tmax) {
            availableTypes.push('getScore');
        }
        
        if (Helpers.getChecked('allowCondBombAt')) {
            availableTypes.push('placeBombAt');
        }
        
        // ✅ فلترة للشروط المعتمدة على الخلايا الفارغة
        const hasEmptyCells = this._checkEmptyCellsExist(analysisResult);
        
        if (Helpers.getChecked('allowCondAnyVal') && hasEmptyCells) {
            availableTypes.push('anyCellValue');
        } else if (Helpers.getChecked('allowCondAnyVal') && !hasEmptyCells) {
            logFn("anyCellValue disabled: No empty cells found in solutions.", "warning");
        }
        
        if (Helpers.getChecked('allowCondCellVals')) {
            availableTypes.push('cellValues');
        }
        
        if (Helpers.getChecked('allowCondEmpty') && hasEmptyCells) {
            availableTypes.push('emptyCellsCount');
        } else if (Helpers.getChecked('allowCondEmpty') && !hasEmptyCells) {
            logFn("emptyCellsCount disabled: No empty cells found in solutions.", "warning");
        }
        
        if (Helpers.getChecked('allowCondSwitches') && config.switches?.length > 0) {
            availableTypes.push('setSwitches');
        }

        if (availableTypes.length === 0) {
            logFn("No valid condition types available.", "warning");
            return [];
        }

        // ✅ نظام Retry: نحاول نطلع 3 شروط صالحة
        const conditions = [];
        const failedTypes = new Set(); // تتبع الأنواع الفاشلة
        const maxAttempts = availableTypes.length * 3; // حد أقصى للمحاولات
        let attempts = 0;

        while (conditions.length < 3 && attempts < maxAttempts) {
            attempts++;

            // فلترة الأنواع المتاحة (استبعاد الفاشلة)
            const remainingTypes = availableTypes.filter(t => !failedTypes.has(t));
            
            if (remainingTypes.length === 0) {
                logFn(`Stopped: All condition types have failed. Generated ${conditions.length} conditions.`, "warning");
                break;
            }

            // اختيار نوع عشوائي من المتبقي
            const randomType = remainingTypes[Helpers.getRandom(0, remainingTypes.length - 1)];

            // محاولة توليد الشرط
            const cond = this._generateCondition(randomType, config, logFn, analysisResult);

            if (cond) {
                conditions.push([cond]);
                logFn(`✓ Condition added: ${randomType} (${conditions.length}/3)`, "success");
            } else {
                // فشل هذا النوع → نضيفه للقائمة السوداء
                failedTypes.add(randomType);
                logFn(`✗ ${randomType} failed and removed from pool. Remaining types: ${remainingTypes.length - 1}`, "warning");
            }
        }

        if (conditions.length < 3) {
            logFn(`Warning: Only ${conditions.length} valid conditions generated (target: 3).`, "warning");
        }

        return conditions;
    }

    /**
     * ✅ فحص وجود خلايا فارغة في الحلول
     * @private
     */
    static _checkEmptyCellsExist(analysisResult) {
        if (!analysisResult || !analysisResult.emptyCellsStats) return false;
        
        const { emptyCellsStats } = analysisResult;
        
        // نتحقق: هل فيه أي حل عنده خلايا فارغة؟
        for (const [countStr, freq] of Object.entries(emptyCellsStats)) {
            const count = parseInt(countStr);
            if (count > 0 && freq > 0) {
                return true; // فيه حلول بخلايا فارغة
            }
        }
        
        return false; // كل الحلول ممتلئة
    }

    /**
     * Generate individual condition
     * @private
     */
    static _generateCondition(type, config, logFn, analysisResult) {
        try {
            switch (type) {
                case 'getScore':
                    return this._generateScoreCondition(config, logFn, analysisResult);

                case 'placeBombAt':
                    return this._generateBombAtCondition(config, logFn, analysisResult);

                case 'anyCellValue':
                    return this._generateAnyValueCondition(config, logFn, analysisResult);

                case 'cellValues':
                    return this._generateCellValuesCondition(config, logFn, analysisResult);

                case 'emptyCellsCount':
                    return this._generateEmptyCondition(config, logFn, analysisResult);

                case 'setSwitches':
                    return this._generateSwitchCondition(config, logFn, analysisResult);

                default:
                    return null;
            }
        } catch (e) {
            logFn(`Error generating condition ${type}: ${e.message}`, "error");
            return null;
        }
    }

    // Individual condition generators
    static _generateScoreCondition(config, logFn, analysisResult) {
        if (!analysisResult) return null;
        const { targetStats, stats } = analysisResult;
        const totalFound = stats?.totalFound || 0;

        if (config.tmin === config.tmax) {
            return null;
        }

        if (targetStats && totalFound > 0) {
            const suitableScores = [];
            
            for (let score = config.tmin; score <= config.tmax; score++) {
                const count = targetStats[score] || 0;
                const percentage = (count / totalFound) * 100;
                
                if (count > 0 && percentage < 50) {
                    suitableScores.push(score);
                }
            }

            if (suitableScores.length > 0) {
                const target = suitableScores[Helpers.getRandom(0, suitableScores.length - 1)];
                logFn(`  → getScore selected: ${target}`, "info");
                return { type: 'getScore', value: target };
            }
        }

        return null;
    }

    static _generateBombAtCondition(config, logFn, analysisResult) {
        if (!analysisResult || !analysisResult.stats) return null;
        const { stats } = analysisResult;
        const totalFound = stats.totalFound;

        const validCells = this._getValidCells(config);
        const suitableCells = [];

        validCells.forEach(cellId => {
            const count = (stats.normal[cellId] || 0) + (stats.power[cellId] || 0) + (stats.negative[cellId] || 0);
            const percentage = (count / totalFound) * 100;

            if (count > 0 && percentage < 50) {
                suitableCells.push(cellId);
            }
        });

        if (suitableCells.length > 0) {
            const cellId = suitableCells[Helpers.getRandom(0, suitableCells.length - 1)];
            logFn(`  → placeBombAt selected: cell ${cellId}`, "info");
            return { type: 'placeBombAt', cells: [cellId] };
        }

        return null;
    }

    static _generateAnyValueCondition(config, logFn, analysisResult) {
        if (!analysisResult || !analysisResult.numberFrequency) return null;
        const { numberFrequency, stats } = analysisResult;
        const totalFound = stats?.totalFound || 0;

        const suitableValues = [];
        for (const [valStr, count] of Object.entries(numberFrequency)) {
            const val = parseInt(valStr);
            const percentage = (count / totalFound) * 100;

            if (count > 0 && percentage < 50) {
                suitableValues.push(val);
            }
        }

        if (suitableValues.length > 0) {
            const value = suitableValues[Helpers.getRandom(0, suitableValues.length - 1)];
            logFn(`  → anyCellValue selected: ${value}`, "info");
            return { type: 'anyCellValue', value };
        }

        return null;
    }

    static _generateCellValuesCondition(config, logFn, analysisResult) {
        if (!analysisResult || !analysisResult.cellValuesAnalysis) return null;
        const { cellValuesAnalysis, stats } = analysisResult;
        const totalFound = stats?.totalFound || 0;

        const suitablePairs = [];
        cellValuesAnalysis.forEach((valMap, cellId) => {
            for (const [valStr, count] of Object.entries(valMap)) {
                const val = parseInt(valStr);
                const percentage = (count / totalFound) * 100;

                if (count > 0 && percentage < 50) {
                    suitablePairs.push({ id: cellId, value: val });
                }
            }
        });

        if (suitablePairs.length > 0) {
            const pair = suitablePairs[Helpers.getRandom(0, suitablePairs.length - 1)];
            logFn(`  → cellValues selected: cell ${pair.id} = ${pair.value}`, "info");
            return { type: 'cellValues', requirements: [pair] };
        }

        return null;
    }

    static _generateEmptyCondition(config, logFn, analysisResult) {
        if (!analysisResult || !analysisResult.emptyCellsStats) return null;
        const { emptyCellsStats, stats } = analysisResult;
        const totalFound = stats?.totalFound || 0;

        const suitableCounts = [];
        for (const [countStr, freq] of Object.entries(emptyCellsStats)) {
            const count = parseInt(countStr);
            const percentage = (freq / totalFound) * 100;

            if (freq > 0 && percentage < 50) {
                suitableCounts.push(count);
            }
        }

        if (suitableCounts.length > 0) {
            const reqCount = suitableCounts[Helpers.getRandom(0, suitableCounts.length - 1)];
            logFn(`  → emptyCellsCount selected: ${reqCount}`, "info");
            return { type: 'emptyCellsCount', value: reqCount };
        }

        return null;
    }

    static _generateSwitchCondition(config, logFn, analysisResult) {
        if (!config.switches || config.switches.length === 0) return null;
        if (!analysisResult || !analysisResult.switchAnalysis) return null;
        
        const { switchAnalysis, stats } = analysisResult;
        const totalFound = stats?.totalFound || 0;

        const suitableStates = [];
        for (const [swIdStr, counts] of Object.entries(switchAnalysis)) {
            const swId = parseInt(swIdStr);
            
            const onPct = (counts.on / totalFound) * 100;
            if (counts.on > 0 && onPct < 50) {
                suitableStates.push({ id: swId, state: 'SWITCH_ON' });
            }

            const offPct = (counts.off / totalFound) * 100;
            if (counts.off > 0 && offPct < 50) {
                suitableStates.push({ id: swId, state: 'SWITCH_OFF' });
            }
        }

        if (suitableStates.length > 0) {
            const choice = suitableStates[Helpers.getRandom(0, suitableStates.length - 1)];
            logFn(`  → setSwitches selected: switch ${choice.id} = ${choice.state}`, "info");
            return { type: 'setSwitches', requirements: [choice] };
        }

        return null;
    }

    // Helper methods
    static _getValidCells(config) {
        const all = Array.from({ length: config.rows * config.cols }, (_, i) => i);
        const invalid = new Set([...config.blocks, ...config.mustBombs]);
        return all.filter(id => !invalid.has(id));
    }

    static _getPositionType(id, config) {
        const r = Math.floor(id / config.cols);
        const c = id % config.cols;
        const isRowEdge = (r === 0 || r === config.rows - 1);
        const isColEdge = (c === 0 || c === config.cols - 1);

        if (isRowEdge && isColEdge) return 'corner';
        if (isRowEdge || isColEdge) return 'edge';
        return 'center';
    }
}