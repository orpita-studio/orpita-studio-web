/**
 * =================================================================
 * PROGRESS.JS - Progress & Status Management
 * Handles progress bars and status messages
 * =================================================================
 */

export class Progress {
    constructor() {
        this.statusEl = document.getElementById('aiGenerationStatus');
        this.progressBar = document.getElementById('progressBar');
        this.progressPct = document.getElementById('progressPct');
        this.combEl = document.getElementById('combCount');
    }

    /**
     * Update status message
     * @param {string} html - HTML content for status
     * @param {string} className - CSS class name
     */
    setStatus(html, className = '') {
        if (this.statusEl) {
            this.statusEl.innerHTML = html;
            if (className) {
                this.statusEl.className = className;
            }
        }
    }

    /**
     * Update progress bar
     * @param {number} percentage - Progress percentage (0-100)
     */
    setProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        if (this.progressPct) {
            this.progressPct.textContent = `${Math.round(percentage)}%`;
        }
    }

    /**
     * Update combination count display
     * @param {string|BigInt} count - Combination count
     */
    setCombinationCount(count) {
        if (this.combEl && typeof humanNumberBig === 'function') {
            this.combEl.textContent = humanNumberBig(BigInt(count));
        }
    }
}