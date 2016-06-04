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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/copyMove', [
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/core/capabilities'
], function (api, folderAPI, ext, settings, gt, capabilities) {

    'use strict';

    return {

        multiple: function (o) {
            require(['io.ox/core/folder/actions/move'], function (move) {
                var folderId, createRule;
                function generateRule() {
                    require(['io.ox/mail/mailfilter/settings/filter'
                    ], function (filter) {

                        filter.initialize().then(function (data, config, opt) {
                            var factory = opt.model.protectedMethods.buildFactory('io.ox/core/mailfilter/model', opt.api),
                                args = { data: { obj: factory.create(opt.model.protectedMethods.provideEmptyModel()) } },
                                preparedTest;

                            args.data.obj.set('actioncmds', [{ id: 'move', into: folderId }]);
                            if (senderList.length > 1) {
                                preparedTest = { id: 'anyof', tests: [] };
                                _.each(senderList, function (item) {
                                    preparedTest.tests.push({ comparison: 'contains', headers: ['From'], id: 'header', values: [item] });
                                });
                            } else {
                                preparedTest = { comparison: 'contains', headers: ['From'], id: 'header', values: [senderList[0]] };
                            }

                            args.data.obj.set('test', preparedTest);

                            ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', undefined, args, config[0]);
                        });
                    });
                }

                var senderList = _.chain(folderAPI.ignoreSentItems(o.list))
                .map(function (obj) { return obj.from[0][1]; })
                .uniq()
                .value();

                move.item({
                    all: o.list,
                    api: api,
                    button: o.label,
                    list: folderAPI.ignoreSentItems(o.list),
                    module: 'mail',
                    root: '1',
                    settings: settings,
                    success: o.success,
                    target: o.baton.target,
                    title: o.label,
                    type: o.type,
                    pickerInit: function (dialog, tree) {

                        var notification = $('<div class="help-block">'),
                            singleSenderText = gt('All future messages from %1$s will be moved to the selected folder.', senderList[0]),
                            multipleSenderText = gt('All future messages from the senders of the selected mails will be moved to the selected folder.'),
                            infoText = senderList.length <= 1 ? singleSenderText : multipleSenderText,
                            checkbox;

                        if (capabilities.has('mailfilter')) {
                            dialog.addCheckbox(gt('Create filter rule'), 'create-rule', false);

                            checkbox = dialog.getFooter().find('[data-action="create-rule"]');
                            tree.on('change', function (id) {
                                if (id.split('/')[0] !== 'default0') {
                                    checkbox.prop({ 'checked': false, 'disabled': true });
                                    checkbox.closest('.checkbox').addClass('disabled');
                                    notification.empty();
                                } else {
                                    checkbox.prop('disabled', false);
                                    checkbox.closest('.checkbox').removeClass('disabled');
                                }
                            });

                            checkbox.on('change', function () {
                                createRule = $(this).prop('checked');

                                if (createRule) {
                                    notification.text(infoText);
                                } else {
                                    notification.empty();
                                }
                            });
                        }

                        dialog.getFooter().prepend(notification);
                        dialog.on('ok', function () {
                            folderId = tree.selection.get();
                        });
                    },
                    pickerClose: function () {
                        if (o.type === 'move' && createRule && folderId) {
                            generateRule();
                        }
                    }
                });
            });
        }
    };
});
