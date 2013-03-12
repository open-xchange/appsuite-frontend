/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/print', [], function () {

    'use strict';

    var fallbackTemplate = 'default.tmpl',

        defaultTemplates = {
            mail: 'super-mail-template.tmpl',
            contacts: 'super-contacts-template.tmpl',
            tasks: 'super-tasks-template.tmpl'
        };

    return {

        getWindowOptions: function (url) {
            var o = { width: 750, height: screen.availHeight - 100, top: 40 };
            o.left = (screen.availWidth - o.width) / 2 >> 0;
            o.string = 'width=' + o.width + ',height=' + o.height + ',left=' + o.left + ',top=' + o.top + ',menubar=0,toolbar=0,location=1,status=0';
            return o;
        },

        getWindow: function (url) {
            var name = 'print_' + _.now(), // avoid bugs about non-opening windows
                options = this.getWindowOptions(url),
                win = window.open(url, name, options.string);
            win.moveTo(options.left, options.top);
            return win;
        },

        // module and data are mandatory;
        // use options to overwrite default request params
        open: function (module, data, options) {

            var params = {action: 'get'}, url;

            // workaround for old printcalendar
            if (module === 'printCalendar') {
                delete params.action;
            }

            if (_.isArray(data)) {
                params.data = JSON.stringify(data);
            } else if (_.isObject(data)) {
                params.folder = data.folder_id || data.folder;
                params.id = data.id;
            }

            params.format = 'template';
            params.template = defaultTemplates[module] || fallbackTemplate;
            params.session = ox.session;

            url = ox.apiRoot + '/' + module + '?' + $.param(_.extend(params, options));

            return this.getWindow(url);
        },

        openURL: function (url) {
            return this.getWindow(url || (ox.base + '/blank.html'));
        },

        interim: function (url) {
            console.warn('Temporary solution; replace by open()', url);
            return this.openURL(url);
        }
    };
});
