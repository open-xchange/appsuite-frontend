/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/sendlink', [
    'io.ox/files/api',
    'io.ox/core/util',
    'gettext!io.ox/files'
], function (api, util, gt) {

    'use strict';

    function getUrl(file) {
        return util.getDeepLink('io.ox/files', file);
    }

    function getHTML(label, url) {
        var link = '<a data-mce-href="' + url + '" href="' + url + '">' + url + '</a>';
        return _.escape(label) + '<br>' + gt('Direct link: %1$s', link);
    }

    function getText(label, url) {
        return label + '\n' + gt('Direct link: %1$s', url);
    }

    function process(list) {
        // generate text and html content
        var html = [], text = [], options;
        _(list).each(function (file) {
            var url = getUrl(file),
                label = gt('File: %1$s', file.filename || file.title),
                htmllink = getHTML(label, url),
                textlink = getText(label, url);
            // collect
            html.push(htmllink);
            text.push(textlink);
        });

        // open mail compose
        options = {
            attachments: {
                'html': [{ content: html.join('<br>') }],
                'text': [{ content: text.join('\n\n') }]
            }
        };
        ox.registry.call('mail-compose', 'compose', options);
    }

    return function (list) {
        api.getList(list).done(process);
    };
});
