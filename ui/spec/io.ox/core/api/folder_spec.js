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
define(['shared/examples/for/api',
       'io.ox/core/api/folder'
], function (sharedExamplesFor, api) {

    return describe('folder API', function () {
        var options = {
            markedPending: {
                'folder API a basic API class has some get methods should define a getAll method.': true,
                'folder API a basic API class has some get methods should return a deferred object for getAll.': true,
                'folder API a basic API class has some get methods should define a getList method.': true,
                'folder API a basic API class has some get methods should return a deferred object for getList.': true,
                'folder API default folders should know about the mail folder.': true,
                'folder API default folders should provide the mail folder as default.': true
            }
        }
        sharedExamplesFor(api, options);

        describe('default folders', function () {
            it('should provide the mail folder as default', function () {
                var folder_id = api.getDefaultFolder();
                expect(folder_id).toEqual('default0/INBOX');
            });

            it('should know about the mail folder', function () {
                var folder_id = api.getDefaultFolder('mail');
                expect(folder_id).toEqual('default0/INBOX');
            });
        });
    });
});
