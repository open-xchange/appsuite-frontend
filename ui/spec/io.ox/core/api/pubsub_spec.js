/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(
    ['io.ox/core/api/pubsub',
     'shared/examples/for/api'
    ], function (api, sharedExamplesFor) {

    var testData = {
        create: {
            "entity": {"folder":"14657"}
        }
    };

    describe('publication API', function () {
        sharedExamplesFor(api.publications, {testData: testData});
    });

    describe('subscription API', function () {
        sharedExamplesFor(api.subscriptions, {testData: testData});
    });
});
