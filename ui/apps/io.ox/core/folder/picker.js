/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/folder/picker', [
    'io.ox/core/folder/tree',
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'gettext!io.ox/core',
    'io.ox/core/capabilities'
], function (TreeView, mailAPI, api, ModalDialog, yell, gt, capabilities) {

    'use strict';

    //
    // Folder picker
    //
    // options          {object}    Picker options (see below)
    //
    //   Attributes:
    //     all          {bool}      Load all folders; special case for IMAP subscription
    //     async        {bool}      dialog in async mode
    //     addClass     {string}    dialog classes
    //     button       {string}    primary button label
    //     context      {string}    tree context, e.g. 'app' or 'popup'
    //     flat         {bool}      use flat tree (e.g. for contacts)
    //     folder       {string}    Current folder (for preselection)
    //     height       {number}    dialog height in px or rem
    //     help         {string}    contextual help reference
    //     indent       {bool}      indent first level (default is true; also needed for flat trees)
    //     last         {bool}      Prefer last folder used (needs settings and persistent)
    //     list         {array}     list of items, use first to determine first folder
    //     module       {string}    module, e.g. 'mail'
    //     hideTrashfolder {bool}   hides the trashfolder, used when saving attachments to drive see Bug 38280
    //     persistent   {string}    If string, this path is used to store open and last nodes; needs settings
    //     root         {string}    tree root id, e.g. '1'
    //     selection    {bool}      "Done" callback needs selected item (true/false)
    //     settings     {object}    app-specific settings
    //     title        {string}    dialog title / can also be DOM element(s)
    //     width        {number}    dialog width in px
    //     open         [array]     Folders to be open by default; array of IDs
    //     createFolderButton   {bool} default is true
    //
    //   Callbacks:
    //     always       {function}  Called on "ok" / no matter if a folder is selected
    //     close        {function}  Called on close
    //     customize    {function}  Customize function used for tree nodes
    //     done         {function}  Called on "ok" (and a folder is selected)
    //     initialize   {function}  Called to have access to dialog and tree
    //     show         {function}  Called on show
    //     cancel       {function]  Called on "cancel"

    return function (options) {

        var o = _.extend({
            // attributes
            all: false,
            async: false,
            addClass: 'zero-padding',
            button: gt('Ok'),
            context: 'popup',
            flat: false,
            height: '15.625rem',
            indent: true,
            module: 'mail',
            persistent: false,
            hideTrashfolder: false,
            root: '1',
            open: [],
            selection: true,
            title: gt('Select folder'),
            // callbacks
            always: $.noop,
            done: $.noop,
            filter: $.noop,
            customize: $.noop,
            disable: function (data) {
                return /^virtual\//.test(data.id);
            },
            initialize: $.noop,
            close: $.noop,
            show: $.noop,
            alternative: $.noop,
            cancel: $.noop,
            create: $.noop,
            createFolderButton: true,
            realNames: false
        }, options);

        function create() {
            var parentview = tree.getNodeView(tree.selection.get() || tree.root);
            require(['io.ox/core/folder/actions/add'], function (add) {
                // request and open create-folder-dialog
                add(mapIds(parentview.folder, true), { module: o.module === 'calendar' ? 'event' : o.module }).then(
                    function (data) {
                        // high delay because of tree nodes debounced onSort handler
                        _.delay(function () {
                            tree.selection.set(data.id);
                            var parentNode = tree.getNodeView(data.folder_id),
                                node = tree.getNodeView(data.id);
                            // open parent folder first new folder may be a subfolder of a non opened folder, or the first subfolder of this folder
                            if (parentNode) parentNode.toggle(true);
                            // use focus so we get the blue border instead of only the grey one, confuses users otherwise
                            if (node) node.$el.focus();
                        }, 300);
                    }
                );
            });
        }
        function mapIds(id, isCreate) {
            if (tree.flat) {
                // in flat folder views new folders are always created in the root folder
                return isCreate ? api.getDefaultFolder(tree.module) : id;
            }
            if (id === 'virtual/myfolders') {
                return api.altnamespace ? 'default0' : 'default0' + mailAPI.separator + 'INBOX';
            }
            return id;
        }
        var params = {
            async: o.async,
            width: o.width,
            title: o.title,
            point: 'io.ox/core/folder/picker',
            help: o.help
        };
        if (_.isBoolean(o.autoFocusOnIdle)) _.extend(params, { autoFocusOnIdle: o.autoFocusOnIdle });
        var dialog = new ModalDialog(params)
            .build(function () {
                this.$el.addClass('folder-picker-dialog ' + o.addClass);
            })
            .addCancelButton();

        if (!(capabilities.has('guest') && o.flat) && o.createFolderButton) {
            dialog.addButton({ action: 'create', label: o.createFolderText || gt('Create folder'), placement: 'left', className: 'btn-default' });
        }

        dialog.addButton({ action: 'ok', label: o.button ? o.button : gt('Ok') });

        if (o.alternativeButton) {
            dialog.addButton({ action: 'alternative', label: o.alternativeButton, placement: 'left', className: 'btn-default' });
        }
        dialog.$body.css({ height: o.height });

        var id = o.folder || api.getDefaultFolder(o.module);

        if (id === undefined && o.settings && _.isString(o.persistent)) {
            id = o.settings.get(o.persistent + '/last');
        }
        dialog.$el.find('.modal-dialog').css('max-width', '800px');
        // get open nodes
        var open = o.settings && _.isString(o.persistent) ? o.settings.get(o.persistent + '/open', []) : [];

        var tree = new TreeView({
            folderBase: o.folderBase,
            all: o.all,
            context: o.context,
            filter: o.filter,
            flat: !!o.flat,
            // no links like my contact data or subscibre calendar in picker
            noLinks: true,
            // select events usually are debounced by 300ms. This creates issues with the disabled function being called to late (users can select disabled folders this way)
            instantTrigger: true,
            indent: o.indent,
            module: o.module,
            abs: o.abs,
            open: ['1'].concat(o.open, open),
            root: o.root,
            customize: o.customize,
            disable: o.disable,
            hideTrashfolder: o.hideTrashfolder,
            // highlight current selection
            highlight: true,
            realNames: options.realNames,
            highlightclass: _.device('smartphone') ? 'visible-selection-smartphone' : 'visible-selection'
        });

        if (o.settings && _.isString(o.persistent)) {
            tree.on('open close', function () {
                var open = this.getOpenFolders();
                o.settings.set(o.persistent + '/open', open).save();
            });
            tree.on('change', function (id) {
                o.settings.set(o.persistent + '/last', id).save();
            });
            tree.on('afterAppear', function () {
                _.defer(function () {
                    if (tree.disposed) return;
                    tree.$('.tree-container .selectable.selected').focus().trigger('click');
                });
            });
        }

        // respond to invalid selection
        if (o.selection) {

            tree.on('change virtual', function (id) {
                var original = id;
                id = mapIds(id);
                var model = api.pool.getModel(id), data = model.toJSON();
                dialog.$footer.find('.btn-primary[data-action="ok"]').prop('disabled', !!o.disable(data, undefined, id !== original ? original : undefined));

                // check create folder button too
                // special case: default0 with altnamespace
                var canCreate = data.id === 'default0' && api.altnamespace;
                canCreate = (this.flat || (canCreate || model.can('create:folder')) && !model.is('trash'));
                dialog.$footer.find('.btn-default[data-action="create"]').prop('disabled', !canCreate);
            });

            dialog.$footer.find('.btn-primary[data-action="ok"],.btn-default[data-action="create"]').prop('disabled', true);
        }

        o.initialize(dialog, tree);

        return dialog
            .inject({
                renderTree: function () {
                    (id ? api.path(id) : $.Deferred().reject())
                    .then(
                        function success(path) {
                            tree.open = _.union(tree.open, _(path).pluck('id'));
                            if (id) tree.preselect(id);
                        },
                        function fail() {
                            if (!o.settings || !_.isString(o.persistent)) return;
                            o.settings.set(o.persistent + '/last', undefined).save();
                        }
                    )
                    // path might fail so we use always to continue
                    .always(function () {
                        dialog.idle();
                        dialog.$body.prepend(tree.render().$el);
                        o.show(dialog, tree);
                    });
                    return this;
                }
            })
            .on('ok', function () {
                var id = tree.selection.get();
                if (id) {
                    var mappedId = mapIds(id), data = api.pool.getModel(id).toJSON();
                    if (!!o.disable(data, undefined, mappedId !== id ? id : undefined)) {
                        yell('error', gt('You cannot select this folder.'));
                        return dialog.idle();
                    }
                    o.done(id, dialog, tree);
                }
                o.always(dialog, tree);
                o.close(dialog, tree);
            })
            .on('alternative', function () {
                o.alternative(dialog, tree);
            })
            .on('cancel', o.cancel)
            .on('close', o.close)
            .on('create', create)
            .renderTree()
            .open();
    };
});
