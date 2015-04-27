/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/files/register', [
    'io.ox/core/extensions',
    'io.ox/files/api',
    'io.ox/preview/main',
    'io.ox/portal/widgets',
    'gettext!plugins/portal'
], function (ext, api, preview, portalWidgets, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/stickyfile').extend({

        // helps at reverse lookup
        type: 'files',

        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id }).then(
                function success(data) {
                    baton.data = data;
                    api.on('remove', function (event, elements) {
                        var filename = baton.data.filename;
                        if (_(elements).any(function (element) { return element.filename === filename; })) {
                            var widgetCol = portalWidgets.getCollection();
                            widgetCol.remove(baton.model);
                        }
                    });
                },
                function fail(e) {
                    return e.code === 'IFO-0300' ? 'remove' : e;
                }
            );
        },

        preview: function (baton) {
            //#. %1$s is a filename
            var content = $('<div class="content pointer" tabindex="1" role="button" aria-label="' + gt.format('Press [enter] to jump to %1$s', baton.data.filename) + '">'),
                data, options, url;

            if (_.isEmpty(baton.data.filename)) {
                //old 'description only files'
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                content.html(_.escape(baton.data.description).replace(/\n/g, '<br>'));
            } else if ((/(png|jpe?g|gif|bmp)$/i).test(baton.data.filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                options = { width: 300, height: 300, scaleType: 'cover' };
                url = api.getUrl(data, 'view') + '&' + $.param(options);
                this.addClass('photo-stream');
                content.addClass('decoration');
                content.css('backgroundImage', 'url(' + url + ')');
            } else if ((/(mpeg|m4a|mp3|ogg|oga|x-m4a)$/i).test(baton.data.filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                options = { width: 300, height: 300 };
                url = api.getUrl(data, 'cover', options);
                this.addClass('photo-stream');
                content.addClass('decoration');
                content.css('backgroundImage', 'url(' + url + ')');
            } else if ((/(txt|json|md|csv)$/i).test(baton.data.filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                $.ajax({ type: 'GET', url: api.getUrl(data, 'view') + '&' + _.now(), dataType: 'text' }).done(function (filecontent) {
                    content.html(_.escape(filecontent).replace(/\n/g, '<br>'));
                });
            } else {
                // try images url via preview engines
                baton.data.url = api.getUrl(baton.data, 'bare');
                if ((url = preview.getPreviewImage(baton.data))) {
                    this.addClass('preview');
                    content.addClass('decoration');
                    content.css('backgroundImage', 'url(' + url + ')');
                }
            }

            content.on('click keypress', { file: baton.data }, function (e) {
                // ignore any keys except 'enter'
                if (e.type === 'keypress' && e.which !== 13) return;
                // stop propagation to avoid side-popup
                e.stopPropagation();
                // open viewer
                require(['io.ox/core/viewer/main'], function (viewer) {
                    viewer.launch({ files: [e.data.file] });
                });
            });

            this.append(content);
        },

        draw: function () {
        }
    });
});
