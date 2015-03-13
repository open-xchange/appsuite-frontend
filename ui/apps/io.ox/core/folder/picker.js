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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/picker', [
    'io.ox/core/folder/tree',
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core'
], function (TreeView, api, dialogs, gt) {

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
    //     height       {number}    dialog height in px
    //     indent       {bool}      indent first level (default is true; also needed for flat trees)
    //     last         {bool}      Prefer last folder used (needs settings and persistent)
    //     list         {array}     list of items, use first to determine first folder
    //     module       {string}    module, e.g. 'mail'
    //     persistent   {string}    If string, this path is used to store open and last nodes; needs settings
    //     root         {string}    tree root id, e.g. '1'
    //     selection    {bool}      "Done" callback needs selected item (true/false)
    //     settings     {object}    app-specific settings
    //     title        {string}    dialog title / can also be DOM element(s)
    //     width        {number}    dialog width in px
    //
    //   Callbacks:
    //     always       {function}  Called on "ok" / no matter if a folder is selected
    //     close        {function}  Called on close
    //     customize    {function}  Customize function used for tree nodes
    //     done         {function}  Called on "ok" (and a folder is selected)
    //     initialize   {function}  Called to have access to dialog and tree
    //     show         {function}  Called on show

    return function (options) {

        var o = _.extend({
            // attributes
            all: false,
            async: false,
            addClass: 'zero-padding',
            button: gt('Ok'),
            context: 'popup',
            flat: false,
            height: 250,
            indent: true,
            module: 'mail',
            persistent: false,
            root: '1',
            selection: true,
            title: gt('Select folder'),
            width: 500,
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
            alternative: $.noop
        }, options);

        var dialog = new dialogs.ModalDialog({ async: o.async, addClass: o.addClass, width: o.width })
            .header(
                $('<h4>').append(
                    _.isString(o.title) ? $.txt(o.title) : o.title
                )
            )
            .addPrimaryButton('ok', o.button, 'ok', { tabIndex: 1 })
            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 });

        if (o.alternativeButton) {
            dialog.addAlternativeButton('alternative', o.alternativeButton);
        }
        dialog.getBody().css({ height: o.height });

        var id = o.folder;

        if (id === undefined && o.settings && _.isString(o.persistent)) {
            id = o.settings.get(o.persistent + '/last');
        }

        // get open nodes
        var open = o.settings && _.isString(o.persistent) ? o.settings.get(o.persistent + '/open', []) : [];

        var tree = new TreeView({
            all: o.all,
            context: o.context,
            filter: o.filter,
            flat: !!o.flat,
            indent: o.indent,
            module: o.module,
            abs: o.abs,
            open: open,
            root: o.root,
            customize: o.customize,
            disable: o.disable,
            // highlight current selection
            highlight: true,
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
        }

        // respond to invalid selection
        if (o.selection) {

            tree.on('change virtual', function (id) {
                var model = api.pool.getModel(id), data = model.toJSON();
                dialog.getFooter().find('.btn-primary[data-action="ok"]').prop('disabled', !!o.disable(data));
            });

            dialog.getFooter().find('.btn-primary[data-action="ok"]').prop('disabled', true);
        }

        o.initialize(dialog, tree);

        return dialog
            .on('ok', function () {
                var id = tree.selection.get();
                if (id) o.done(id, dialog, tree);
                o.always(dialog, tree);
            })
            .on('alternative', function () {
                o.alternative(dialog, tree);
            })
            .show(function () {
                dialog.getBody().busy();
                api.path(id)
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
                    // path might fail so we use always to con
                    .always(function () {
                        dialog.getBody().idle().prepend(tree.render().$el);
                        tree.$el.focus();
                        o.show(dialog, tree);
                    });
            })
            .done(function () {
                o.close(dialog, tree);
                tree = dialog = o = null;
            });
    };
});
