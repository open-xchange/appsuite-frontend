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

define('io.ox/core/folder/picker',
    ['io.ox/core/folder/tree',
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
    //     async        {bool}      dialog in async mode
    //     addClass     {string}    dialog classes
    //     context      {string}    tree context, e.g. 'app' or 'popup'
    //     button       {string}    primary button label
    //     flat         {bool}      use flat tree (e.g. for contacts)
    //     height       {number}    height in px
    //     indent       {bool}      indent first level (default is true; also needed for flat trees)
    //     list         {array}     list of items
    //     module       {string}    module, e.g. 'mail'
    //     persistent   {string}    If string, this path is used to store open and last nodes; needs settings
    //     root         {string}    tree root id, e.g. '1'
    //     settings     {object}    app-specific settings
    //     title        {string}    dialog title
    //
    //   Callbacks:
    //     commit       {function}  Called on "ok" (and a folder is selected)
    //     close        {function}  Called on close
    //     customize    {function}  Customize function used for tree nodes
    //     show         {function}  Called on show

    return function (options, callback) {

        var o = _.extend({
            async: false,
            addClass: 'zero-padding',
            button: gt('Ok'),
            commit: $.noop,
            context: 'popup',
            customize: $.noop,
            flat: false,
            height: 250,
            indent: true,
            module: 'mail',
            title: gt('Select folder'),
            persistent: false,
            root: '1'
        }, options);

        var dialog = new dialogs.ModalDialog({ async: o.async, addClass: o.addClass })
            .header(
                $('<h4>').append(
                    _.isString(o.title) ? $.txt(o.title) : o.title
                )
            )
            .addPrimaryButton('ok', o.button, 'ok', { tabIndex: '1' })
            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: '1' });

        dialog.getBody().css({ height: o.height });

        var id;

        // determine initial folder
        if (o.folder) {
            id = o.folder;
        } else if (o.list) {
            id = String(o.list[0].folder_id);
            if (o.settings && _.isString(o.persistent)) {
                id = o.settings.get(o.persistent + '/last') || id;
            }
        }

        // get open nodes
        var open = o.settings && _.isString(o.persistent) ? o.settings.get(o.persistent + '/open', []) : [];

        var tree = new TreeView({
            context: o.context,
            flat: !!o.flat,
            indent: o.indent,
            module: o.module,
            open: open,
            root: o.root,
            customize: o.customize
        });

        if (_.isFunction(callback)) callback(dialog, tree);

        if (o.settings && _.isString(o.persistent)) {
            tree.on('open close', function () {
                var open = this.getOpenFolders();
                o.settings.set(o.persistent + '/open', open).save();
            });
            tree.on('change', function (id) {
                o.settings.set(o.persistent + '/last', id).save();
            });
        }

        return dialog
            .on('ok', function () {
                var id = tree.selection.get();
                if (id) o.commit(id);
            })
            .show(function () {
                dialog.getBody().busy();
                api.path(id).done(function (path) {
                    tree.open = _.union(tree.open, _(path).pluck('id'));
                    if (id) tree.preselect(id);
                    dialog.getBody().idle().focus().append(tree.render().$el);
                    if (_.isFunction(o.show)) o.show();
                });
            })
            .done(function () {
                if (_.isFunction(o.close)) o.close();
                tree = dialog = null;
            });
    };
});
