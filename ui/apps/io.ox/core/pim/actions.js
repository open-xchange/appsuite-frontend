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
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/viewer/views/types/typesregistry',
    'gettext!io.ox/core'
], function (attachmentAPI, downloadAPI, filesAPI, yell, ext, actions, links, viewerTypes, gt) {

    'use strict';

    var extensions = {

        // view attachment
        view: {
            requires: function (e) {
                if (!e.collection.has('some')) { return false; }

                var attachments = _.isArray(e.baton.data) ? e.baton.data : [e.baton.data];
                var canView = _.some(attachments, function (data) {
                    var model = new filesAPI.Model(data);
                    return viewerTypes.canView(model);
                });

                return canView;
            },
            multiple: function (baton) {
                require(['io.ox/core/viewer/main'], function (Viewer) {
                    var viewer = new Viewer();
                    viewer.launch({ files: baton, opt: { disableFolderInfo: true, disableFileDetail: true } });
                });
            }
        },

        // download attachment
        download: {
            requires: function (e) {
                // browser support for downloading more than one file at once is pretty bad (see Bug #36212)
                return e.collection.has('one');
            },
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'download');
                if (_.device('ios >= 11') || _.device('android')) {
                    downloadAPI.window(url);
                } else {
                    downloadAPI.url(url);
                }
            }
        },

        // save attachment
        save: {
            capabilities: 'infostore',
            requires: 'some',
            multiple: function (list) {
                // cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentAPI.save(data);
                });
                setTimeout(function () {
                    yell('success', gt('Attachments have been saved!'));
                }, 300);
            }
        }
    };

    var labels = {
        //#. used as a verb here. label of a button to view attachments
        view: gt('View'),
        download: gt('Download'),
        //#. %1$s is usually "Drive" (product name; might be customized)
        save: gt('Save to %1$s', gt.pgettext('app', 'Drive'))
    };

    // and let's define all points right now
    var index = 0;
    _(extensions).each(function (extension, id) {

        // define action
        var ref = 'io.ox/core/tk/actions/' + id + '-attachment';
        new actions.Action(ref, extension);

        // define default link
        ext.point('io.ox/core/tk/attachment/links').extend(new links.Link({
            id: id,
            index: index += 100,
            label: labels[id],
            mobile: 'hi',
            ref: ref
        }));
    });

    return extensions;
});
