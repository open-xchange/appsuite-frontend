/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/views', [
    'io.ox/onboarding/clients/extensions',
    'io.ox/core/extensions'
], function (extensions, ext) {

    'use strict';

    var POINT = 'io.ox/onboarding/clients/views',
        views = {
            list: function (data) {
                var view = new extensions.ActionsListView(data);
                this.append(view.render().$el);
            },
            download: function (action, baton) {
                var view = new extensions.DownloadActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            shortmessage: function (action, baton) {
                var view = new extensions.ShortMessageActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            email: function (action, baton) {
                var view = new extensions.EmailActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            display: function (action, baton) {
                var view = new extensions.DisplayActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            client: function (action, baton) {
                var view = new extensions.ClientActionView(action, { baton: baton });
                this.append(view.render().$el);
            }
        };

    // actions list view
    ext.point(POINT).extend({ draw: views.list });

    // config
    ext.point(POINT + '/download').extend({ draw: views.download });
    ext.point(POINT + '/email').extend({ draw: views.email });
    ext.point(POINT + '/sms').extend({ draw: views.shortmessage });
    // display: generic
    ext.point(POINT + '/display').extend({ draw: views.display });
    // client download: generic
    ext.point(POINT + '/link').extend({ draw: views.client });

    return views;

});
