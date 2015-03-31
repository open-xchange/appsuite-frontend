/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/pim/actions', [
    'io.ox/core/api/attachment',
    'io.ox/core/download',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'gettext!io.ox/core'
], function (attachmentAPI, downloadAPI, yell, ext, actions, links, gt) {

    'use strict';

    var extensions = {

        // open attachment
        open: {
            id: 'open',
            requires: 'one',
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'view');
                window.open(url);
            }
        },

        // download attachment
        download: {
            id: 'download',
            requires: function (e) {
                // browser support for downloading more than one file at once is pretty bad (see Bug #36212)
                return e.collection.has('one') && _.device('!ios');
            },
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'download');
                downloadAPI.url(url);
            }
        },

        // save attachment
        save: {
            id: 'save',
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
        open: gt('Open in browser'),
        download: gt('Download'),
        save: gt('Save to Drive')
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
