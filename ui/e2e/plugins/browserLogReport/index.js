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

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const path = require('path');
const Container = require('codeceptjs/lib/container');
const recorder = require('codeceptjs/lib/recorder');
const event = require('codeceptjs/lib/event');
const output = require('codeceptjs/lib/output');
const { clearString } = require('codeceptjs/lib/utils');

const supportedHelpers = [
    'WebDriverIO',
    'WebDriver',
    'Protractor',
    'Appium',
    'Nightmare',
    'Puppeteer'
];

const defaultConfig = {
    output: global.output_dir
};

/**
 * The plugin records the console logs of the sessions, processed by codecept. When an e2e test fails,
 * it attaches the logs formatted to the Allure report.
 */

module.exports = function (config) {
    const helpers = Container.helpers(),
        reportDir = config.output ? path.resolve(global.codecept_dir, config.output) : defaultConfig.output;
    var helper, page;
    var logContent = [],
        currentActor;

    for (const helperName of supportedHelpers) {
        if (Object.keys(helpers).indexOf(helperName) > -1) {
            helper = helpers[helperName];
        }
    }
    if (!helper) return;

    event.dispatcher.on(event.test.before, async () => {
        init();
    });

    event.dispatcher.on(event.test.started, async () => {
        await addConsoleListener();
    });

    event.dispatcher.on(event.step.finished, async (step) => {
        if (step.name !== 'amOnPage' || step.actor === currentActor) return;
        clearConsoleListener();
        currentActor = step.actor;

        logContent.push({ text: function () { return `${step.actor} is the current actor`; }, type: function () { return 'pluginMessage'; } });

        await addConsoleListener();
    });

    event.dispatcher.on(event.test.finished, async () => {
        clean();
    });

    event.dispatcher.on(event.test.failed, (test) => {
        if (!logContent.length) return;

        recorder.add('browser logs of failed test', async () => {
            let fileName = generateFileName(test);

            output.plugin('browserLogReport', 'Adding browserlog to Allure');

            try {
                fileName = path.join(reportDir, fileName);

                await generateHTMLFile(fileName);

                const allureReporter = Container.plugins('allure');
                if (allureReporter) {
                    allureReporter.addAttachment('Browser logs', await readFile(fileName), 'text/html');
                }
            } catch (err) {
                if (
                    err
                    && err.type
                    && err.type === 'RuntimeError'
                    && err.message
                    && (
                        err.message.indexOf('was terminated due to') > -1
                        || err.message.indexOf('no such window: target window already closed') > -1
                    )
                ) {
                    helper.isRunning = false;
                }
            }
        }, true);
    });

    function generateFileName(test) {
        let fileName = clearString(test.title);
        // This prevent data driven to be included in the failed screenshot file name
        if (fileName.indexOf('{') !== -1) {
            fileName = fileName.substr(0, (fileName.indexOf('{') - 3)).trim();
        }
        if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
        if (test) {
            const uuid = test.uuid || test.ctx.test.uuid || Math.floor(new Date().getTime() / 1000);
            fileName = `${fileName.substring(0, 10)}_${uuid}.failed.html`;
        } else {
            fileName += '.failed.html';
        }

        return fileName;
    }

    async function generateHTMLFile(fileName) {
        var messagesTemplate = '';

        logContent.forEach(function (msg) {
            messagesTemplate += getFormattedMessageTemplate(msg);
        });

        try {
            await writeFile(fileName, getHTML(messagesTemplate));
        } catch (err) {
            output.plugin(`Can't save log: ${err}`);
        }
    }

    function init() {
        clearConsoleListener();
        currentActor = undefined;
        logContent = [];
    }

    function clean() {
        clearConsoleListener();
        page = undefined;
    }

    function clearConsoleListener() {
        if (page) page.off('console', writeLogContent);
    }

    async function addConsoleListener() {
        page = await helper._getContext();

        try {
            page.on('console', writeLogContent);
        } catch (err) {
            output.plugin(`${err}`);
        }
    }

    function writeLogContent(msg) {
        logContent.push(msg);
    }

    function getFormattedMessageTemplate(msg) {
        var [styles, text] = parseFormattedMessage(msg.text());
        return `<div class="${msg.type()} log-message" style="${styles}">${text}</div>\n`;
    }

    function parseFormattedMessage(text) {
        var isFormatted = new RegExp('^%c'), styles = '';
        if (!text.match(isFormatted)) return ['', text];

        var plainText = text.split('%c')[1];

        styleProperties.forEach(function (property) {
            var rule = new RegExp(property + ': ');
            if (!text.match(rule)) return;

            var end = new RegExp('[; ]');
            var unit = (text.split(property + ': ')[1]).split(end)[0];
            styles += property + ': ' + unit + '; ';

            plainText = plainText.split(property + ': ')[0];
        });

        return [styles, plainText];
    }

    function getHTML(messagesTemplate) {
        return `<html>
                    <head>
                        ${stylesTemplate}
                    </head>
                    <body>
                        ${messagesTemplate}
                    </body>
                </html>`;
    }
};

var styleProperties = [
    'color',
    'background-color',
    'font',
    'font-size',
    'font-weight',
    'font-style',
    'font-family'
];

var stylesTemplate = `<style type="text/css">
                            body {
                                margin: 0px;
                            }

                            .log-message {
                                padding: 8px 16px;
                            }

                            .error {
                                color: red;
                                background-color: #ffdede;
                            }

                            .warning {
                                color: #946e00;
                                background-color: #ffefc0;
                            }

                            .info {
                                color: #004984;
                                //background-color: #d9eeff;
                            }

                            .pluginMessage {
                                color: #008005;
                                //background-color: #e7ffe8;
                                font-weight: bold;
                            }

                            .log {
                                color: #353535;
                                background-color: #f7f7f7;
                            }
                        </style>`;
