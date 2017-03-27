/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
var util = require('util');

describe('Portal', function () {

    describe('Widgets', function () {

        it('adds and removes inbox widget', function (client) {

            var previousFirstCID,
                widgetCID;

            client
                .login('app=io.ox/portal')
                .waitForElementVisible('*[data-app-name="io.ox/portal"]', 20000)
                .assert.containsText('*[data-app-name="io.ox/portal"]', 'Portal');

            // store previous first widget
            client
                .waitForElementVisible('.io-ox-portal-window ol.widgets', 2500)
                .getAttribute('.io-ox-portal-window .widgets li:first-child', 'data-widget-id', function (result) {
                    previousFirstCID = result.value;
                });

            // add new inbox widget
            client
                .clickWhenVisible('.io-ox-portal-window .header button.dropdown-toggle', 2500)
                .clickWhenVisible('.dropdown.open a[data-type="mail"]')
                .waitForElementVisible('.io-ox-dialog-popup .modal-body', 2500)
                .clickWhenVisible('.io-ox-dialog-popup .modal-footer button[data-action="save"]');

            // wait for element visible and assert correct data
            client
                .perform(function (api, done) {
                    api.waitForElementVisible(util.format('.io-ox-portal-window .widgets > li:not([data-widget-id="%s"]):first-child', previousFirstCID), 2500);
                    done();
                })
                .getAttribute('.io-ox-portal-window .widgets li:first-child', 'data-widget-id', function (result) {
                    widgetCID = result.value;
                })
                .perform(function (api, done) {
                    api.assert.containsText(util.format('.io-ox-portal-window .widgets li[data-widget-id="%s"] .title', widgetCID), 'Inbox');
                    done();
                });

            // remove widget
            client
                .perform(function (api, done) {
                    api.click(util.format('.io-ox-portal-window .widgets li[data-widget-id="%s"] .disable-widget', widgetCID));
                    done();
                })
                .waitForElementVisible('.io-ox-dialog-popup .modal-body', 2500)
                .clickWhenVisible('.io-ox-dialog-popup .modal-footer button[data-action="delete"]')
                .perform(function (api, done) {
                    api
                        .waitForElementNotPresent(util.format('.io-ox-portal-window .widgets li[data-widget-id="%s"]', widgetCID), 2500)
                        .assert.elementNotPresent(util.format('.io-ox-portal-window .widgets li[data-widget-id="%s"]', widgetCID));
                    done();
                });

            client.logout();
        });

    });

});
