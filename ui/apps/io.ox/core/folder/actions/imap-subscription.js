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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/imap-subscription',
    ['io.ox/core/folder/api',
     'io.ox/core/folder/picker',
     'io.ox/core/http',
     'gettext!io.ox/core'
    ], function (api, picker, http, gt) {

    'use strict';

    return function () {

        var previous = {}, changes = {};

        function check(id, state) {
            if (state !== previous[id]) changes[id] = state; else delete changes[id];
        }

        function change() {
            check($(this).val(), $(this).prop('checked'));
        }

        function keypress(e) {
            if (e.which !== 32 || e.isDefaultPrevented()) return;
            e.preventDefault();
            var node = $(this).find('input:checkbox').first(), state = node.prop('checked');
            // skip if checkbox is disabled
            if (node.prop('disabled')) return;
            node.prop('checked', !state);
        }

        picker({

            all: true,
            addClass: 'zero-padding subscribe-imap-folder',
            button: gt('Save'),
            context: 'subscribe',
            height: 300,
            module: 'mail',
            title: gt('Subscribe IMAP folders'),

            always: function () {

                http.pause();

                var affectedFolders = _(changes).map(function (state, id) {
                    // update flag
                    api.update(id, { subscribed: state }, { silent: true });
                    // get parent folder id
                    var model = api.pool.getModel(id);
                    return model.get('folder_id');
                });

                // reload affected folders
                _(affectedFolders).chain().uniq().each(function (id) {
                    api.list(id, { cache: false });
                });

                http.resume();
            },

            customize: function (baton) {

                var data = baton.data,
                    virtual = /^virtual/.test(data.id),
                    // top-level folder of external accounts don’t have imap-subscribe capability :\
                    disabled = virtual || !api.can('subscribe:imap', data);

                previous[data.id] = data.subscribed;

                this.find('.folder-label').before(
                    $('<label class="folder-checkbox">').append(
                        $('<input type="checkbox">')
                            .prop({ checked: data.subscribed, disabled: disabled })
                            .on('change', change).val(data.id)
                    )
                );

                this.on('keypress', keypress);
            },

            close: function () {
                previous = changes = null;
            }
        });
    };
});
