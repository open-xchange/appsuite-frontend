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

define(['io.ox/core/tk/vgrid'], function (VGrid) {
    'use strict';

    describe('The VGrid', function () {
        describe('showing an empty folder', function () {
            it('should display a hint about empty folder', function () {
                var node = $('<div>'),
                    vgrid = new VGrid(node),
                    getAll = function () {
                        var def = $.Deferred();
                        _.defer(function () {
                            def.resolve([]);
                        });
                        return def;
                    },
                    getList = function (ids) {
                        var def = $.Deferred();
                        _.defer(function () {
                            def.resolve(ids);
                        });
                        return def;
                    };

                vgrid.setAllRequest(getAll);
                vgrid.setListRequest(getList);
                vgrid.setEmptyMessage(function () {
                    return 'Non-empty Testmessage';
                });
                vgrid.paint();

                waitsFor(function () {
                    //vgrid.paint() returns a deferred object, but it doesn’t resolve
                    //when painting is done, but more early. So we need to wait for
                    //the test message to appear
                    //TODO: is this a bug or a feature?
                    return node.text().indexOf('Non-empty Testmessage') >= 0;
                }, 'no test message was added', 1000);
            });
        });

        describe('showing a folder with one file', function () {
            //TODO: implement me
        });

        describe('showing a folder with some files', function () {
            //TODO: implement me
        });

        describe('showing a folder with a lot of files', function () {
            //TODO: implement me
        });
    });
});
