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

    var POINT = 'io.ox/onboarding/clients/views';

    //
    // actions block
    //

    ext.point(POINT).extend({
        index: 100,
        draw: function (data) {
            var view = new extensions.ActionsView(data);
            this.append(view.render().$el);
        }
    });

    //
    // action types
    //

    ext.point(POINT + '/download').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.DownloadActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/email').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.EmailActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/sms').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.ShortMessageActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/display/easmanual').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.DisplayActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/display/davmanual').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.DisplayActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/display/mailmanual').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.DisplayActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/mailappinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/emclientinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/drivewindowsclientinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/driveappinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/syncappinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });

    ext.point(POINT + '/link/drivemacinstall').extend({
        index: 100,
        draw: function (action, baton) {
            var view = new extensions.AppActionView(action, { baton: baton });
            this.append(view.render().$el);
        }
    });
});
