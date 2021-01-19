const { event, container, output, Codecept } = require('codeceptjs');
const { getConfig, printError } = require('codeceptjs/lib/command/utils');
const fsPath = require('path');

class CodeceptRerunner extends Codecept {
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
                return !this.lastRun || this.lastRun[test.title] === 'failed';
            });
        });
        const failures = await new Promise(resolve => mocha.run(resolve));
        this.lastRun = {};
        mocha.suite.suites.forEach((suite) => {
            suite.tests.forEach(test => {
                this.lastRun[test.title] = test.state || 'failed';
            });
        });
        if (failures > 0) {
            throw new Error(`${failures} tests fail`);
        }
    }

    async runTests(test) {
        const configRerun = this.config.rerun || {};
        const minSuccess = configRerun.minSuccess || 1;
        const maxReruns = configRerun.maxReruns || 1;
        if (minSuccess > maxReruns) throw new Error('minSuccess must be less than maxReruns');
        if (maxReruns === 1) {
            await this.runOnce(test);
            return;
        }
        let successCounter = 0;
        let rerunsCounter = 0;
        while (rerunsCounter < maxReruns && successCounter < minSuccess) {
            rerunsCounter++;
            try {
                await this.runOnce(test);
                successCounter++;
                output.success(`\nProcess run ${rerunsCounter} of max ${maxReruns}, success runs ${successCounter}/${minSuccess}\n`);
            } catch (e) {
                output.error(`\nFail run ${rerunsCounter} of max ${maxReruns}, success runs ${successCounter}/${minSuccess} \n`);
            }

        }
        if (successCounter < minSuccess) {
            throw new Error(`Flaky tests detected! ${successCounter} success runs achieved instead of ${minSuccess} success runs expected`);
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
    const codeceptDir = fsPath.resolve(__dirname, '../');
    const conf = getConfig(codeceptDir);
    const [test] = process.argv.slice(2);
    const customRunner = new CodeceptRerunner(conf, { fgrep: test, colors: true });
    customRunner.init(codeceptDir);

    try {
        await customRunner.bootstrap();
        customRunner.loadTests('./e2e/tests/**/*_test.js');
        // run tests
        await customRunner.run();
    } catch (err) {
        printError(err);
        process.exitCode = 1;
    }
})();
