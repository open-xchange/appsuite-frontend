/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */
 
define('com.spamexperts/settings/register', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'settings!com.spamexperts'
], function (ext, http, settings) {
    'use strict';

    ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
        id: 'com.spamexperts',
        title: _.noI18n(settings.get('name')),
        ref: 'com.spamexperts',
        loadSettingPane: false,
        index: 'last'
    });
    
    ext.point('com.spamexperts/settings/detail').extend({
        draw: function () {
            var self = this;
            http.GET({
                module: 'spamexperts/panel',
                params: {
                    action: 'generate_panel_session',
                    version: 7
                }
            }).done(function (data) {
                $('<iframe>', {
                    src: data.panel_web_ui_url + data.panel_session,
                    frameborder: 0
                }).css({
                    position: 'absolute',
                    width: '100%',
                    minHeight: '100%'
                }).appendTo(self);
            });
        }
    });
});
