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

define('io.ox/core/download', ['io.ox/files/api', 'io.ox/mail/api', 'io.ox/core/yell'], function (api, mailAPI, yell) {

    'use strict';

    // export global callback; used by server response
    window.callback_yell = yell;

    function map(o) {
        return { id: o.id, folder_id: o.folder_id };
    }

    // simple iframe download (see bug 29276)
    // window.open(url); might leave open tabs or provoke popup-blocker
    // window.location.assign(url); has a weird impact on ongoing uploads (see Bug 27420)
    function iframe(url) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + 'callback=yell';
        $('#tmp').append(
            $('<iframe>', { src: url, 'class': 'hidden download-frame' })
        );
    }

    // works across all browsers for multiple items (see bug 29408)
    function form(options) {

        options = options || {};

        var name = _.uniqueId('iframe'),
            form = $('<form>', { action: options.url, method: 'post', target: name });

        $('#tmp').append(
            $('<iframe>', { src: 'blank.html', name: name, 'class': 'hidden download-frame' }),
            form.append(
                $('<input type="hidden" name="body" value="">').val(options.body)
            )
        );

        form.submit();
    }

    return {

        // publish utility functions for general use
        url: iframe,
        multiple: form,

        // download single file
        file: function (options) {
            api.get(options).done(function (file) {
                if (options.version) {
                    file = _.extend({}, file, { version: options.version });
                }
                var url;
                // some filestorages have own urls
                // a bit of an ugly workaround that doesn't always work, maybe some backendwork can fix this
                if (file.url && (file.folder_id.indexOf('boxcom') === 0 ||
                    file.folder_id.indexOf('dropbox') === 0 ||
                    file.folder_id.indexOf('googledrive') === 0 ||
                    file.folder_id.indexOf('onedrive') === 0)) {
                    url = file.url;
                } else {
                    url = api.getUrl(file, 'download');
                }

                iframe(url);
            });
        },

        // download multiple files as zip file
        files: function (list) {
            form({
                url: ox.apiRoot + '/files?action=zipdocuments&callback=yell&session=' + ox.session,
                // this one wants folder_id
                body: JSON.stringify(_.map(list, map))
            });
        },

        // download single email as EML
        mail: function (options) {
            var url = mailAPI.getUrl(options, 'eml');
            iframe(url);
        },

        // download multiple emails (EML) as zip file
        mails: function (list) {
            form({
                url: ox.apiRoot + '/mail?action=zip_messages&session=' + ox.session,
                // this one wants folder - not folder_id
                body: JSON.stringify(_.map(list, mailAPI.reduce))
            });
        }
    };
});
