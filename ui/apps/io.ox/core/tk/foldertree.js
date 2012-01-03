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
        OPEN = PATH + 'folder-open.png',
        CLOSE = PATH + 'folder-close.png';

    function TreeNode(tree, id, level) {

        // load folder data immediately
        var def = api.get({ folder: id }),
            children = null,
            open = true,
            bHideLabel = false;

        // hide label? - used by root node
        this.hideLabel = function (flag) {
            bHideLabel = !!flag;
            return this;
        };

        // get sub folders - creates instances of TreeNode - does not yet paint them
        this.getChildren = function () {
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
                                    return new TreeNode(tree, folder.id, bHideLabel ? level : level + 1);
                                })
                                .value()
                        );
                    });
            } else {
                return $.Deferred().resolve(children);
            }
        };

        this.customize = function (icon, label, data) {
            // default case
            icon.attr('src', DEFAULT);
            label.text(data.title + '');
        };

        // paint tree node - loads and paints sub folder if open
        this.paint = function (container) {

            var div = $('<div>').addClass('folder selectable')
                    .css('paddingLeft', (4 + level * 20) + 'px')
                    .appendTo(container),
                sub = $('<div>').addClass('subfolders').hide()
                    .appendTo(container),
                self = this;

            if (bHideLabel) {
                div.hide();
            }

            return def
                .pipe(function (data) {
                    // vars
                    var hasChildren = data.subfolders || data.subscr_subflds,
                        isOpen = hasChildren && open,
                        arrowBackgroundImage,
                        arrow, icon, label;
                    // which arrow?
                    arrowBackgroundImage = hasChildren ? 'url(' + (isOpen ? CLOSE : OPEN) + ')' : 'none';
                    // create DOM nodes
                    arrow = $('<div>').addClass('folder-arrow').css('backgroundImage', arrowBackgroundImage);
                    icon = $('<img>', { src: '', alt: '' }).addClass('folder-icon');
                    label = $('<span>').addClass('folder-label');
                    // work with selection
                    div.attr('data-obj-id', data.id);
                    tree.selection.addToIndex(data);
                    // customize & append
                    self.customize(icon, label, data);
                    div.append(arrow, icon, label);
                    // draw children?
                    if (isOpen) {
                        return self.getChildren()
                            .pipe(function (children) {
                                // tricky one liner: we invoke 'paint' for all child nodes.
                                // invoke returns a nice array of all returns values which are deferred objects.
                                // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                                // that will be resolved once all child nodes are resolved.
                                return $.when.apply(null, _(children).invoke('paint', sub.busy().show()));
                            });
                    } else {
                        return $.when();
                    }
                })
                .done(function () {
                    container.idle();
                    container = div = sub = self = null;
                });
        };
    }

    function FolderTree(container, opt) {

        var o = _.extend({
                root: '1'
            }, opt),
            // root node
            rootNode = new TreeNode(this, o.root, 0).hideLabel(true),
            // ref
            self = this;

        this.container = $(container);

        // selection
        Selection.extend(this, this.container)
            .setMultiple(false)
            .setSerializer(function (obj) {
                return String(obj.id);
            });

        this.paint = function () {
            container.addClass('io-ox-foldertree').empty();
            this.selection.clearIndex();
            return rootNode.paint(this.container)
                .done(function () {
                    self.selection.update();
                });
        };
    }

    return  {

        create: function (container, opt) {
            return new FolderTree(container, opt);
        }
    };
});