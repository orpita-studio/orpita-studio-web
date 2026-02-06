/**
 * =================================================================
 * WORKER-MANAGER.JS - Web Worker Manager
 * Manages communication with solver worker
 * =================================================================
 */

export class WorkerManager {
    constructor(logFn, progressManager) {
        this.activeWorker = null;
        this.logFn = logFn;
        this.progress = progressManager;
    }

    /**
     * Run solver with configuration
     * @param {Object} config - Level configuration
     * @returns {Promise} Solver results
     */
    async runSolver(config) {
        if (this.activeWorker) {
            this.activeWorker.terminate();
        }

        return new Promise((resolve, reject) => {
            this.activeWorker = new Worker('solver-worker.js');
            this.activeWorker.postMessage({ cmd: 'solve', config });

            this.activeWorker.onmessage = (e) => {
                const msg = e.data;

                if (msg.type === 'worker-log') {
                    this.logFn(msg.message, msg.logType);
                }
                else if (msg.type === 'estUpdate') {
                    this.progress.setCombinationCount(msg.value);
                }
                else if (msg.type === 'progress') {
                    this.progress.setProgress(msg.value);
                }
                else if (msg.type === 'done') {
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
    }

    /**
     * Terminate active worker
     */
    terminate() {
        if (this.activeWorker) {
            this.activeWorker.terminate();
            this.activeWorker = null;
        }
    }
}