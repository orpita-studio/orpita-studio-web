/**
 * =================================================================
 * AI-BUILDER.JS - Main Controller
 * Orchestrates all modules for AI level generation
 * =================================================================
 */

import { Logger } from './ui/logger.js';
import { Preview } from './ui/preview.js';
import { Progress } from './ui/progress.js';
import { Validator } from './core/validator.js';
import { ConfigGenerator } from './core/config-generator.js';
import { SmartSelector } from './core/smart-selector.js';
import { StarConditions } from './conditions/star-conditions.js';
import { ConditionFormatter } from './conditions/condition-formatter.js';
import { WorkerManager } from './worker/worker-manager.js';
import { Helpers } from './utils/helpers.js';

// Initialize global logger for use across both Manual and AI modes
window.logger = new Logger();

const AiBuilder = {
    // State
    isRunning: false,
    
    // Managers
    logger: window.logger,
    progress: null,
    workerManager: null,
    
    /**
     * Initialize AI Builder
     */
    init() {
      // Use the global logger
      this.logger = window.logger;
      this.progress = new Progress();
      this.workerManager = new WorkerManager(
        (msg, type) => this.logger.log(msg, type),
        this.progress
      );
    },
/**
 * Main generation loop
 */
async startGeneration() {
    // Initialize if not done (check progress as logger is now global)
    if (!this.progress) this.init();

        // Open console drawer
        const drawer = document.getElementById('aiConsole');
        const toggleBtn = document.getElementById('toggleConsole');
        if (drawer && !drawer.classList.contains('open')) {
            drawer.classList.add('open');
            if (toggleBtn) toggleBtn.classList.add('active');
        }

    // Validate
    const validation = Validator.validateConstraints(
        (msg, type) => this.logger.log(msg, type)
    );

    if (!validation.valid) {
        this.logger.log(validation.message, "error");
        this.progress.setStatus(
            `<span style="color:red">${validation.message}</span>`,
            'status-message status-error'
        );
        return;
    }

    // Read parameters
    const minWinPct = parseFloat(document.getElementById('aiSolMin')?.value) || 0;
    const maxWinPct = parseFloat(document.getElementById('aiSolMax')?.value) || 100;
    const stopAfter = Helpers.getVal('aiStopAfter') || 1;

    let foundPuzzles = 0;
    this.isRunning = true;
    let attempts = 0;
    const globalStartTime = performance.now();

    this.logger.log(`>>> ENGINE STARTED. Target Win Rate: ${minWinPct}% - ${maxWinPct}% <<<`, "info");

    // Main loop
    while (this.isRunning) {
        attempts++;

        // Generate config
        const config = ConfigGenerator.generate(
            (msg, type) => this.logger.log(msg, type)
        );

        this.logger.log(`Attempt #${attempts}`, "default", config);

        // Log details
        this._logConfigDetails(config);

        // Preview
        Preview.previewLevel(config);

        await new Promise(r => setTimeout(r, 0));

        this.progress.setStatus(`<i class="fas fa-sync fa-spin"></i> Attempt #${attempts}...`);
        this.progress.setProgress(0);

        try {
            const attemptStartTime = performance.now();

            // PHASE 1: Initial analysis
            let analysisResult = await this.workerManager.runSolver(config);
            const totalCombos = analysisResult.lastTotalCombinations 
                ? BigInt(analysisResult.lastTotalCombinations) 
                : 1n;

            let finalConfig = config;

            // PHASE 2: Smart target selection
            if (totalCombos > 0n && analysisResult.targetStats) {
                this.progress.setStatus(`<i class="fas fa-cogs"></i> Attempt #${attempts} (Phase 2)...`);

                const selection = SmartSelector.selectTarget(
                    analysisResult.targetStats,
                    totalCombos,
                    minWinPct,
                    maxWinPct,
                    (msg, type) => this.logger.log(msg, type)
                );

                if (selection.success) {
                    finalConfig = {
                        ...config,
                        tmin: selection.tmin,
                        tmax: selection.tmax
                    };

                    finalConfig.starConditions = StarConditions.generate(
                        finalConfig,
                        (msg, type) => this.logger.log(msg, type),
                        analysisResult
                    );

                    this.logger.log(`> Final Target: ${finalConfig.tmin} to ${finalConfig.tmax}`, 'success');
                    Preview.previewLevel(finalConfig);
                } else {
                    this.logger.log(`❌ Attempt Failed: No suitable target found.`, "result-update status-error");
                    continue;
                }
            } else {
                this.logger.log(`❌ Attempt Failed: No solutions found in Phase 1.`, "result-update status-error");
                continue;
            }

            // PHASE 3: Verification
            this.logger.log(`> Phase 3: Verifying final config...`, 'info');
            this.progress.setStatus(`<i class="fas fa-check-double"></i> Verifying Attempt #${attempts}...`);

            analysisResult = await this.workerManager.runSolver(finalConfig);

            // Calculate win chance
            const validSols = BigInt(analysisResult.validSolutionsCountBig || analysisResult.solutions?.length || 0);
            let winChance = 0;

            if (totalCombos > 0n) {
                const percentageScaled = (validSols * 10000n) / totalCombos;
                winChance = Number(percentageScaled) / 100;
            }

            this.logger.log(`> Solver Result: ${validSols} valid solutions / ${totalCombos} total combos`, 'muted');
            this.logger.log(`> winChance: ${winChance.toFixed(4)}%`, 'muted');

            // Update GameState
            this._updateGameState(analysisResult, validSols, winChance, attemptStartTime);

            // Check criteria
            const hasSolutions = validSols > 0n;
            const isWithinRange = winChance >= minWinPct && winChance <= maxWinPct;

            // Update header
            if (hasSolutions) {
                const statusClass = isWithinRange ? "status-success" : "status-warning";
                const icon = isWithinRange ? "✅" : "⚠️";
                this.logger.log(`${icon} Win Rate: ${winChance.toFixed(4)}% (Sols: ${validSols})`, `result-update ${statusClass}`);

                if (!isWithinRange) {
                    this.logger.log(`> Rate mismatch. Required: ${minWinPct}-${maxWinPct}%`, "muted");
                }
            } else {
                this.logger.log(`❌ No Solutions`, "result-update status-error");
            }

            // Success handling
            if (hasSolutions && isWithinRange) {
                this.logger.log(`✅ MATCH FOUND! Puzzle generation successful.`, "success");
                foundPuzzles++;

                if (foundPuzzles >= stopAfter) {
                    this.isRunning = false;
                    const totalTime = ((performance.now() - globalStartTime) / 1000).toFixed(1);

                    this.progress.setStatus(`<i class="fas fa-check-circle"></i> Done! Found ${foundPuzzles} puzzle(s) in ${totalTime}s.`);
                    this.progress.setProgress(100);

                    if (typeof showStatus === 'function') {
                        showStatus(`AI Generation Complete! Win Chance: ${winChance.toFixed(3)}%`, false);
                    }
                    break;
                }
            }

        } catch (err) {
            this.logger.log(`❌ Error: ${err.message}`, "error");
            console.error(err);
        }

        await new Promise(r => setTimeout(r, 0));
    }
},

/**
 * Stop generation
 */
stopGeneration() {
    this.isRunning = false;
    this.workerManager.terminate();
    this.logger.log('⏹️ Generation stopped by user', 'warning');
},

/**
 * Log configuration details
 * @private
 */
_logConfigDetails(config) {
    this.logger.log(`> Grid: ${config.cols}x${config.rows} Total = ${config.cols * config.rows}`, 'muted');
    this.logger.log(`> Bombs: Normal: ${config.bombs1}, Powered: ${config.bombs2}, Negative: ${config.bombsNeg}`, 'muted');
    this.logger.log(`> Elements: Blocks: ${config.blocks.length} [${config.blocks.join(', ')}], Switches: ${config.switches.length} [${config.switches.join(', ')}], MustBombs: ${config.mustBombs.length} [${config.mustBombs.join(', ')}]`, 'muted');
    this.logger.log(`> Target Score Range: ${config.tmin} to ${config.tmax}`, 'muted');

    if (config.starConditions.length > 0) {
        this.logger.log(`> Stars condition`, 'muted');
        config.starConditions.forEach((condArr, i) => {
            if (condArr[0]) {
                this.logger.log(`>> Star ${i + 1}: ${ConditionFormatter.format(condArr[0])}`, 'muted');
            }
        });
    } else {
        this.logger.log(`> Star Conditions: Not allowed by user`, 'muted');
    }
},

/**
 * Update global GameState
 * @private
 */
_updateGameState(analysisResult, validSols, winChance, startTime) {
    if (typeof GameState !== 'undefined' && typeof handlePostSolveAnalysis === 'function') {
        GameState.results.solutions = analysisResult.solutions || [];
        GameState.results.workerStats = analysisResult.stats;
        GameState.results.targetStats = analysisResult.targetStats;
        GameState.results.conditionStats = analysisResult.conditionStats;
        GameState.results.lastTotalCombinations = analysisResult.lastTotalCombinations 
            ? BigInt(analysisResult.lastTotalCombinations) 
            : 0n;
        GameState.results.validSolutionsCount = validSols;
        GameState.results.chanceWinPercentage = winChance;
        GameState.results.showHeatmap = true;
        GameState.results.abortFlag = false;

        handlePostSolveAnalysis(startTime);
    }
}
};

// Export for global access
window.AiBuilder = AiBuilder;
export default AiBuilder;