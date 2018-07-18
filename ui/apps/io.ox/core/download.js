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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/download', ['io.ox/files/api', 'io.ox/mail/api', 'io.ox/core/yell'], function (api, mailAPI, yell) {

    /* global blankshield:true */

    'use strict';

    // export global callback; used by server response
    window.callback_yell = yell;

    function map(o) {
        return { id: o.id, folder_id: o.folder || o.folder_id };
    }

    // simple iframe download (see bug 29276)
    // window.open(url); might leave open tabs or provoke popup-blocker
    // window.location.assign(url); has a weird impact on ongoing uploads (see Bug 27420)
    //
    // Note: This does not work for iOS as Safari will show the content of the download in the iframe as a preview
    // for the most known file types like MS Office, pictures, plain text, pdf, etc.!
    function iframe(url) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + 'callback=yell';
        $('#tmp').append(
            $('<iframe>', { src: url, 'class': 'hidden download-frame' })
        );
    }

    // works across all browsers (except mobile safari) for multiple items (see bug 29408)
    function form(options) {

        options = options || {};

        var name = _.uniqueId('iframe'),
            iframe = $('<iframe>', { src: 'blank.html', name: name, 'class': 'hidden download-frame' }),
            form = $('<form>', { action: options.url, method: 'post', target: name }).append(
                $('<input type="hidden" name="body" value="">').val(options.body)
            );

        // except for iOS we use a hidden iframe
        // iOS will open the form in a new window/tab
        if (!_.device('ios')) $('#tmp').append(iframe);
        $('#tmp').append(form);
        form.submit();
    }

    return {

        // publish utility functions for general use
        url: iframe,
        multiple: form,

        // actually only for ios
        window: function (url) {
            return blankshield.open(url, '_blank');
        },

        // download single file
        file: function (options) {

            // on iOS we need a new window, so open this right now
            var win = _.device('ios') && this.window('blank.html');

            api.get(options).done(function (file) {
                if (options.version) {
                    file = _.extend({}, file, { version: options.version });
                }
                if (options.filename) {
                    file = _.extend(file, { filename: options.filename });
                }
                var url = api.getUrl(file, 'download', { params: options.params });
                if (_.device('ios')) {
                    win.location = url;
                } else {
                    iframe(url);
                }
            });
        },

        // export list of ids or a complete folder
        exported: function (options) {
            if (!/^(VCARD|ICAL|CSV)$/i.test(options.format)) return;
            var opt = _.extend({ include: true }, options),
                isSelective = !opt.folder && opt.list;
            form({
                url: ox.apiRoot + '/export?' +
                    'action=' + opt.format.toUpperCase() +
                    (isSelective ? '' : '&folder=' + opt.folder) +
                    '&export_dlists=' + (opt.include ? 'true' : 'false') +
                    '&content_disposition=attachment' +
                    (opt.columns ? '&columns=' + opt.columns : '') +
                    '&session=' + ox.session,
                body: (isSelective ? JSON.stringify(_.map(opt.list, map)) : '')
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
