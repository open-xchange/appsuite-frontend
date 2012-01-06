/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/foldertree',
    ['io.ox/core/tk/selection', 'io.ox/core/api/folder'], function (Selection, api) {

    'use strict';

    var PATH = ox.base + '/apps/themes/default/icons/',
        DEFAULT = PATH + 'folder-default.png',
        OPEN = 'url(' + PATH + 'folder-open.png)',
        CLOSE = 'url(' + PATH + 'folder-close.png)',

        tmplFolder = $('<div>').addClass('folder selectable').css('paddingLeft', '13px'),
        tmplSub = $('<div>').addClass('subfolders').hide();

    /**
     * Tree node class
     */
    function TreeNode(tree, id, level) {

        // load folder data immediately
        var ready = api.get({ folder: id }),
            nodes = { folder: null, sub: null },
            children = null,
            hasChildren = false,
            painted = false,
            open = false,
            self = this,

            // internal functions
            skip = function () {
                return tree.root === self && tree.options.skipRoot;
            },

            paintChildren = function () {
                return self.loadChildren()
                    .pipe(function (children) {
                        // tricky one liner: we invoke 'paint' for all child nodes.
                        // invoke returns a nice array of all returns values which are deferred objects.
                        // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                        // that will be resolved once all child nodes are resolved.
                        return $.when.apply(null, _(children).invoke('paint', nodes.sub.busy().show()));
                    });
            },

            updateArrow = function (node) {
                var isOpen = hasChildren && (skip() || open),
                    image = hasChildren ? (isOpen ? CLOSE : OPEN) : 'none';
                node = node || nodes.folder.find('.folder-arrow');
                node.css('backgroundImage', image);
            },

            // open/close tree node
            toggleState = function (e) {
                e.preventDefault();
                if (hasChildren) {
                    if (open) {
                        open = false;
                        nodes.sub.hide();
                        updateArrow();
                    } else {
                        open = true;
                        nodes.sub.show();
                        updateArrow();
                        if (children === null) {
                            paintChildren();
                        }
                    }
                }
            };

        // get sub folders
        this.getChildren = function () {
            return children;
        };

        // load sub folders - creates instances of TreeNode - does not yet paint them
        this.loadChildren = function () {
            if (children === null) {
                return api.getSubFolders({ folder: id })
                    .pipe(function (data) {
                        return (
                            children = _(data)
                                .chain()
                                .select(function (folder) {
                                    // ignore system folders without sub folders, e.g. 'Shared folders'
                                    return folder.module !== 'system' || folder.subfolders;
                                })
                                .map(function (folder) {
                                    return new TreeNode(tree, folder.id, skip() ? level : level + 1);
                                })
                                .value()
                        );
                    });
            } else {
                return $.Deferred().resolve(children);
            }
        };

        this.customize = function (nodes, data) {

            var src;

            switch (data.id) {
            case 'default0/INBOX':
                src = PATH + 'inbox.png';
                break;
            case 'default0/INBOX/Trash':
                src = PATH + 'trash.png';
                break;
            case 'default0/INBOX/Sent Items':
                src = PATH + 'outbox.png';
                break;
            case '6':
                src = PATH + 'user.png';
                break;
            default:
                src = DEFAULT;
                break;
            }

            // fade out?
            if (tree.options.type && tree.options.type !== data.module) {
                nodes.folder.addClass('greyed-out');
            }

            // set icon
            nodes.icon.attr('src', src);
            // set title
            nodes.label.text(data.title + '');
        };

        // paint tree node - loads and paints sub folder if open
        this.paint = function (container) {

            nodes.folder = tmplFolder.clone().on('dblclick', toggleState);

            if (level > 0) {
                nodes.folder.css('paddingLeft', (13 + level * 22) + 'px');
            }

            nodes.sub = tmplSub.clone();

            if (skip()) {
                nodes.folder.hide();
            }

            return ready
                .pipe(function (data) {
                    // vars
                    hasChildren = data.subfolders || data.subscr_subflds;
                    open = open || (data.module === 'system' || data.module === tree.options.type);
                    var isOpen = hasChildren && (skip() || open),
                        def;
                    // create DOM nodes
                    updateArrow(
                        nodes.arrow = $('<div>').addClass('folder-arrow')
                        .on('click', toggleState)
                    );
                    nodes.icon = $('<img>', { src: '', alt: '' }).addClass('folder-icon');
                    nodes.label = $('<span>').addClass('folder-label');
                    // counter (mail only)
                    if (tree.options.type === 'mail' && data.total !== undefined) {
                        nodes.counter = $('<span>').addClass('folder-counter').text(data.total);
                    } else {
                        nodes.counter = $();
                    }
                    // work with selection
                    nodes.folder.attr('data-obj-id', data.id);
                    tree.selection.addToIndex(data);
                    // customize & append
                    self.customize(nodes, data);
                    // draw children
                    def = isOpen ? paintChildren() : $.when();
                    // add to DOM
                    nodes.folder.append(nodes.arrow, nodes.icon, nodes.counter, nodes.label);
                    container.append(nodes.folder, nodes.sub);
                    // Done
                    return def;
                })
                .done(function () {
                    container.idle();
                    container = null;
                    painted = true;
                });
        };
    }

    /**
     * Folder tree class
     */
    function FolderTree(container, opt) {

        this.options = _.extend({
                rootFolderId: '1',
                skipRoot: true,
                type: null
            }, opt);

        // painting
        var painting = null,
            // ref
            self = this;

        this.root = new TreeNode(this, this.options.rootFolderId, 0);
        this.container = $(container);

        // selection
        Selection.extend(this, this.container)
            .setMultiple(false)
            .setSerializer(function (obj) {
                return String(obj.id);
            });

        this.paint = function () {
            if (painting === null) {
                container.addClass('io-ox-foldertree').empty();
                this.selection.clearIndex();
                return (painting = this.root.paint(this.container)
                    .always(function () {
                        self.selection.update();
                        painting = null;
                    }));
            } else {
                return painting;
            }
        };
    }

    return FolderTree;

});
