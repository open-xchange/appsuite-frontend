const Codecept = require('codeceptjs/lib/rerun');
const { getConfig, printError } = require('codeceptjs/lib/command/utils');
const path = require('path');

(async () =>{
    const codeceptDir = path.resolve(__dirname, '../');
    const conf = getConfig(codeceptDir);
    const [test] = process.argv.slice(2);
    const customRunner = new Codecept(conf, { fgrep: test, colors: true });
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
