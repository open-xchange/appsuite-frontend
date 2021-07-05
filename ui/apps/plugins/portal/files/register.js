/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('plugins/portal/files/register', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/files/api',
    'io.ox/preview/main',
    'io.ox/portal/widgets',
    'gettext!plugins/portal'
], function (ext, actionsUtil, api, preview, portalWidgets, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/stickyfile').extend({

        // helps at reverse lookup
        type: 'files',

        load: function (baton) {
            var props = baton.model.get('props') || {};

            function updateWidgetTitle(title) {
                var $node = baton.model.node;

                $node.find('.title').text(title);
                $node.attr('aria-label', title);
                $node.find('a.disable-widget').attr({
                    'aria-label': title + ', ' + gt('Disable widget')
                });
                $node.find('.content.pointer').attr({
                    'aria-label': gt('Press [enter] to jump to %1$s', title)
                });
            }

            return api.get({ folder: props.folder_id, id: props.id }).then(
                function success(data) {
                    baton.data = data;
                    // respond to mail removal (attachment view; see bug 48544)
                    // yay, good naming; why that short name?
                    var mail = data['com.openexchange.file.storage.mail.mailMetadata'];
                    if (mail) {
                        // if we have mail meta data, we can assume to have mail as a capability
                        require(['io.ox/mail/api'], function (api) {
                            api.on('remove:' + _.ecid(mail), removeWidget);
                        });
                    }

                    // the file model instance
                    baton.fileModel = api.pool.get('detail').get(_.cid(data)) || null;
                    // respond to file rename
                    function fileRenameHandler(model) {
                        // call get without cache in order to get com.openexchange.file.sanitizedFilename updated
                        api.get(model.toJSON(), { cache: false }).then(
                            function success(data) {
                                baton.data = data;
                                var filename = data['com.openexchange.file.sanitizedFilename'] || data.filename || data.title;
                                if (props.title !== filename) {
                                    props.title = filename;
                                    // unset first to get change event for set with an object
                                    baton.model.unset('props', { silent: true });
                                    baton.model.set('props', props);

                                    updateWidgetTitle(filename);
                                }
                            });
                    }
                    if (baton.fileModel) {
                        baton.fileModel.on('change:com.openexchange.file.sanitizedFilename change:filename change:title', fileRenameHandler);
                    }

                    // respond to file removal
                    api.on('remove:file:' + _.ecid(data), removeWidget);
                    // remove widget from portal
                    function removeWidget() {
                        if (baton.fileModel) {
                            baton.fileModel.off('change:com.openexchange.file.sanitizedFilename change:filename change:title', fileRenameHandler);
                        }
                        portalWidgets.getCollection().remove(baton.model);
                    }
                },
                function fail(e) {
                    throw /^(FILE_STORAGE-0026|IFO-0300)$/.test(e.code) ? 'remove' : e;
                }
            );
        },

        preview: function (baton) {
            var filename = baton.data['com.openexchange.file.sanitizedFilename'] || baton.data.filename;
            //#. %1$s is a filename
            var content = $('<div class="content pointer" tabindex="0" role="button">')
                .attr('aria-label', gt('Press [enter] to jump to %1$s', filename)),
                data, options, url;

            if (_.isEmpty(filename)) {
                //old 'description only files'
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                content.html(_.escape(baton.data.description).replace(/\n/g, '<br>'));
            } else if ((/(png|jpe?g|gif|bmp)$/i).test(filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id, version: baton.data.version };
                options = { width: 300, height: 300, scaleType: 'cover' };
                url = api.getUrl(data, 'view') + '&' + $.param(options);
                this.addClass('photo-stream');
                content.addClass('decoration');
                content.css('backgroundImage', 'url(' + url + ')');
            } else if ((/(mpeg|m4a|mp3|ogg|oga|x-m4a)$/i).test(filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                options = { width: 300, height: 300 };
                url = api.getUrl(data, 'cover', options);
                this.addClass('photo-stream');
                content.addClass('decoration');
                content.css('backgroundImage', 'url(' + url + ')');
            } else if ((/(txt|json|md|csv)$/i).test(filename)) {
                data = { folder_id: baton.data.folder_id, id: baton.data.id };
                $.ajax({ type: 'GET', url: api.getUrl(data, 'view') + '&' + _.now(), dataType: 'text' }).done(function (filecontent) {
                    content.html(_.escape(filecontent).replace(/\n/g, '<br>'));
                });
            } else if (baton.data.encrypted) {
                content.addClass('encrypted');
            } else {
                options = { width: 300, height: 300, scaleType: 'cover' };

                // try images url via preview engines
                baton.data.url = api.getUrl(baton.data, 'bare');
                if ((url = preview.getPreviewImage(baton.data) || api.getUrl(baton.data, 'preview', options))) {
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

                require(['io.ox/files/actions'], function () {
                    api.get(e.data.file).then(function (file) {
                        var model = api.pool.get('detail').get(_.cid(file));
                        var collection = new Backbone.Collection(model);
                        var baton = new ext.Baton({ data: e.data.file, model: model, all: collection });
                        actionsUtil.invoke('io.ox/files/actions/viewer', baton);
                    });
                });

            });

            this.append(content);
        },

        draw: function () {
        }
    });
});
