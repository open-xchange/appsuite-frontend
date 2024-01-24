/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/pim/actions', [
    'io.ox/core/api/attachment',
    'io.ox/core/download',
    'io.ox/files/api',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/viewer/views/types/typesutil',
    'io.ox/core/folder/api',
    'gettext!io.ox/core'
], function (attachmentAPI, downloadAPI, filesAPI, yell, ext, actionsUtil, viewerTypes, folderAPI, gt) {

    'use strict';

    var extensions = {

        // view attachment
        view: {
            collection: 'some',
            matches: function (baton) {
                return baton.array().some(function (data) {
                    var model = new filesAPI.Model(data);
                    // no view support for encrypted pim attachments
                    return !model.isEncrypted() && viewerTypes.canView(model);
                });
            },
            action: function (baton) {
                require(['io.ox/core/viewer/main'], function (Viewer) {
                    var viewer = new Viewer(),
                        // no view support for encrypted pim attachments
                        files = baton.array().filter(function (file) { return !new filesAPI.Model(file).isEncrypted(); });

                    viewer.launch({ files: files, opt: { disableFolderInfo: true, disableFileDetail: true } });
                });
            }
        },

        // download attachment
        download: {
            // browser support for downloading more than one file at once is pretty bad (see Bug #36212)
            collection: 'one',
            action: function (baton) {
                // chronos has a special download function (bonus point, it works with federated sharing)
                var item = baton.first(),
                    url = item.model && item.model.get('folder').indexOf('cal://') === 0 ? ox.apiRoot + '/chronos?' + $.param({
                        session: ox.session,
                        action: 'getAttachment',
                        folder: item.model.get('folder'),
                        id: item.model.get('id'),
                        managedId: baton.first().managedId
                    }) : attachmentAPI.getUrl(item, 'download');
                if (_.device('ios >= 11')) {
                    downloadAPI.window(url, { antivirus: true });
                } else {
                    downloadAPI.url(url);
                }
            }
        },

        // download all PIM attachments as zip
        downloadZip: {
            requires: function (e) {
                return e.collection.has('multiple');
            },
            multiple: function (list) {
                // chronos has it's own multiple download
                if (list[0].model && list[0].model.get('folder').indexOf('cal://') === 0) return downloadAPI.chronosMultiple(list[0].model);

                var param = {
                    folder: list[0].folder,
                    module: list[0].module,
                    attached: list[0].attached
                };
                downloadAPI.pimAttachments(list, param);
            }
        },

        // save attachment
        save: {
            capabilities: 'infostore',
            collection: 'some',
            matches: function (baton) {
                if (!baton.first().model) return true;
                var folder = folderAPI.pool.getModel(baton.first().model.get('folder'));
                return !folder.is('federated-sharing');
            },
            action: function (baton) {
                // cannot be converted to multiple request because of backend bug (module overides params.module)
                baton.array().forEach(function (data) {
                    attachmentAPI.save(data);
                });
                setTimeout(function () {
                    yell('success', gt('Attachments have been saved'));
                }, 300);
            }
        }
    };

    var titles = {
        //#. used as a verb here. label of a button to view attachments
        view: gt('View'),
        download: gt('Download'),
        downloadZip: gt('Download'),
        //#. %1$s is usually "Drive" (product name; might be customized)
        save: gt('Save to %1$s', gt.pgettext('app', 'Drive'))
    };

    // and let's define all points right now
    var index = 0, Action = actionsUtil.Action;
    _(extensions).each(function (extension, id) {
        // define action
        var ref = 'io.ox/core/tk/actions/' + id + '-attachment';
        new Action(ref, extension);
        // define default link
        ext.point('io.ox/core/tk/attachment/links').extend({
            id: id,
            index: index += 100,
            title: titles[id],
            mobile: 'hi',
            ref: ref
        });
    });

    return extensions;
});
