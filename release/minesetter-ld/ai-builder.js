/**
 * ai-builder.js
 * AI Level Generator (Win Chance Logic & UI Integration)
 * ------------------------------------------------------
 * Core Logic for creating, solving, and validating Minesetter levels.
 */

const AiBuilder = {
    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    activeWorker: null,
    isRunning: false,
    currentAttemptDetails: null, // مرجع لعنصر DOM الخاص بتفاصيل المحاولة الحالية
    currentAttemptHeader: null,  // مرجع لعنوان المحاولة لتحديث النسبة فيه


    // =========================================================================
    // [SECTION 1] UI & VISUALIZATION
    // Updates the game board preview before solving starts
    // =========================================================================
    
    previewLevel(config) {
        if (typeof setUIFromLevelData !== 'function') return;

        /* Prepare Data Structure for UI Renderer */
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

        /* Update Grid UI */
        setUIFromLevelData(levelData);
    },


    // =========================================================================
    // [SECTION 2] CONSOLE LOGGING SYSTEM
    // Handles complex HTML logging, foldable groups, and copy-to-clipboard features
    // =========================================================================

    log(message, type = 'default', config = null) {
        const output = document.getElementById('consoleOutput');
        if (!output) return;

        /* -----------------------------------------------------------
           Case A: New Attempt Start (Create Foldable Group)
           ----------------------------------------------------------- */
        if (message.toLowerCase().includes("attempt #") && config) {
            const group = document.createElement('div');
            group.className = 'attempt-group';
            group.id = `attempt-group-${Date.now()}`;

            // Create Header
            const header = document.createElement('div');
            header.className = 'attempt-header';
            
            // Toggle Icon
            const toggle = document.createElement('span');
            toggle.className = 'toggle-icon';
            toggle.innerHTML = '▶';
            toggle.onclick = () => group.classList.toggle('is-open');

            // Title
            const titleSpan = document.createElement('span');
            titleSpan.textContent = message;

            // Copy JSON Button Logic
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> JSON';
            copyBtn.className = 'btn-xs btn-copy-json';
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Construct Clean JSON Object
                const levelData = {
                    gridColumns: config.cols, gridRows: config.rows,
                    nrmBombCount: config.bombs1, plsBombCount: config.bombs2, ngtBombCount: config.bombsNeg,
                    targetMin: config.tmin, targetMax: config.tmax,
                    initialCells: [
                        ...config.blocks.map(id => ({ id, state: 'BLOCK' })),
                        ...config.switches.map(id => ({ id, state: 'SWITCH' })),
                        ...config.mustBombs.map(id => ({ id, state: 'BOMB' }))
                    ],
                    starConditions: (config.starConditions || []).flat().reduce((acc, cond) => {
                        if (cond) acc[cond.type] = cond.value || cond.cells || cond.requirements;
                        return acc;
                    }, {})
                };
                // Copy Action
                navigator.clipboard.writeText(JSON.stringify(levelData, null, 2))
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> JSON'; }, 1500);
                    })
                    .catch(err => console.error('Copy failed', err));
            });

            // Status Spinner
            const statusSpan = document.createElement('span');
            statusSpan.className = 'status-indicator';
            statusSpan.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing...`;

            // Append Elements
            header.appendChild(toggle);
            header.appendChild(titleSpan);
            header.appendChild(copyBtn);
            header.appendChild(statusSpan);

            const details = document.createElement('div');
            details.className = 'attempt-details';

            group.appendChild(header);
            group.appendChild(details);
            output.appendChild(group);

            // Save References for later updates
            this.currentAttemptDetails = details;
            this.currentAttemptHeader = header;
        } 
        /* -----------------------------------------------------------
           Case B: Update Result Header (Win Rate Display)
           ----------------------------------------------------------- */
        else if (type.includes('result-update') && this.currentAttemptHeader) {
            const statusSpan = this.currentAttemptHeader.querySelector('.status-indicator');
            if (statusSpan) {
                statusSpan.innerHTML = message;
                statusSpan.className = `status-indicator ${type.replace('result-update', '').trim()}`;
            }
        } 
        /* -----------------------------------------------------------
           Case C: Standard Log Line
           ----------------------------------------------------------- */
        else {
            const line = document.createElement('div');
            line.className = `log-line ${type}`;
            line.innerHTML = `> ${message}`;

            if (this.currentAttemptDetails) {
                this.currentAttemptDetails.appendChild(line);
            } else {
                output.appendChild(line);
            }
        }
        
        // Highlight border on success
        if (type === 'success' && this.currentAttemptDetails) {
            this.currentAttemptDetails.parentElement.classList.add('success-border', 'is-open');
        }

        output.scrollTop = output.scrollHeight;
    },
    
    // Helper to format Star Conditions into readable text
    formatStarCondition(cond) {
        if (!cond) return 'Invalid Condition';
        switch (cond.type) {
            case 'getScore': return `Exact Score = ${cond.value}`;
            case 'placeBombAt': return `Bomb at Cell(s) = [${cond.cells.join(', ')}]`;
            case 'anyCellValue': return `Any Cell Value = ${cond.value}`;
            case 'cellValues': return `Specific Cell Value: ID ${cond.requirements[0].id} = ${cond.requirements[0].value}`;
            case 'emptyCellsCount': return `Empty Cells Count = ${cond.value}`;
            case 'setSwitches': return `Switch State: ID ${cond.requirements[0].id} is ${cond.requirements[0].state}`;
            default: return cond.type;
        }
    },


    // =========================================================================
    // [SECTION 3] UTILITIES
    // Basic helpers for DOM reading and math
    // =========================================================================

    getVal(id) {
        const el = document.getElementById(id);
        return el ? parseInt(el.value) || 0 : 0;
    },

    getChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    },

    getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },


    // =========================================================================
    // [SECTION 4] VALIDATION LOGIC
    // Checks if user settings are mathematically possible
    // =========================================================================

    validateConstraints() {
        this.log("Checking Constraints...", "muted");
        const maxCols = this.getVal('aiGridXMax');
        const maxRows = this.getVal('aiGridYMax');
        const maxArea = maxCols * maxRows;

        let totalMinRequired = 0;
        if (this.getChecked('aiAllowBombs1')) totalMinRequired += this.getVal('aiBombs1Min');
        if (this.getChecked('aiAllowBombs2')) totalMinRequired += this.getVal('aiBombs2Min');
        if (this.getChecked('aiAllowBombsNeg')) totalMinRequired += this.getVal('aiBombsNegMin');
        if (this.getChecked('aiAllowBlocks')) totalMinRequired += this.getVal('aiBlocksMin');
        if (this.getChecked('aiAllowSwitches')) totalMinRequired += this.getVal('aiSwitchesMin');
        if (this.getChecked('aiAllowMustBombs')) totalMinRequired += this.getVal('aiMustBombsMin');

        if (totalMinRequired >= maxArea) {
            return {
                valid: false,
                message: `Config Error: Min Elements (${totalMinRequired}) >= Grid Area (${maxArea}).`
            };
        }
        return { valid: true };
    },


    // =========================================================================
    // [SECTION 5] CONTENT GENERATION (THE BRAIN)
    // Generates Star Conditions and the Level Configuration Object
    // =========================================================================

    generateStarConditions(config) {
        const availableTypes = [];
        // Check allowed types
        if (this.getChecked('allowCondScore')) availableTypes.push('getScore');
        if (this.getChecked('allowCondBombAt')) availableTypes.push('placeBombAt');
        if (this.getChecked('allowCondAnyVal')) availableTypes.push('anyCellValue');
        if (this.getChecked('allowCondCellVals')) availableTypes.push('cellValues');
        if (this.getChecked('allowCondEmpty')) availableTypes.push('emptyCellsCount');
        if (this.getChecked('allowCondSwitches') && config.switches && config.switches.length > 0) {
            availableTypes.push('setSwitches');}

        if (availableTypes.length === 0) return [];

        this.shuffleArray(availableTypes);
        const selectedTypes = availableTypes.slice(0, 3);
        const conditions = [];

        /* --- Internal Helpers --- */
        const getPosType = (id) => {
            const r = Math.floor(id / config.cols);
            const c = id % config.cols;
            const isRowEdge = (r === 0 || r === config.rows - 1);
            const isColEdge = (c === 0 || c === config.cols - 1);
            if (isRowEdge && isColEdge) return 'corner';
            if (isRowEdge || isColEdge) return 'edge';
            return 'center';
        };

        const getValidCells = () => {
            const all = Array.from({ length: config.rows * config.cols }, (_, i) => i);
            const invalid = new Set([...config.blocks, ...config.mustBombs]);
            return all.filter(id => !invalid.has(id));
        };

        /* --- Condition Logic Switch --- */
        selectedTypes.forEach(type => {
            let cond = null;
            try {
                switch (type) {
                    case 'getScore':
                        const target = this.getRandom(config.tmin, config.tmax);
                        cond = { type: 'getScore', value: target };
                        break;
                    case 'placeBombAt':
                        const validForBomb = getValidCells();
                        if (validForBomb.length > 0) {
                            const cellId = validForBomb[this.getRandom(0, validForBomb.length - 1)];
                            cond = { type: 'placeBombAt', cells: [cellId] };
                        }
                        break;
                    case 'anyCellValue':
                        const limitsAny = { min: -1 * config.bombsNeg, max: 1*config.bombs1 + 2*config.bombs2};
                        const valAny = this.getRandom(limitsAny.min, limitsAny.max);
                        cond = { type: 'anyCellValue', value: valAny };
                        break;
                    case 'cellValues':
                        const validSpecific = getValidCells();
                        if (validSpecific.length > 0) {
                            const cellId = validSpecific[this.getRandom(0, validSpecific.length - 1)];
                            const posType = getPosType(cellId);
                            let localMin = -8, localMax = 16;
                            if (posType === 'edge') { localMin = -5; localMax = 10; }
                            if (posType === 'corner') { localMin = -3; localMax = 6; }
                            const val = this.getRandom(localMin, localMax);
                            cond = { type: 'cellValues', requirements: [{ id: cellId, value: val }] };
                        }
                        break;
                    case 'emptyCellsCount':
                        const totalCells = config.rows * config.cols;
                        const occupied = config.blocks.length + config.mustBombs.length
                        +(config.bombsNeg || 0) +(config.bombs1 || 0) +(config.bombs2 || 0);
                        const freeSpace = totalCells - occupied;
                        if (freeSpace > 1) {
                            const reqCount = this.getRandom(1, freeSpace);
                            cond = { type: 'emptyCellsCount', value: reqCount };
                        }
                        break;
                    case 'setSwitches':
                        const swId = config.switches[this.getRandom(0, config.switches.length - 1)];
                        const state = Math.random() > 0.5 ? 'SWITCH_ON' : 'SWITCH_OFF';
                        cond = { type: 'setSwitches', requirements: [{ id: swId, state: state }] };
                        break;
                }
                if (cond) conditions.push([cond]);
            } catch (e) {
                this.log(`Error generating condition ${type}: ${e.message}`, "error");
            }
        });

        return conditions;
    },

    selectSmartTarget(targetStats, totalCombinations, minWinPct, maxWinPct) {
        this.log(`> Phase 2: Double-Loop Range Analysis...`, 'info');
        
        if (!totalCombinations || totalCombinations === 0n) return { success: false };
        
        // 1. تحويل البيانات لمصفوفة مرتبة عشان نعرف نمشي عليها بالترتيب
        const sortedData = Object.entries(targetStats)
            .map(([score, count]) => ({ score: parseInt(score), count: BigInt(count) }))
            .sort((a, b) => a.score - b.score);
        
        const validRanges = [];
        
        // 2. اللفتين (Double Loop Logic)
        // الحلقة الخارجية بتحدد بداية النطاق (tmin)
        for (let i = 0; i < sortedData.length; i++) {
            
            let currentRangeSolutions = 0n; // مجموع الحلول للنطاق الحالي
            
            // الحلقة الداخلية بتبدأ من نفس مكان الـ i وتبدأ تزود الـ tmax
            for (let j = i; j < sortedData.length; j++) {
                
                // بنضيف عدد حلول السكور الجديد للمجموع التراكمي للنطاق ده
                currentRangeSolutions += sortedData[j].count;
                
                // حساب نسبة الحل العشوائي للنطاق الحالي [i إلى j]
                const rangeWinRate = Number((currentRangeSolutions * 10000n) / totalCombinations) / 100;
                
                // لو النسبة دخلت في النطاق المطلوب، نخزنه كمطمح (Candidate)
                if (rangeWinRate >= minWinPct && rangeWinRate <= maxWinPct) {
                    validRanges.push({
                        tmin: sortedData[i].score,
                        tmax: sortedData[j].score,
                        winRate: rangeWinRate
                    });
                }
                
                // تحسين أداء (Optimization): لو النسبة عدت الـ max المسموح، 
                // مفيش داعي نكمل مط في الحلقة الداخلية دي لأن النسبة هتزيد أكتر
                if (rangeWinRate > maxWinPct) break;
            }
        }
        
        this.log(`> Found ${validRanges.length} valid range combinations.`, 'muted');
        
        if (validRanges.length === 0) {
            this.log(`> No valid ranges found for the requested win rate.`, 'warning');
            return { success: false };
        }
        
        // 3. الحركة الصايعة: اختيار النتيجة اللي في نص المصفوفة
        // دي بتضمن إننا لا نختار أول نطاق متاح (غالباً بيبقى ضيق) 
        // ولا آخر نطاق (غالباً بيبقى واسع زيادة)، فبناخد الحل المتزن.
        const midIndex = Math.floor(validRanges.length / 2);
        const finalChoice = validRanges[midIndex];
        
        this.log(`> Smart Selection Successful: Range [${finalChoice.tmin} to ${finalChoice.tmax}] (${finalChoice.winRate.toFixed(2)}%)`, 'success');
        
        return {
            success: true,
            tmin: finalChoice.tmin,
            tmax: finalChoice.tmax
        };
    },

    generateRandomAiConfig() {
        /* A. Grid Size Definition */
        const cols = this.getRandom(this.getVal('aiGridXMin'), this.getVal('aiGridXMax'));
        const rows = this.getRandom(this.getVal('aiGridYMin'), this.getVal('aiGridYMax'));
        const totalCells = cols * rows;

        const allIndices = Array.from({ length: totalCells }, (_, i) => i);
        this.shuffleArray(allIndices);
        let availableSpace = totalCells;

        /* B. Element Allocation (Blocks, Switches, MustBombs) */
        const allocateElements = (chkId, minId, maxId) => {
            if (!this.getChecked(chkId)) return [];
            const userMin = this.getVal(minId);
            const userMax = this.getVal(maxId);
            const chosenCount = this.getRandom(userMin, userMax);
            const effectiveCount = Math.min(chosenCount, availableSpace);
            availableSpace -= effectiveCount;
            return allIndices.splice(0, effectiveCount);
        };

        const blocks = allocateElements('aiAllowBlocks', 'aiBlocksMin', 'aiBlocksMax');
        const switches = allocateElements('aiAllowSwitches', 'aiSwitchesMin', 'aiSwitchesMax');
        const mustBombs = allocateElements('aiAllowMustBombs', 'aiMustBombsMin', 'aiMustBombsMax');

        /* C. Bomb Count Allocation */
        const getBombCount = (chkId, minId, maxId) => {
            if (!this.getChecked(chkId)) return 0;
            return this.getRandom(this.getVal(minId), this.getVal(maxId));
        };

        const bombs1 = getBombCount('aiAllowBombs1', 'aiBombs1Min', 'aiBombs1Max');
        const bombs2 = getBombCount('aiAllowBombs2', 'aiBombs2Min', 'aiBombs2Max');
        const bombsNeg = getBombCount('aiAllowBombsNeg', 'aiBombsNegMin', 'aiBombsNegMax');

        /* D. Target Score & Constraints */
        const userTMin = this.getVal('aiScoreMin');
        const userTMax = this.getVal('aiScoreMax');
        const r1 = this.getRandom(userTMin, userTMax);
        const r2 = this.getRandom(userTMin, userTMax);

        // Initial Config Object
        const config = {
            rows, cols,
            blocks, switches, mustBombs,
            bombs1, bombs2, bombsNeg,
            tmin: -Infinity,
            tmax: Infinity,
            maxSolutions: 5000,
            maxAnalysisSolutions: this.getVal('aiAnalysisLimit') || 100000000,
            starConditions: []
        };

        /* E. Attach Star Conditions */
        config.starConditions = this.generateStarConditions(config);

        return config;
    },


    // =========================================================================
    // [SECTION 6] WORKER RUNNER
    // Handles communication with 'solver-worker.js' via Promises
    // =========================================================================

    async runAiSolver(config) {
        if (this.activeWorker) this.activeWorker.terminate();

        return new Promise((resolve, reject) => {
            this.activeWorker = new Worker('solver-worker.js');
            this.activeWorker.postMessage({ cmd: 'solve', config: config });

            this.activeWorker.onmessage = (e) => {
                const msg = e.data;
                // Handle different message types from worker
                if (msg.type === 'worker-log') {
                    this.log(msg.message, msg.logType);
                } else if (msg.type === 'estUpdate') {
                    const combEl = document.getElementById('combCount');
                    if (combEl && typeof humanNumberBig === 'function') {
                        combEl.textContent = humanNumberBig(BigInt(msg.value));
                    }
                    
                } else if (msg.type === 'progress') {
                     const bar = document.getElementById('progressBar');
                     const pct = document.getElementById('progressPct');
                     if (bar) bar.style.width = `${msg.value}%`;
                     if (pct) pct.textContent = `${Math.round(msg.value)}%`;
                } else if (msg.type === 'done') {
                    this.activeWorker.terminate();
                    this.activeWorker = null;
                    resolve(msg);
                }
            };

            this.activeWorker.onerror = (err) => {
                if (this.activeWorker) this.activeWorker.terminate();
                this.activeWorker = null;
                reject(err);
            };
        });
    },


    // =========================================================================
    // [SECTION 7] MAIN EXECUTION LOOP (THE ENGINE)
    // Orchestrates the generation > preview > solve > analyze cycle
    // =========================================================================

    async startGeneration() {
        /* 1. Setup & Validation */
        const statusEl = document.getElementById('aiGenerationStatus');
        const progressBar = document.getElementById('progressBar');

        const validation = this.validateConstraints();
        if (!validation.valid) {
            this.log(validation.message, "error");
            if (statusEl) {
                statusEl.innerHTML = `<span style="color:red">${validation.message}</span>`;
                statusEl.className = 'status-message status-error';
            }
            return;
        }

        /* 2. Parameters Reading */
        const minWinPct = parseFloat(document.getElementById('aiSolMin')?.value) || 0;
        const maxWinPct = parseFloat(document.getElementById('aiSolMax')?.value) || 100;
        
        const stopAfter = this.getVal('aiStopAfter') || 1;
        let foundPuzzles = 0;

        this.isRunning = true;
        let attempts = 0;
        const globalStartTime = performance.now();

        this.log(`>>> ENGINE STARTED. Target Win Rate: ${minWinPct}% - ${maxWinPct}% <<<`, "info");

        /* 3. The Infinite Loop (until stopped) */
        while (this.isRunning) {
            attempts++;
            const config = this.generateRandomAiConfig();
            this.log(`Attempt #${attempts}`, "default", config);
            
            // --- Log generated config details ---
            this.log(`> Grid: ${config.cols}x${config.rows} Total = ${config.cols * config.rows}`, 'muted');
            this.log(`> Bombs: Normal: ${config.bombs1}, Powred: ${config.bombs2}, Negative: ${config.bombsNeg}`, 'muted');
            this.log(`> Elements: Blocks: ${config.blocks.length} [${config.blocks.join(', ')}], Switches: ${config.switches.length} [${config.switches.join(', ')}], MustBombs: ${config.mustBombs.length} [${config.mustBombs.join(', ')}]`, 'muted');
            this.log(`> Target Score Range: ${config.tmin} to ${config.tmax}`, 'muted');
            
            if (config.starConditions.length > 0) {
               this.log(`>Stars condition`);
                config.starConditions.forEach((condArr, i) => {
                    if (condArr[0]) {
                        this.log(`>> Star ${i + 1}: ${this.formatStarCondition(condArr[0])}`, 'muted');
                    }
                });
            } else {
                this.log(`> Star Conditions: Not allowed by user`, 'muted');
            }

            // Preview on UI
            this.previewLevel(config);

            // Small UI Yield
            await new Promise(r => setTimeout(r, 0));

            if (statusEl) statusEl.innerHTML = `<i class="fas fa-sync fa-spin"></i> Attempt #${attempts}...`;
            if (progressBar) progressBar.style.width = '0%';

            try {
                const attemptStartTime = performance.now();
                const analysisResult = await this.runAiSolver(config);
                const totalCombos = analysisResult.lastTotalCombinations ? BigInt(analysisResult.lastTotalCombinations) : 1n;
                /*---------------------------------------------------*/
                if (totalCombos > 0n && analysisResult.targetStats) {
                    if (statusEl) statusEl.innerHTML = `<i class="fas fa-cogs"></i> Attempt #${attempts} (Phase 2)...`;

                    const selection = this.selectSmartTarget(analysisResult.targetStats, totalCombos, minWinPct, maxWinPct);

                    if (selection.success) {
                        // Found a valid target, now finalize the config
                        finalConfig = { ...config, tmin: selection.tmin, tmax: selection.tmax };
                        finalConfig.starConditions = this.generateStarConditions(finalConfig);

                        // Log final details
                        this.log(`> Final Target: ${finalConfig.tmin}, Stars: ${finalConfig.starConditions.length}`, 'success');
                        this.log(`✅ MATCH FOUND! Puzzle generation successful.`, "success");
                        this.previewLevel(finalConfig);
                        success = true;
                    } else {
                         this.log(`❌ Attempt Failed: No suitable target found.`, "result-update status-error");
                    }
                } else {
                     this.log(`❌ Attempt Failed: No solutions found in Phase 1.`, "result-update status-error");
                }

                this.log(`> Phase 3: Verifying final config...`, 'info');
                if (statusEl) statusEl.innerHTML = `<i class="fas fa-check-double"></i> Verifying Attempt #${attempts}...`;
                
                analysisResult = await this.runAiSolver(finalConfig);
                /*---------------------------------------------------*/
                /* 4. Win Chance Calculation */
              
                const validSols = BigInt(analysisResult.validSolutionsCountBig || analysisResult.solutions.length || 0);
                
                this.log(`> Solver Result: ${validSols} valid solutions / ${totalCombos} total combos`, 'muted');

                let winChance = 0;
                if (totalCombos > 0n) {
                    const percentageScaled = (validSols * 10000n) / totalCombos;
                    winChance = Number(percentageScaled) / 100;
                }

                this.log(`> winChance: ${winChance}`, 'muted');

                /* 5. Update Global GameState & UI (Centralized) */
                if (typeof GameState !== 'undefined' && typeof handlePostSolveAnalysis === 'function') {
                    GameState.results.solutions = analysisResult.solutions || [];
                    GameState.results.workerStats = analysisResult.stats;
                    GameState.results.targetStats = analysisResult.targetStats;
                    GameState.results.conditionStats = analysisResult.conditionStats;
                    GameState.results.lastTotalCombinations = analysisResult.lastTotalCombinations ? BigInt(analysisResult.lastTotalCombinations) : 0n;
                    GameState.results.validSolutionsCount = BigInt(analysisResult.validSolutionsCountBig || 0);
                    GameState.results.chanceWinPercentage = winChance;
                    GameState.results.showHeatmap = true;
                    GameState.results.abortFlag = false;

                    handlePostSolveAnalysis(attemptStartTime);
                }

                /* 6. Check Criteria */
                const hasSolutions = validSols > 0n;
                const isWithinRange = winChance >= minWinPct && winChance <= maxWinPct;

                // Console Header Update
                if (hasSolutions) {
                    const statusClass = isWithinRange ? "status-success" : "status-warning";
                    const icon = isWithinRange ? "✅" : "⚠️";
                    this.log(`${icon} Win Rate: ${winChance.toFixed(4)}% (Sols: ${validSols})`, `result-update ${statusClass}`);
                    
                    if (!isWithinRange) {
                        this.log(`> Rate mismatch. Required: ${minWinPct}-${maxWinPct}%`, "muted");
                    }
                } else {
                    this.log(`❌ No Solutions`, "result-update status-error");
                }

                /* 7. Success Handling */
                if (hasSolutions && isWithinRange) {
                    this.log(`✅ MATCH FOUND! Puzzle generation successful.`, "success");
                    foundPuzzles++;
                    
                    if (foundPuzzles >= stopAfter) {
                        this.isRunning = false;
                        const totalTime = ((performance.now() - globalStartTime) / 1000).toFixed(1);
                        if (statusEl) {
                              statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Done! Found ${foundPuzzles} puzzle(s) in ${totalTime}s.`;
                        }
                        if (progressBar) progressBar.style.width = '100%';
                        
                        if (typeof showStatus === 'function') {
                            showStatus(`AI Generation Complete! Win Chance: ${winChance.toFixed(3)}%`, false);
                        }
                        break;
                    }
                }
            } catch (err) {
                this.log(`❌ Error: ${err.message}`, "error");
                console.error(err);
            }
            
            // Loop Delay
            await new Promise(r => setTimeout(r, 00));
        }
    },
};