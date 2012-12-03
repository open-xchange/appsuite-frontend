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

define('io.ox/core/tk/folderviews',
    ['io.ox/core/tk/selection',
     'io.ox/core/api/folder',
     'io.ox/core/api/account',
     'io.ox/core/api/user',
     'io.ox/core/extensions',
     'io.ox/core/event',
     'io.ox/core/config',
     'io.ox/core/notifications',
     'io.ox/core/http',
     'gettext!io.ox/core'
    ], function (Selection, api, account, userAPI, ext, Events, config, notifications, http, gt) {

    'use strict';

    var PATH = ox.base + '/apps/themes/default/icons/',
        DEFAULT = PATH + 'folder-default.png',
        OPEN = 'url(' + PATH + 'folder-open.png)',
        CLOSE = 'url(' + PATH + 'folder-close.png)',

        tmplFolder = $('<div>').addClass('folder selectable').css('paddingLeft', '13px'),
        tmplSub = $('<div>').addClass('subfolders').hide(),

        refreshHash = {},

        TRUE = function () { return true; };

    /**
     * Tree node class
     */
    function TreeNode(tree, id, container, level, checkbox, all) {
        // load folder data immediately
        var ready = api.get({ folder: id }),
            nodes = {},
            children = null,
            painted = false,
            open,
            self = this,
            data = {},

            // custom filter
            filter = _.isFunction(tree.options.filter) ? tree.options.filter : TRUE,

            // internal functions
            skip = function () {
                return tree.root === self && tree.options.skipRoot;
            },

            hasChildren = function () {
                return children === null ? (data.subfolders || data.subscr_subflds) : !!children.length;
            },

            isOpen = function () {
                if (open === undefined) {
                    // TODO: save/restore tree state
                    open = data.id === 'default0/INBOX' ||
                        (tree.options.type === 'infostore' && data.id === '9') ||
                        (tree.options.type === 'contacts' && data.id === '2');
                    //open = (data.module === 'system' || data.module === tree.options.type);
                }
                return hasChildren() && (skip() || open);
            },

            drawChildren = function (reload, method) {
                // be busy
                nodes.sub.busy().show();
                // load
                return self.loadChildren(reload)
                    // next pipe() makes it slow for debugging
//                    .pipe(function (children) {
//                        var def = $.Deferred();
//                        setTimeout(function () {
//                            def.resolve(children);
//                        }, 1000);
//                        return def;
//                    })
                    .fail(function (error) {
                        // reset folder and show global error
                        nodes.sub.idle().hide();
                        notifications.yell(error);
                    })
                    .pipe(function (children) {
                        // tricky one liner: we invoke 'paint' for all child nodes.
                        // invoke returns a nice array of all returns values which are deferred objects.
                        // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                        // that will be resolved once all child nodes are resolved.
                        if (!children || children.length === 0) {
                            nodes.sub.idle().hide(); // Robustness. Sometimes the folder interface seems unsure about subfolders.
                            hideArrow();
                            return $.when();
                        }
                        return $.when.apply(null, _(children).invoke(method, nodes.sub));
                    });
            },

            paintChildren = function () {
                return drawChildren(false, 'paint');
            },

            repaintChildren = function () {
                return drawChildren(true, 'repaint');
            },

            updateArrow = function () {
                var image = hasChildren() ? (isOpen() ? CLOSE : OPEN) : 'none';
                nodes.arrow.css('backgroundImage', image);
            },

            hideArrow = function () {
                nodes.arrow.css('backgroundImage', 'none');
            },

            openNode = function () {
                if (!hasChildren() || open) { return $.when(); }
                open = true;
                nodes.sub.show();
                updateArrow();
                return children === null ? paintChildren() : $.when();
            },

            closeNode = function () {
                if (!hasChildren() || !open) { return; }
                open = false;
                nodes.sub.hide();
                updateArrow();
            },

            // open/close tree node
            toggleState = function (e) {
                // not valid click?
                if (e.type !== 'dblclick' && $(this).hasClass('selectable')) {
                    return;
                }
                e.preventDefault();
                if (!open) { openNode(); } else { closeNode(); }
            };

        // make accessible
        this.id = String(id);

        // store in hash for quick access
        tree.treeNodes[this.id] = this;

        // open & close
        this.open = openNode;
        this.close = closeNode;

        // get sub folders
        this.getChildren = function () {
            return children;
        };

        this.removeChild = function (treeNode) {
            children = _(children).without(treeNode);
            updateArrow();
        };

        this.refresh = function (newId, changed) {
            // might have a new id
            id = newId;
            return $.when(
                ready = api.get({ folder: newId }),
                this.loadChildren(true)
            )
            .pipe(function (data) {
                // repaint parent node since a changed title also changes the folder order
                tree.getNode(data.folder_id).repaint();
            });
        };

        // update promise
        this.reload = function () {
            ready = api.get({ folder: id });
        };

        // load sub folders - creates instances of TreeNode - does not yet paint them
        this.loadChildren = function (reload) {
            var hash = {}, needsRefresh;
            if (children === null || reload === true) {
                // build hash?
                if (children !== null && reload === true) {
                    _(children).each(function (node) {
                        hash[node.id] = node.detach();
                    });
                }
                // check cache
                needsRefresh = refreshHash[id] === undefined && api.needsRefresh(id);
                // get sub folders
                return api.getSubFolders({ folder: id, all: all })
                    .done(function (list) {
                        // needs refresh?
                        if (needsRefresh) {
                            _.defer(function () {
                                // get fresh data
                                api.getSubFolders({ folder: id, cache: false })
                                    .done(function (freshList) {
                                        // compare
                                        if (!_.isEqual(list, freshList)) {
                                            self.reload();
                                        }
                                        refreshHash[id] = false;
                                    });
                            });
                        }
                    })
                    .pipe(function (data) {
                        // create new children array
                        children = _.chain(data)
                            .filter(function (folder) {
                                // ignore system folders without sub folders, e.g. 'Shared folders'
                                return (folder.module !== 'system' || folder.subfolders) && filter(folder);
                            })
                            .map(function (folder) {
                                if (reload && hash[folder.id] !== undefined) {
                                    // reuse
                                    var node = hash[folder.id];
                                    delete hash[folder.id];
                                    return node;
                                } else {
                                    // new node
                                    return new TreeNode(tree, folder.id, nodes.sub, skip() ? level : level + 1, checkbox, all);
                                }
                            })
                            .value();
                        // destroy deprecated tree nodes
                        _(hash).each(function (child) {
                            child.destroy();
                        });
                        hash = null;
                        return children;
                    });
            } else {
                return $.Deferred().resolve(children);
            }
        };

        this.detach = function () {
            nodes.folder.detach();
            nodes.sub.detach();
            return this;
        };

        this.destroy = function () {
            // remove from parent node
            var node = tree.getNode(data.folder_id);
            if (node) {
                node.removeChild(this);
            }
            // traverse children
            _(children).each(function (child) {
                child.destroy();
            });
            // remove DOM nodes
            _(nodes).each(function (node) {
                node.remove();
            });
            // remove from hash
            delete tree.treeNodes[this.id];
            // clear
            ready = children = nodes = tree = self = container = data = null;
        };

        this.repaint = function () {
            if (painted) {
                // add now
                if (container.index(nodes.folder) === -1) { container.append(nodes.folder); }
                if (container.index(nodes.sub) === -1) { container.append(nodes.sub); }
                // get folder
                return ready
                    .pipe(function (promise) {
                        // get data
                        data = promise;
                        // customize, re-add to index, update arrow
                        self.customize();
                        if (nodes.folder.hasClass('selectable')) {
                            tree.selection.addToIndex(data.id);
                        }
                        updateArrow();
                        // draw children
                        if (isOpen()) {
                            return repaintChildren();
                        } else {
                            nodes.sub.empty().hide();
                            return $.when();
                        }
                    })
                    .done(function () {
                        container.idle();
                    });
            } else {
                return this.paint();
            }
        };

        // paint tree node - loads and paints sub folder if open
        this.paint = function () {
            nodes.folder = tmplFolder.clone().on('dblclick click', toggleState);

            if (level > 0) {
                nodes.folder.css('paddingLeft', (13 + level * 22) + 'px');
            }

            nodes.sub = tmplSub.clone();

            if (skip()) {
                nodes.folder.hide();
            }

            // we have to add nodes now! (otherwise we get an arbitrary order)
            container.append(nodes.folder, nodes.sub);

            return ready
                .pipe(function (promise) {
                    // store data
                    data = promise;
                    // create DOM nodes
                    nodes.arrow = $('<div>').addClass('folder-arrow').on('click', toggleState);
                    nodes.icon = $('<img>', { src: '', alt: '' }).addClass('folder-icon');
                    nodes.label = $('<span>').addClass('folder-label');
                    nodes.counter = $('<span>').addClass('folder-counter');
                    nodes.subscriber = $('<input>').attr({'type': 'checkbox', 'name': 'folder', 'value': data.id}).css('float', 'right');
                    if (data.subscribed) {
                        nodes.subscriber.attr('checked', 'checked');
                    }
                    // draw children
                    var def = isOpen() ? paintChildren() : $.when();
                    updateArrow();
                    // add to DOM
                    if (checkbox && (data.own_rights & 0x3f80)) {
                        nodes.folder.append(nodes.arrow, nodes.icon, nodes.counter, nodes.label, nodes.subscriber);
                    } else {
                        nodes.folder.append(nodes.arrow, nodes.icon, nodes.counter, nodes.label);
                    }

                    // customize
                    self.customize();
                    // work with selection
                    nodes.folder.attr('data-obj-id', data.id);
                    if (nodes.folder.hasClass('selectable')) {
                        tree.selection.addToIndex(data.id);
                    }
                    // Done
                    return def;
                })
                .done(function () {
                    container.idle();
                    painted = true;
                });
        };

        this.customize = function () {
            // invoke extension points
            ext.point('io.ox/foldertree/folder').invoke('customize', nodes.folder, data, tree.options);
        };
    }

    /**
     * Abstract folder structure class
     */
    function FolderStructure(container, opt) {

        this.options = _.extend({
            id: 'default',
            rootFolderId: '1',
            skipRoot: true,
            type: null
        }, opt);

        this.internal = { destroy: $.noop };

        // ref
        var self = this;

        $(container)
            .addClass('io-ox-foldertree')
            // add tree container
            .append(this.container = $('<div>'));

        // selection
        Selection.extend(this, container) // not this.container!
            .setMultiple(false)
            .setSerializer(function (obj) {
                return String(obj.id);
            });

        // add event hub
        Events.extend(this);

        this.paint = function () {
            var p = this.paint;
            if (p.running === null) {
                this.trigger('beforepaint');
                this.selection.clearIndex();
                p.running = this.internal.paint.call(this) || $.when();
                p.running.always(function () {
                    self.selection.update();
                    self.trigger('paint');
                    p.running = null;
                });
            }
            return p.running || $.when();
        };

        this.paint.running = null;

        this.repaint = function () {
            var p = this.paint;
            if (p.running === null) {
                this.trigger('beforerepaint');
                this.selection.clearIndex();
                p.running = (this.internal.repaint || this.internal.paint).call(this) || $.when();
                p.running.always(function () {
                    self.selection.update();
                    self.trigger('repaint');
                    p.running = null;
                });
            }
            return p.running || $.when();
        };

        this.busy = function () {
            this.container.parent().busy().children().hide();
            this.trigger('busy');
            return this;
        };

        this.idle = function () {
            this.container.parent().idle().children().show();
            this.trigger('idle');
            return this;
        };

        this.destroy = function () {
            this.events.destroy();
            this.selection.destroy();
            this.internal.destroy();
            container.empty();
            container = this.container = this.selection = this.internal = null;
        };

        function fnKeyPress(e) {
            if (e.which === 13) {
                e.data.popup.process('add');
            }
        }

        this.addProcess = function (folder, title) {
            var self = this;
            // be responsive
            this.busy();
            // call API
            return api.create({
                folder: folder,
                data: {
                    title: $.trim(title) || gt('New folder')
                }
            })
            .done(function (data) {
                self.idle().repaint().done(function () {
                    self.select(data);
                });
            });
        };

        this.add = function (folder) {
            var self = this,
            folder = String(this.selection.get());
            if (folder) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({
                        width: 400,
                        easyOut: true
                    })
                    .header(
                        $('<h4>').text(gt('Add new subfolder'))
                    )
                    .build(function () {
                        this.getContentNode().append(
                            $('<div class="row-fluid">').append(
                                api.getBreadcrumb(folder, { subfolders: false }),
                                $('<input>', { type: 'text' })
                                .attr('placeholder', gt('Folder name'))
                                .addClass('span12')
                                .on('keypress', { popup: this }, fnKeyPress)
                            )
                        );
                    })
                    .addButton('cancel', 'Cancel')
                    .addPrimaryButton('add', gt('Add folder'))
                    .show(function () {
                        this.find('input').focus();
                    })
                    .done(function (action) {
                        if (action === 'add') {
                            self.addProcess(folder, this.find('input').val());
                        }
                    });
                });
            }
        };

        this.removeProcess = function (folder) {
            api.remove({ folder: folder.id });
        };

        this.remove = function (folder) {
            var self = this,
            folder_id = String(this.selection.get());
            if (folder_id) {
                $.when(
                    api.get({ folder: folder_id }),
                    require(['io.ox/core/tk/dialogs'])
                ).done(function (folder, dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to delete folder "%s"?', folder.title))
                        .addPrimaryButton('delete', gt('Delete'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                self.removeProcess(folder);
                            }
                        });
                });
            }
        };

        this.renameProcess = function (folder, changes) {
            api.update({ folder: folder, changes: changes });
        };

        this.rename = function (folder) {
            var self = this,
            folder_id = String(this.selection.get());
            if (folder_id) {
                $.when(
                    api.get({ folder: folder_id }),
                    require(['io.ox/core/tk/dialogs'])
                )
                .done(function (folder, dialogs) {
                    if (folder.standard_folder) {
                        notifications.yell('error', gt('This is a standard folder, which can\'t be renamed.'));
                        return;
                    }
                    new dialogs.ModalDialog({
                        width: 400,
                        easyOut: true
                    })
                    .header(
                        $('<h4>').text(gt('Rename folder'))
                    )
                    .build(function () {
                        this.getContentNode().append(
                            $('<div class="row-fluid">').append(
                                api.getBreadcrumb(folder.id, { subfolders: false }),
                                $('<input>', { type: 'text' })
                                .val(folder.title)
                                .attr('placeholder', gt('Folder name'))
                                .addClass('span12')
                                .on('keypress', { popup: this }, fnKeyPress)
                            )
                        );
                    })
                    .addButton('cancel', gt('Cancel'))
                    .addPrimaryButton('add', gt('Rename'))
                    .show(function () {
                        this.find('input').focus();
                    })
                    .done(function (action) {
                        if (action === 'add') {
                            self.renameProcess(folder.id, { title: this.find('input').val() });
                        }
                    });
                });
            }
        };

        this.subscribe = function (data) {
            var name = data.app.getName(),
                POINT = name + '/folderview';

            var options;
            _(ext.point(POINT + '/options').all()).each(function (obj) {

                options = _.extend(obj, options || {});
            });

            var container = $('<div>'),
                tree = new ApplicationFolderTree(container, {
                type: options.type,
                rootFolderId: options.rootFolderId,
                checkbox: true,
                all: true
            });

            tree.paint();

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var pane = new dialogs.ModalDialog({
                    width: 500,
                    addclass: 'subscribe-imap-folder',
                    easyOut: true
                });
                var changesArray = [];

                pane.header(
                    $('<h4>').text(gt('Subscribe IMAP folders'))
                )
                .build(function () {
                    this.getContentNode().append(
                        container
                    );
                })
                .addButton('cancel', 'Cancel')
                .addPrimaryButton('save', gt('Save'))
                .show(function () {
                });

                tree.container.on('change', 'input', function () {
                    var folder = $(this).val(),
                        checkboxStatus = $(this).is(':checked'),
                        changes = {subscribed: checkboxStatus},
                        tobBePushed = { folder: folder, changes: changes};
                    changesArray.push(tobBePushed);
                });

                pane.on('save', function () {

                    _(changesArray).each(function (change) {
                        api.update(change);
                    });
                });
            });

        };
    }

    /**
     * Folder tree class
     */
    function FolderTree(container, opt) {

        // add hard filter for trees (e.g. just show mail folders)
        opt = $.extend({
            filter: function (obj) {
                return obj.module === opt.type || (opt.type === 'mail' && (/^default\d+(\W|$)/i).test(obj.id));
                    // module == type? plus: special handling for external mail accounts
            }
        }, opt);

        FolderStructure.call(this, container, opt);

        // tree node hash
        this.treeNodes = {};
        // root tree node
        this.root = new TreeNode(this, this.options.rootFolderId, this.container, 0, opt.checkbox, opt.all);

        this.internal.paint = function () {
            return this.root.paint();
        };

        this.internal.repaint = function () {
            return this.root.repaint();
        };

        this.getNode = function (id) {
            id = String(id);
            return this.treeNodes[id];
        };

        this.removeNode = function (id) {
            id = String(id);
            if (id in this.treeNodes) {
                this.treeNodes[id].destroy();
            }
        };

        this.repaintNode = function (id) {
            id = String(id);
            return id in this.treeNodes ? this.treeNodes[id].repaint() : $.when();
        };

        function deferredEach(list, done) {
            var top = list.shift(), node, self = this;
            if (top && (node = this.getNode(top))) {
                node.open().done(function () {
                    deferredEach.call(self, list, done);
                });
            } else {
                done();
            }
        }

        this.select = function (data) {
            // unpack array; pluck 'id'
            data = _.isArray(data) ? data[0] : data;
            data = _.isString(data) ? data : String(data.id);
            // get path
            var self = this;
            return api.getPath({ folder: data }).pipe(function (list) {
                var def = $.Deferred();
                deferredEach.call(self, _(list).pluck('id'), function () {
                    self.selection.set(data);
                    def.resolve();
                });
                return def;
            });
        };
    }

    function ApplicationFolderTree(container, opt) {
        // inherit from folder tree
        FolderTree.call(this, container, opt);
        // add link container
        $(container).append(this.links = $('<div>').addClass('foldertree-links'));
        // add extension point support
        this.on('paint', function () {
            // paint links
            ext.point('io.ox/application-foldertree/links').invoke('draw', this.links, {
                rootFolderId: this.options.rootFolderId,
                tree: this
            });
        });
    }

    // customization extension point
    ext.point('io.ox/foldertree/folder').extend({
        index: 100,
        id: 'default',
        customize: function (data, options) {

            var src,
                icon = this.find('.folder-icon'),
                label = this.find('.folder-label'),
                counter = this.find('.folder-counter');

            (function () {

                var accountId, a = {}, cont, id;

                if (data.module === 'mail') {

                    cont = function () {
                        switch (data.id) {
                        case a.inbox_fullname:
                            src = PATH + 'inbox.png';
                            break;
                        case a.trash_fullname:
                            src = PATH + 'trash.png';
                            break;
                        case a.sent_fullname:
                            src = PATH + 'outbox.png';
                            break;
                        case a.drafts_fullname:
                            src = PATH + 'draft.png';
                            break;
                        case a.spam_fullname:
                            src = PATH + 'spam.png';
                            break;
                        case a.confirmed_ham_fullname:
                            src = PATH + 'ham.png';
                            break;
                        case a.confirmed_spam_fullname:
                            src = PATH + 'spam.png';
                            break;
                        default:
                            src = DEFAULT;
                            break;
                        }
                        // update src
                        icon.attr('src', src);
                    };

                    // get account id
                    accountId = /^default(\d*)\b/.exec(data.id);
                    if ($.isArray(accountId)) {
                        accountId = accountId[1];
                        // default0?
                        if (accountId === '0') {
                            // use config from api!
                            var f = config.get('mail.folder');
                            if (f) { // might be undefined when mail module is down
                                a.inbox_fullname = f.inbox;
                                a.trash_fullname = f.trash;
                                a.sent_fullname = f.sent;
                                a.drafts_fullname = f.drafts;
                                a.spam_fullname = f.spam;
                                cont();
                            }
                        } else {
                            // get account data from cache
                            id = 'default' + accountId;
                            account.get(accountId).done(function (data) {
                                // unified inbox, e.g. behaves like an account but is not
                                if (!data) {
                                    a = {
                                        inbox_fullname: id + '/INBOX',
                                        trash_fullname: id + '/Trash',
                                        sent_fullname: id + '/Sent',
                                        drafts_fullname: id + '/Drafts',
                                        spam_fullname: id + '/Spam'
                                    };
                                } else {
                                    a = data;
                                }
                                // inbox still not set?
                                if (a.inbox_fullname === undefined) {
                                    a.inbox_fullname = id + '/INBOX';
                                }
                                cont();
                            });
                        }
                    }
                } else {
                    // id specific
                    if (data.id === '6') {
                        src = PATH + 'user.png';
                    } else {
                        src = DEFAULT;
                    }
                }
            }());

            // selectable?
            var hasProperType = !options.type || options.type === data.module,
                isReadable = api.can('read', data),
                isExpandable = !!data.subfolders,
                isSelectable = hasProperType && isReadable;

            if (isExpandable) {
                this.addClass('expandable');
            }

            if (!isSelectable) {
                this.removeClass('selectable');
                // userstore?
                if (data.folder_id === '10') {
                    this.css('opacity', 0.60);
                }
            }

            // set icon
            icon.attr('src', src);
            // set title
            label.text(_.noI18n(data.title));
            // set counter (mail only)
            if (options.type === 'mail' && data.unread && !options.checkbox) {
                label.css('fontWeight', 'bold');
                counter.text(gt.noI18n(data.unread || '')).show();
            } else {
                label.css('fontWeight', '');
                counter.hide();
            }
        }
    });

    var sections = { 'private': gt('Private'), 'public': gt('Public'), 'shared': gt('Shared') };

    function FolderList(container, opt) {

        FolderStructure.call(this, container, opt);

        var self = this;

        function drawFolder(data) {

            var folder = tmplFolder.clone()
                .append(
                    $('<img>', { src: '', alt: '' }).addClass('folder-icon'),
                    $('<span>').addClass('folder-label')
                )
                .attr('data-obj-id', data.id);

            // add owner for shared folders
            if (api.is('shared', data)) {
                folder.append(
                    $('<div>').addClass('shared-by').append(
                        userAPI.getLink(data.created_by, data['com.openexchange.folderstorage.displayName'])
                    )
                );
            }

            // update selection
            self.selection.addToIndex(data.id);

            // invoke extension points
            ext.point('io.ox/foldertree/folder').invoke('customize', folder, data, opt);

            return folder;
        }

        function paint() {

            return api.getVisible({ type: opt.type }).done(function (data) {
                var id, section,
                    drawSection = function (node, list) {
                        // loop over folders
                        _(list).each(function (data) {
                            node.append(drawFolder(data));
                        });
                    };
                // loop over sections
                for (id in sections) {
                    if (data[id]) {
                        self.container.append(
                            section = $('<div>').addClass('section')
                            .append(
                                $('<div>').addClass('section-title').text(sections[id])
                            )
                        );
                        drawSection(section, data[id]);
                    }
                }
            })
            .done(function () {
                self.selection.update();
            });
        }

        this.internal.paint = function () {
            return paint();
        };

        this.internal.repaint = function () {
            self.container.empty();
            return paint();
        };

        this.removeNode = this.repaintNode = this.internal.repaint;

        this.select = function (data) {
            this.selection.set(data);
            return $.when();
        };
    }

    return {
        FolderList: FolderList,
        FolderTree: FolderTree,
        ApplicationFolderTree: ApplicationFolderTree
    };

});
