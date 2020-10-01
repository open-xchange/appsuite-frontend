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

define('io.ox/core/pim/actions', [
    'io.ox/core/api/attachment',
    'io.ox/core/download',
    'io.ox/files/api',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/viewer/views/types/typesutil',
    'gettext!io.ox/core'
], function (attachmentAPI, downloadAPI, filesAPI, yell, ext, actionsUtil, viewerTypes, gt) {

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
                var url = attachmentAPI.getUrl(baton.first(), 'download');
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
