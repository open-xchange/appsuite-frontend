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

define.async('io.ox/mail/mailfilter/settings/filter/actions/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mailfilter',
    'io.ox/backbone/mini-views',
    'io.ox/mail/mailfilter/settings/filter/actions/util',
    'io.ox/core/folder/picker',
    'io.ox/core/api/mailfilter',
    'io.ox/core/capabilities',
    'settings!io.ox/mail'

], function (ext, gt, mini, util, picker, api, capabilities, settings) {

    'use strict';

    var defer = $.Deferred();

    function processConfig(config) {

        var getIdList = function () {
            var list = {};
            _.each(config.actioncmds, function (val) {
                list[val.id] = val;
            });
            return list;
        };

        var supportedActions = getIdList();

        if (supportedActions.addflags) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'addflags',

                index: 400,

                initialize: function (opt) {
                    var defaults = {
                            'markmail': {
                                'flags': ['\\seen'],
                                'id': 'addflags'
                            },
                            'tag': {
                                'flags': ['$'],
                                'id': 'addflags'

                            },
                            'flag': {
                                'flags': ['$cl_1'],
                                'id': 'addflags'
                            }
                        },
                        translations = {
                            'markmail': gt('Mark mail as'),
                            'tag': gt('Add IMAP keyword')
                        };

                    if (settings.get('features/flag/color')) translations.flag = gt('Set color flag');

                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, translations);
                    _.extend(opt.actionCapabilities, { 'markmail': 'addflags', 'tag': 'addflags', 'flag': 'addflags' });

                    opt.actionsOrder.push('markmail', 'tag');
                    if (settings.get('features/flag/color')) opt.actionsOrder.push('flag');

                },

                draw: function (baton, actionKey, amodel, filterValues, action) {

                    var inputId,
                        flagValues = {
                            '\\deleted': gt('deleted'),
                            '\\seen': gt('seen'),
                            '\\flagged': gt('flagged')
                        },
                        COLORS = {
                            NONE: { value: 0, text: gt('None') },
                            RED: { value: 1, text: gt('Red') },
                            ORANGE: { value: 7, text: gt('Orange') },
                            YELLOW: { value: 10, text: gt('Yellow') },
                            LIGHTGREEN: { value: 6, text: gt('Light green') },
                            GREEN: { value: 3, text: gt('Green') },
                            LIGHTBLUE: { value: 9, text: gt('Light blue') },
                            BLUE: { value: 2, text: gt('Blue') },
                            PURPLE: { value: 5, text: gt('Purple') },
                            PINK: { value: 8, text: gt('Pink') },
                            GRAY: { value: 4, text: gt('Gray') }
                        },

                        COLORFLAGS = {
                            '$cl_1': '1',
                            '$cl_2': '2',
                            '$cl_3': '3',
                            '$cl_4': '4',
                            '$cl_5': '5',
                            '$cl_6': '6',
                            '$cl_7': '7',
                            '$cl_8': '8',
                            '$cl_9': '9',
                            '$cl_10': '10'
                        };

                    if (/delete|seen/.test(action.flags[0])) {
                        inputId = _.uniqueId('markas_');
                        this.append(
                            util.drawAction({
                                actionKey: actionKey,
                                inputId: inputId,
                                title: baton.view.actionsTranslations.markmail,
                                dropdownOptions: { name: 'flags', model: amodel, values: flagValues, id: inputId }
                            })
                        );
                    } else if (/^\$cl/.test(action.flags[0])) {
                        inputId = _.uniqueId('colorflag_');
                        this.append($('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': actionKey }).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.actionsTranslations.flag)
                            ),
                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-3 col-sm-offset-9 rightalign').append(
                                        util.drawColorDropdown(action.flags[0], COLORS, COLORFLAGS)
                                    )
                                )
                            ),
                            util.drawDeleteButton('action')
                        ));
                    } else {
                        inputId = _.uniqueId('customflag_');
                        this.append(
                            util.drawAction({
                                actionKey: actionKey,
                                inputId: inputId,
                                title: baton.view.actionsTranslations.tag,
                                inputLabel: baton.view.actionsTranslations.tag,
                                inputOptions: { name: 'flags', model: amodel, className: 'form-control', id: inputId },
                                errorView: true
                            })
                        );
                    }
                }

            });
        }

        if (supportedActions.setflags) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'setflags',

                index: 900,

                initialize: function (opt) {
                    var defaults = {
                        'setflags': {
                            'flags': [''],
                            'id': 'setflags'
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, { 'setflags': gt('Set IMAP keywords') });
                    _.extend(opt.actionCapabilities, { 'setflags': 'setflags' });

                    opt.actionsOrder.push('setflags');
                },

                draw: function (baton, actionKey, amodel) {
                    var inputId = _.uniqueId('setflags_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations.setflags,
                            inputLabel: baton.view.actionsTranslations.setflags,
                            inputOptions: { name: 'setflags', model: amodel, className: 'form-control', id: inputId },
                            errorView: true
                        })
                    );
                }
            });
        }

        if (supportedActions.removeflags) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'removeflags',

                index: 1000,

                initialize: function (opt) {
                    var defaults = {
                        'removeflags': {
                            'flags': ['$'],
                            'id': 'removeflags'

                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'removeflags': gt('Remove IMAP keyword')
                    });

                    _.extend(opt.actionCapabilities, { 'removeflags': 'removeflags' });

                    if (_.indexOf(opt.actionsOrder, 'tag') !== -1) opt.actionsOrder.push(_.first(opt.actionsOrder.splice(_.indexOf(opt.actionsOrder, 'tag'), 1)));
                    opt.actionsOrder.push('removeflags');
                },

                draw: function (baton, actionKey, amodel) {
                    var inputId = _.uniqueId('removeflags_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations.removeflags,
                            inputLabel: baton.view.actionsTranslations.removeflags,
                            inputOptions: { name: 'flags', model: amodel, className: 'form-control', id: inputId },
                            errorView: true
                        })
                    );
                }

            });
        }

        if (supportedActions.discard) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'discard',

                index: 600,

                initialize: function (opt) {
                    var defaults = {
                        'discard': {
                            'id': 'discard'
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'discard': gt('Discard')
                    });

                    _.extend(opt.actionCapabilities, { 'discard': 'discard' });

                    opt.actionsOrder.push('discard');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {
                    var inputId = _.uniqueId('discard_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            addClass: 'warning',
                            title: baton.view.actionsTranslations[action.id]
                        })
                    );
                }

            });
        }

        if (supportedActions.keep) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'keep',

                index: 800,

                initialize: function (opt) {
                    var defaults = {
                        'keep': {
                            'id': 'keep'
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'keep': gt('Keep')
                    });

                    _.extend(opt.actionCapabilities, { 'keep': 'keep' });

                    opt.actionsOrder.push('keep');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {
                    var inputId = _.uniqueId('keep_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id]
                        })
                    );
                }

            });
        }

        if (supportedActions.guard_encrypt && capabilities.has('guard-mail')) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'guard_encrypt',

                index: 700,

                initialize: function (opt) {
                    var defaults = {
                        'guard_encrypt': {
                            'id': 'guard_encrypt'
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'guard_encrypt': gt('Encrypt the email')
                    });

                    _.extend(opt.actionCapabilities, { 'guard_encrypt': 'guard_encrypt' });

                    opt.actionsOrder.push('guard_encrypt');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {
                    var inputId = _.uniqueId('guard_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id]
                        })
                    );
                }

            });
        }

        if (supportedActions.move) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'move',

                index: 100,

                initialize: function (opt) {
                    var defaults = {
                        'move': {
                            'id': 'move',
                            'into': 'default0/INBOX'
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        //#. File a message into a folder
                        'move': gt('File into')
                    });

                    _.extend(opt.actionCapabilities, { 'move': 'move' });

                    opt.actionsOrder.push('move');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {

                    function onFolderSelect(e) {
                        e.preventDefault();

                        var model = $(e.currentTarget).data('model');

                        baton.view.dialog.pause();

                        picker({
                            async: true,
                            context: 'filter',
                            done: function (id, dialog) {
                                model.set('into', id);
                                dialog.close();
                            },
                            folder: model.get('into'),
                            module: 'mail',
                            root: '1',
                            settings: settings,
                            persistent: 'folderpopup',
                            //#. 'Select' as button text to confirm the selection of a chosen folder via a picker dialog.
                            button: gt('Select')
                        });
                    }

                    var inputId = _.uniqueId('move_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id],
                            activeLink: true,
                            inputLabel: baton.view.actionsTranslations[action.id],
                            inputOptions: { name: 'into', model: amodel, className: 'form-control', id: inputId }
                        })
                    );
                    this.find('[data-action-id="' + actionKey + '"] .folderselect').on('click', onFolderSelect);
                }

            });
        }

        if (supportedActions.copy) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'copy',

                index: 200,

                initialize: function (opt) {
                    var defaults = {
                        'copy': {
                            'id': 'copy',
                            'into': 'default0/INBOX',
                            'copy': true
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        //#. Copy a message into a folder
                        'copy': gt('Copy into')
                    });

                    _.extend(opt.actionCapabilities, { 'copy': 'copy' });

                    opt.actionsOrder.push('copy');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {

                    function onFolderSelect(e) {
                        e.preventDefault();

                        var model = $(e.currentTarget).data('model');

                        baton.view.dialog.pause();

                        picker({
                            async: true,
                            context: 'filter',
                            done: function (id, dialog) {
                                model.set('into', id);
                                dialog.close();
                            },
                            folder: model.get('into'),
                            module: 'mail',
                            root: '1',
                            settings: settings,
                            persistent: 'folderpopup',
                            //#. 'Select' as button text to confirm the selection of a chosen folder via a picker dialog.
                            button: gt('Select')
                        });
                    }

                    var inputId = _.uniqueId('copy_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id],
                            activeLink: true,
                            inputLabel: baton.view.actionsTranslations[action.id],
                            inputOptions: { name: 'into', model: amodel, className: 'form-control', id: inputId }
                        })
                    );
                    this.find('[data-action-id="' + actionKey + '"] .folderselect').on('click', onFolderSelect);
                }

            });
        }

        if (supportedActions.redirect) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'redirect',

                index: 300,

                initialize: function (opt) {
                    var defaults = {
                        'redirect': {
                            'id': 'redirect',
                            'to': ''
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'redirect': gt('Redirect to')
                    });

                    _.extend(opt.actionCapabilities, { 'redirect': 'redirect' });

                    opt.actionsOrder.push('redirect');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {
                    var inputId = _.uniqueId('redirect_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id],
                            inputLabel: baton.view.actionsTranslations.redirect,
                            inputOptions: { name: 'to', model: amodel, className: 'form-control', id: inputId },
                            errorView: true
                        })
                    );
                }

            });
        }

        if (supportedActions.reject) {
            ext.point('io.ox/mail/mailfilter/actions').extend({

                id: 'reject',

                index: 700,

                initialize: function (opt) {
                    var defaults = {
                        'reject': {
                            'id': 'reject',
                            'text': ''
                        }
                    };
                    _.extend(opt.defaults.actions, defaults);
                    _.extend(opt.actionsTranslations, {
                        'reject': gt('Reject with reason')
                    });

                    _.extend(opt.actionCapabilities, { 'reject': 'reject' });

                    opt.actionsOrder.push('reject');
                },

                draw: function (baton, actionKey, amodel, filterValues, action) {
                    var inputId = _.uniqueId('reject_');
                    this.append(
                        util.drawAction({
                            actionKey: actionKey,
                            inputId: inputId,
                            title: baton.view.actionsTranslations[action.id],
                            inputLabel: baton.view.actionsTranslations.reject,
                            inputOptions: { name: 'text', model: amodel, className: 'form-control', id: inputId },
                            errorView: true
                        })
                    );
                }

            });
        }
    }

    return api.getConfig().then(processConfig).then(function () {
        defer.resolve({ processConfig: processConfig });
        return defer;
    });

});
