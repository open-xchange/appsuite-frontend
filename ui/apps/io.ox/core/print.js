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

    function getWindow(url) {
        var width = 600, height = screen.availHeight - 100,
            left = (screen.availWidth - width) / 2 >> 0, top = 40,
            options = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',menubar=0,toolbar=0,location=1,status=0',
            name = 'print_' + _.now(), // avoid bugs about non-opening windows
            win = window.open(url, name, options);
        win.moveTo(left, top);
        return win;
    }

    return {

        open: function (module, data, _url_) {

            var params = { action: 'get' }, url;

            if (_.isArray(data)) {
                params.data = JSON.stringify(data);
            } else {
                params.folder = data.folder_id || data.folder;
                params.id = data.id;
            }

            params.format = 'template';
            params.template = defaultTemplates[module] || fallbackTemplate;
            params.session = ox.session;

            url = _url_ || ox.apiRoot + '/' + module + '?' + $.param(params);

            return getWindow(url);
        },

        interim: function (url) {
            console.warn('Temporary solution; replace by open()', url);
            return this.open('mail', {}, url || (ox.base + '/blank.html'));
        }
    };
});
