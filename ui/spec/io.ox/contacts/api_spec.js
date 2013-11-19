/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/contacts/api'], function (api) {

    'use strict';

    describe('Contact API', function () {

        it('should return proper image path for internal users', function () {
            var url = api.pictureHalo({ internal_userid: 0, folder_id: 6, id: 1337 });
            expect(url).toBe(ox.apiRoot + '/halo/contact/picture?action=get&internal_userid=0');
        });

        it('should return proper image path for contacts', function () {
            var url = api.pictureHalo({ folder_id: 6, id: 1337 });
            expect(url).toBe(ox.apiRoot + '/halo/contact/picture?action=get&folder=6&id=1337');
        });

        it('should return proper image path for recipients', function () {
            var url = api.pictureHalo({ email: 'test@open-xchange.com' });
            expect(url).toBe(ox.apiRoot + '/halo/contact/picture?action=get&email=test%40open-xchange.com');
        });

        it('should return proper image path for distribution lists', function () {
            var url = api.pictureHalo({ mark_as_distributionlist: true, folder_id: 6, id: 1337 });
            expect(url).toBe(ox.base + '/apps/themes/default/dummypicture_group.png');
        });

        it('should return proper image path for resources', function () {
            var url = api.pictureHalo({ mailaddress: 'beamer@open-xchange.com', description: '', id: 1337 });
            expect(url).toBe(ox.base + '/apps/themes/default/dummypicture_resource.png');
        });

        it('should return proper image path for groups', function () {
            var url = api.pictureHalo({ members: [], id: 1337 });
            expect(url).toBe(ox.base + '/apps/themes/default/dummypicture_group.png');
        });
    });
});
