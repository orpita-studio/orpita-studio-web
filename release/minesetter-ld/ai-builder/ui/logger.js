/**
 * =================================================================
 * LOGGER.JS - Advanced Logging System
 * Handles console output with foldable groups and JSON export
 * =================================================================
 */

export class Logger {
    constructor() {
        this.currentAttemptDetails = null;
        this.currentAttemptHeader = null;
    }

    /**
     * Main logging function with support for groups and updates
     * @param {string} message - Message to log
     * @param {string} type - Log type (default, info, success, error, warning, muted)
     * @param {Object} config - Optional config for attempt groups
     */
    log(message, type = 'default', config = null) {
        const output = document.getElementById('consoleOutput');
        if (!output) return;

        // Case A: Group Start (Explicit or by keyword)
        const isAttempt = typeof message === 'string' && message.toLowerCase().includes("attempt #");
        if (type === 'group-start' || (isAttempt && config)) {
            this._createAttemptGroup(message, config, output);
        }
        // Case B: Update Result Header
        else if (type.includes('result-update') && this.currentAttemptHeader) {
            this._updateAttemptHeader(message, type);
        }
        // Case C: Standard Log Line
        else {
            this._appendLogLine(message, type, output);
        }

        // Highlight on success
        if (type === 'success' && this.currentAttemptDetails) {
            this.currentAttemptDetails.parentElement.classList.add('success-border', 'is-open');
        }

        output.scrollTop = output.scrollHeight;
    }

    /**
     * Create foldable group
     * @private
     */
    _createAttemptGroup(message, config, output) {
        const group = document.createElement('div');
        group.className = 'attempt-group';
        group.id = `group-${Date.now()}`;

        const header = document.createElement('div');
        header.className = 'attempt-header';

        // Toggle icon
        const toggle = document.createElement('span');
        toggle.className = 'toggle-icon';
        toggle.innerHTML = '▶';
        
        // Handle header click for toggle
        header.onclick = (e) => {
            if (e.target.closest('.btn-copy-json')) return;
            group.classList.toggle('is-open');
        };

        // Title
        const titleSpan = document.createElement('span');
        titleSpan.className = 'group-title';
        titleSpan.textContent = message;

        // Assemble header
        header.appendChild(toggle);
        header.appendChild(titleSpan);

        // Copy JSON button (if config provided)
        if (config) {
            const copyBtn = this._createCopyButton(config);
            header.appendChild(copyBtn);
        }

        // Status indicator
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-indicator';
        if (message.toLowerCase().includes("attempt")) {
            statusSpan.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing...`;
        }
        header.appendChild(statusSpan);

        // Details container
        const details = document.createElement('div');
        details.className = 'attempt-details';

        group.appendChild(header);
        group.appendChild(details);
        output.appendChild(group);

        // Save references
        this.currentAttemptDetails = details;
        this.currentAttemptHeader = header;
    }

    /**
     * Create copy JSON button
     * @private
     */
    _createCopyButton(config) {
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> JSON';
        copyBtn.className = 'btn-xs btn-copy-json';

        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const levelData = {
                gridColumns: config.cols,
                gridRows: config.rows,
                nrmBombCount: config.bombs1,
                plsBombCount: config.bombs2,
                ngtBombCount: config.bombsNeg,
                targetMin: config.tmin,
                targetMax: config.tmax,
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

            navigator.clipboard.writeText(JSON.stringify(levelData, null, 2))
                .then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> JSON';
                    }, 1500);
                })
                .catch(err => console.error('Copy failed', err));
        });

        return copyBtn;
    }

    /**
     * Update attempt header with result
     * @private
     */
    _updateAttemptHeader(message, type) {
        const statusSpan = this.currentAttemptHeader.querySelector('.status-indicator');
        if (statusSpan) {
            statusSpan.innerHTML = message;
            statusSpan.className = `status-indicator ${type.replace('result-update', '').trim()}`;
        }
    }

    /**
     * Append standard log line
     * @private
     */
    _appendLogLine(message, type, output) {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        // Use a bullet point or prefix
        let prefix = '→';
        if (type === 'info') prefix = 'ℹ';
        if (type === 'success') prefix = '✓';
        if (type === 'warning') prefix = '⚠';
        if (type === 'error') prefix = '✖';
        if (type === 'muted') prefix = '•';

        line.innerHTML = `<span class="log-prefix">${prefix}</span> <span class="log-message">${message}</span>`;

        if (this.currentAttemptDetails) {
            this.currentAttemptDetails.appendChild(line);
        } else {
            output.appendChild(line);
        }
    }
}