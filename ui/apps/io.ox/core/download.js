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

define('io.ox/core/download', ['io.ox/files/api'], function (filesApi) {

    'use strict';

    function map(o) {
        return { id: o.id, folder_id: o.folder_id };
    }

    // simple iframe download (see bug 29276)
    // window.open(url); might leave open tabs or provoke popup-blocker
    // window.location.assign(url); has a weird impact on ongoing uploads (see Bug 27420)
    function iframe(url) {
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
            filesApi.get(filesApi.reduce(options)).done(function (file) {
                if (options.version) {
                    file = _.extend({}, file, { version: options.version });
                }
                var url = filesApi.getUrl(file, 'download');
                iframe(url);
            });
        },

        // download multiple files as zip file
        files: function (list) {
            form({
                url: ox.apiRoot + '/files?action=zipdocuments&session=' + ox.session,
                body: JSON.stringify(_.map(list, map))
            });
        }
    };
});
