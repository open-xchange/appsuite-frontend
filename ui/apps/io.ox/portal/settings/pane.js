/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Markus Bode <markus.bode@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/pane',
      ['io.ox/core/extensions',
       'io.ox/core/manifests',
       'io.ox/settings/utils',
       'io.ox/portal/settings/plugin/model',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/portal',
       'gettext!io.ox/portal',
       'apps/io.ox/core/tk/jquery-ui.min.js',
       'less!io.ox/portal/style.css'], function (ext, manifests, utils, PluginModel, dialogs, settings, gt) {

    'use strict';


    var pluginSettings = settings.get('pluginSettings', []),
        MAX_INDEX = 99999;


    ext.point("io.ox/portal/settings/detail").extend({
        index: 200,
        id: "portalsettings",
        draw: function (data) {
            var that = this;
            require(['io.ox/settings/accounts/settings/extpoints'], function () { //remove once Cisco's and Vic's new module stuff is implemented
                $('<h1>').text(gt('Portal Squares')).appendTo(that);
                ext.point('io.ox/portal/settings/detail/tile').each(function (extension) {
                    var $container = $('<div class="io-ox-portal-setting">').attr({id: extension.id}).addClass('tile-color' + extension.colorIndex).appendTo(that);
                    extension.draw.apply($container, []);
                });
            });
        }
    });

    return {};
});