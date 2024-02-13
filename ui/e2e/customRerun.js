/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

const { event, container, output, Codecept } = require('codeceptjs');
const { getConfig, printError } = require('codeceptjs/lib/command/utils');
const fsPath = require('path');

class CodeceptRerunner extends Codecept {

    constructor(config, options) {
        super(config, options);
        this.configRerun = this.config.rerun || {};
        this.minSuccess = this.configRerun.minSuccess || 1;
        this.maxReruns = this.configRerun.maxReruns || 1;
        this.successCounter = 0;
        this.rerunsCounter = 0;
        this.testSuccessCounter = {};
    }

    async runOnce(test) {
        container.createMocha();
        const mocha = container.mocha();
        this.testFiles.forEach((file) => {
            delete require.cache[file];
        });
        mocha.files = this.testFiles;
        if (test) {
            if (!fsPath.isAbsolute(test)) {
                test = fsPath.join(global.codecept_dir, test);
            }
            mocha.files = mocha.files.filter(t => fsPath.basename(t, '.js') === test || t === test);
        }
        await new Promise(resolve => mocha.loadFiles(resolve));
        mocha.suite.suites.forEach(suite => {
            suite.tests = suite.tests.filter(test => {
                return !this.lastRun ||
                this.lastRun[test.title] === 'failed' ||
                (this.lastRun[test.title] === 'passed' && this.testSuccessCounter[test.title] < this.minSuccess);
            });
        });
        const failures = await new Promise(resolve => mocha.run(resolve));
        this.lastRun = {};
        mocha.suite.suites.forEach((suite) => {
            suite.tests.forEach(test => {
                this.lastRun[test.title] = test.state || 'failed';
                if (test.state === 'passed') this.testSuccessCounter[test.title] ? this.testSuccessCounter[test.title]++ : this.testSuccessCounter[test.title] = 1;
            });
        });
        if (failures > 0) {
            throw new Error(`${failures} tests fail`);
        }
    }

    async runTests(test) {
        if (this.minSuccess > this.maxReruns) throw new Error('minSuccess must be less than maxReruns');
        if (this.maxReruns === 1) {
            await this.runOnce(test);
            return;
        }
        while (this.rerunsCounter < this.maxReruns && this.successCounter < this.minSuccess) {
            this.rerunsCounter++;
            try {
                await this.runOnce(test);
                this.successCounter++;
                output.success(`\nProcess run ${this.rerunsCounter} of max ${this.maxReruns}, success runs ${this.successCounter}/${this.minSuccess}\n`);
            } catch (e) {
                output.error(`\nFail run ${this.rerunsCounter} of max ${this.maxReruns}, success runs ${this.successCounter}/${this.minSuccess} \n`);
            }

        }
        if (this.successCounter < this.minSuccess) {
            throw new Error(`Flaky tests detected! ${this.successCounter} success runs achieved instead of ${this.minSuccess} success runs expected`);
        }
    }

    async run(test) {
        event.emit(event.all.before, this);
        try {
            await this.runTests(test);
        } finally {
            this.teardown();
            event.emit(event.all.result, this);
            event.emit(event.all.after, this);
        }
    }
}

(async () =>{
    const codeceptDir = process.cwd();
    const conf = getConfig(codeceptDir);
    const [test] = process.argv.slice(2);
    const customRunner = new CodeceptRerunner(conf, { fgrep: test, colors: true });
    customRunner.init(codeceptDir);

    try {
        await customRunner.bootstrap();
        customRunner.loadTests();
        // run tests
        await customRunner.run();
        process.exitCode = 0;
    } catch (err) {
        printError(err);
        process.exitCode = 1;
    }
})();
