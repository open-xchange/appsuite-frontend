const { event } = require('codeceptjs')
const Testrail = require('testrail-api');
//require('../utils');
 
const defaultConfig = {
	host: '',
	user: '',
	password: '',
};
 
const testCase = {
	passed: { status_id: 1, comment: 'This test passed' },
	failed: { status_id: 5, comment: 'This test failed' },
};
const tcRegex = /\[C([^\]]+)\]/;
//const tcRegex = /([C\w+)]/g
/**
  * Testrail Integration
  *
  *
  *
  * Enables Testrail integration.
  *
  * ##### Configuration
  *
  * Add this plugin to config file:
  *
  * ```js
  * plugins: {
  *     testrail: {
  *        require: 'codeceptjs-testrail',
  *        host: 'https://peternguyentr.testrail.io',
  *        user: 'username',
  *        password: 'password or api key'
  *        projectId: 1,
  *        runName: 'Custom run name',
  *        enabled: true
  *  }
  * }
  * ```
  *
  * Possible config options:
  *
  * `projectId`: The project Id which is from the Testrail - Required. This should be provided to make this plugin works
  * `runName`: your desired test run name - Optional. If you done provide this test run name, default test run name is as `This is a new test run on ${dd/mm/yyy}` which is current day.
  *
  */
 
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
 
module.exports = (config) => {
	config = Object.assign(defaultConfig, config);
 
	if (config.host === '' || config.user === '' || config.password === '') throw new Error('Please provide proper Testrail host or credentials');
	if (!config.project_id) throw new Error('Please provide project id');
	const runName = config.runName ? config.runName : `This is a new test run on ${getToday()}`;
	let runId;
	let caseId;
	//console.log(config)
	const testrail = new Testrail(config);
 
	event.dispatcher.on(event.suite.before, () => {
		//Check if runname is already given
		testrail.getRuns(/*PROJECT_ID=*/1, /*FILTERS=*/{}, function (err, response, runs) {
			//get first run
			let searchedRun = runs.filter(r => r.name === runName)[0]
			//check if run is empty
			if (searchedRun === undefined || searchedRun === null) {
				//if run is emtpy with given name... create a new one
				testrail.addRun(config.projectId, { name: runName }, (err, response, run) => {
					if (err) throw new Error(`Something is wrong while adding new run. Please check ${JSON.stringify(err)}`);
					//console.log('could not find any TestRun with given name ' + runName + ' create a new Testrun :)')
					runId = run.id;
					//console.log(response)
				});
			} else {
				//else use run if from last run with same name
				//console.log('Testrun with name ' + runName + ' was found... Use RunID ' + searchedRun.id + ' for this testrun')
				runId = searchedRun.id
			};
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
			if (err) throw new Error(`Something is wrong while adding result for a test case. Please check ${JSON.stringify(err)}`);
			//console.log(event);
		});
	});
	event.dispatcher.on(event.test.failed, () => {
		testrail.addResultForCase(runId, caseId, testCase.failed, (err) => {
			if (err) throw new Error(`Something is wrong while adding result for a test case. Please check ${JSON.stringify(err)}`);
		});
	});
 
	return this;
};