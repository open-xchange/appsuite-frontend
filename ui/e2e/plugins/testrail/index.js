/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

const { event } = require('codeceptjs');
const Testrail = require('testrail-api');
const defaultConfig = {
    host: '',
    user: '',
    password: ''
};
const testCase = {
    passed: { status_id: 1, comment: 'This test passed' },
    failed: { status_id: 5, comment: 'This test failed' }
};
const tcRegex = /\[C([^\]]+)\]/;
function getToday() {
    const today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; // January is 0!

    const yyyy = today.getFullYear();
    if (dd < 10) {
        dd = `0${dd}`;
    }
    if (mm < 10) {
        mm = `0${mm}`;
    }
    return `${dd}/${mm}/${yyyy}`;
}
module.exports = function (config) {
    if (config.enabled === true) {
        config = Object.assign(defaultConfig, config);
        if (config.host === '' || config.user === '' || config.password === '') throw new Error('Please provide proper Testrail host or credentials');
        if (!config.project_id) throw new Error('Please provide project id');
        const runName = config.runName ? config.runName : `This is a new test run on ${getToday()}`;
        let runId;
        let caseId;
        const testrail = new Testrail(config);
        event.dispatcher.on(event.suite.before, () => {
            //Check if runname is already given
            testrail.getRuns(/*PROJECT_ID=*/1, /*FILTERS=*/{}, function (err, response, runs) {
                //get first run
                let searchedRun = runs.filter(r => r.name === runName)[0];
                //check if run is empty
                if (searchedRun === undefined || searchedRun === null) {
                    //if run is emtpy with given name... create a new one
                    testrail.addRun(config.project_id, { name: runName }, (err, response, run) => {
                        if (err) throw new Error(`Something is wrong while adding new run. Please check ${JSON.stringify(err)}`);
                        //console.log('could not find any TestRun with given name ' + runName + ' create a new Testrun :)')
                        runId = run.id;
                        //console.log(response)
                    });
                } else {
                    //else use run if from last run with same name
                    //console.log('Testrun with name ' + runName + ' was found... Use RunID ' + searchedRun.id + ' for this testrun')
                    runId = searchedRun.id;
                }
            });
        });
        event.dispatcher.on(event.test.started, (test) => {
            caseId = tcRegex.exec(test.title)[1];
            //console.log(caseId);
        });
        event.dispatcher.on(event.test.finished, (test) => {
            caseId = tcRegex.exec(test.title)[1];
            //console.log(caseId);
        });
        event.dispatcher.on(event.test.passed, () => {
            testrail.addResultForCase(runId, caseId, testCase.passed, (err) => {
                if (err) console.log('\x1b[33m%s\x1b[0m', `Something is wrong while adding result for a test case. Please check ${JSON.stringify(err)}`);
                //console.log(event);
            });
        });
        event.dispatcher.on(event.test.failed, () => {
            testrail.addResultForCase(runId, caseId, testCase.failed, (err) => {
                if (err) console.log('\x1b[33m%s\x1b[0m', `Something is wrong while adding result for a test case. Please check ${JSON.stringify(err)}`);
            });
        });
        return this;
    }
};
