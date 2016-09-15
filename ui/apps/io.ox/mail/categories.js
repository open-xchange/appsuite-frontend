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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/categories', [
    'io.ox/core/http',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/extPatterns/links',
    'io.ox/core/capabilities',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (http, mailAPI, accountAPI, folderAPI, Modal, actions, dnd, links, capabilities, yell, ext, settings, gt) {

    'use strict';

    if (!capabilities.has('mail_categories')) {
        console.error("mail/categories: capababilty 'mail_categories' missing");
    }

    var api, dialog, picker, Model, Collection, View, module, DEBUG = false;

    /**
     * HELPERS
     */

    // do not clutter hash
    ox.on('app:start app:resume', function (app) {
        if (!app || !app.categories) return;
        if (app.id !== 'io.ox/mail' || !app.categories.initialized) return;
        // restore
        module.restoreSelection();
        // reset
        _.url.hash('category', null);
    });

    function trigger() { this.trigger.apply(this, arguments); }

    // helper: merge cateogories part of the server side and local config
    function merge(target, source) {
        var hash = {}, list = [];
        // create hash for second list
        _.each(source, function (obj) {
            hash[obj.id] = obj;
        });
        // merge each element of first and second list
        _.each(target, function (obj) {
            list.push(_.extend({}, obj, hash[obj.id] || {}));
        });
        return list;
    }

    function exists(container, model) {
        return container.find('[data-id="' + model.get('id') + '"]').length;
    }

    // helper: log all events on view/collection/model/module
    function debug(color, name, detail) {
        if (DEBUG) return console.log('%c' + name + (detail && false ? ': ' + JSON.stringify(detail, undefined, 2) : ''), 'color: white; background-color: ' + color);
    }

    /**
     * API
     */

    api = {

        get: function () {
            return http.GET({
                module: 'mail/categories',
                params: {
                    action: 'unread'
                }
            });
        },

        // add mail to category
        move: function (options) {
            if (!options.data || !options.data.length) return $.when();

            var data = _.map(options.data, function (obj) {
                return _.pick(obj, 'id', 'folder_id');
            });
            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'move',
                    'category_id': options.category
                },
                data: data
            });
        },

        // generate rule(s) to add mail to category
        train: function (options) {
            var opt = _.extend({ past: true, future: true }, options);
            if (!opt.category || !opt.data) return;
            // plain list of mail addresses
            var list = _.chain(options.data)
                        .map(function (obj) { return obj.from[0][1]; })
                        .uniq()
                        .value();
            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'train',
                    'category_id': opt.category,
                    'apply-for-existing': opt.past,
                    'apply-for-future-ones': opt.future
                },
                data: {
                    from: list
                }
            });
        }
    };

    /**
     * DIALOG
     */

    dialog = (function () {

        function createSenderList(carrier) {
            carrier.senderlist = _.chain(carrier.maillist)
                    .map(function (mail) { return mail.from[0][1]; })
                    .uniq()
                    .value();
            return carrier;
        }

        function createTextLines(carrier) {
            carrier.textlines = {
                success: gt.format(
                    //#. successfully moved a message via drag&drop to another mail category (tab)
                    //#. %1$d represents the name if the target category
                    //#, c-format
                    gt.ngettext('Message moved to to category "%1$d".', 'Messages moved to category "%1$d".', carrier.maillist.length),
                    _.escape(carrier.baton.targetname)
                ),
                question: gt.format(
                    //#. ask user to move all messages from the same sender to the mail category (tab)
                    //#. %1$d represents a email address
                    //#, c-format
                    gt.ngettext('Move all messages from %1$d to that category?', 'Move all messages from selected senders to that category?', carrier.senderlist.length),
                    '<b>' + _.escape(carrier.senderlist) + '</b>'
                )
            };
            return carrier;
        }

        function createContentString(carrier) {
            carrier.contentstring = $('<tmp>').append(
                $('<div class="content">').append(
                    $('<div>').html(carrier.textlines.success),
                    $('<div>').html(carrier.textlines.question + '<br>'),
                    $('<button role="button" class="btn btn-default btn-primary" data-action="move-all">').text(gt('Move all')),
                    $('<button role="button" class="btn btn-default" data-action="cancel">').text(gt('Cancel'))
                )
            ).html();
            return carrier;
        }

        function yellOut(carrier) {
            carrier.node = yell({
                message: carrier.contentstring,
                html: true,
                duration: -1
            })
            .addClass('category-toast')
            .on('click', '.btn', function (e) {
                if ($(e.target).attr('data-action') === 'move-all') carrier.parent.trigger('dialog:generalize', carrier.baton);
                yell('close');
            });
            return carrier;
        }

        return {

            toast: function (parent, baton) {
                var carrier = { parent: parent, maillist: baton.data, baton: baton },
                    pipeline = _.pipe(carrier);

                pipeline
                    .then(createSenderList)
                    .then(createTextLines)
                    .then(createContentString)
                    .then(yellOut);
            },

            Options: function (parent) {
                var Dialog = Modal.extend({
                    onSave: function () {
                        var list = this.$('.category-item input.name'),
                            categories = [];
                        _.each(list, function (target) {
                            var input = $(target),
                                node = input.closest('.category-item'),
                                checkbox = node.find('[type="checkbox"]');
                            categories.push({
                                id: node.attr('data-id'),
                                name: input.val().trim(),
                                active: checkbox.prop('checked')
                            });
                        });
                        parent.trigger('update', categories);
                    },
                    onDisable: function () {
                        yell('info', gt('You can enable categories again via the view dropdown on the right'));
                        // mail app settings
                        parent.module.mail.props.set('categories', false);
                    }
                });

                return new Dialog({
                    title: gt('Edit categories'),
                    point: 'io.ox/mail/categories/edit',
                    focus: '.form-inline',
                    maximize: false,
                    enter: 'save'
                })
                .extend({
                    'default': function () {
                        this.$body.addClass('mail-categories-dialog');
                    },
                    'form-inline-container': function () {
                        this.$body.append(
                            this.$container = $('<form class="form-inline-container">')
                        );
                    },
                    'form-inline': function () {
                        var list = parent.categories.map(function (model) {
                            return $('<form class="form-inline">').append(
                                        // inputs
                                        $('<div class="form-group category-item">')
                                            .attr('data-id', model.get('id'))
                                            .append(
                                                $('<input type="checkbox" class="status">')
                                                    .prop('checked', model.is('active'))
                                                    .attr('disabled', !model.can('disable')),
                                                $('<input type="text" class="form-control name">')
                                                    .attr({
                                                        placeholder: gt('Name'),
                                                        disabled: !model.can('rename')
                                                    })
                                                    .val(model.get('name'))
                                            ),
                                        // optional description block
                                        model.get('description') ? $('<div class="description">').text(model.get('description')) : $()
                                    );
                        });
                        this.$container.append(list);
                    },
                    'locked-hint': function () {
                        var locked = parent.categories.filter(function (model) {
                            return !model.can('disable') || !model.can('rename');
                        });
                        if (!locked.length) return;
                        this.$body.append(
                            $('<div class="hint">').text(gt('Please note that some categories are predefined and you might not be able to rename or disable.'))
                        );
                    },
                    'register': function () {
                        this.on('save', this.onSave);
                        this.on('disable', this.onDisable);
                    }
                })
                .addAlternativeButton({ label: gt('Disable categories'), action: 'disable' })
                .addButton({ label: gt('Cancel'), action: 'cancel', className: 'btn-default' })
                .addButton({ label: gt('Save'), action: 'save' })
                .open();
            }
        };

    })();

    /**
     * MODEL
     */

    picker = (function () {

        var preParsed = {
            div: $('<div>'),
            list: $('<ul class="dropdown-menu" role="menu">'),
            listItem: $('<li>'),
            menuItemAction: $('<a href="#" role="menuitem" class="category">'),
            menuItemLink: $('<a href="#" role="menuitem" class="link">'),
            dropdownIcon: $('<i class="fa fa-fw">')
        };

        var that = {

            intitialize: function (options) {
                if (that.app) return;
                _.extend(that, options);
            },

            isReady: function () {
                return !!(that.app && that.app.categories && that.app.categories.initialized);
            },

            appendDropdown: function (node, data) {
                if (!that.isReady()) return;

                var list = _.filter(settings.get('categories/list'), function (item) {
                    return item.active;
                });
                var current = that.app.categories.props.get('selected');

                node.after(
                    // drop down
                    preParsed.list.clone()
                    .on('click', 'a.category', { data: data }, that.change)
                    .on('click', 'a.link', { data: data }, that.link)
                    .append($('<li class="dropdown-header" role="separator">').text(gt('Move to category')))
                    .append(
                        _(list).map(function (category) {
                            if (category.id === current) return;
                            return preParsed.listItem.clone().append(
                                preParsed.menuItemAction.clone().append(
                                    $.txt(category.name)
                                )
                                .attr('data-category', category.id)
                            );
                        })
                    )
                    .append('<li class="divider" role="separator">')
                    .append(
                        preParsed.listItem.clone().append(
                            preParsed.menuItemLink.clone().append(
                                //#. term is followed by a space and three dots (' …')
                                gt('Move to folder') + ' …'
                            )
                        )
                    )
                );

                node.addClass('dropdown-toggle').attr({
                    'aria-haspopup': 'true',
                    'data-toggle': 'dropdown',
                    'role': 'button'
                });

                node.parent().addClass('dropdown category-picker');
            },

            link: function (e) {
                if (!that.isReady()) return;
                var baton = e.data;
                actions.check('io.ox/mail/actions/move', baton.data).done(function () {
                    actions.invoke('io.ox/mail/actions/move', null, baton);
                });

                e.preventDefault();
            },

            change: function (e) {
                if (!that.isReady()) return;
                e.preventDefault();
                var data = e.data.data,
                    category = $(e.currentTarget).attr('data-category') || '0',
                    name = $(e.currentTarget).text(),
                    node = $(this).closest('.category-picker');
                that.app.categories.move({ data: data, target: category, targetname: name });

                node.find('.dropdown-toggle').focus();
            },

            // attach flag-picker behavior on existing node
            attach: function (node, options) {
                this.intitialize(options);
                this.appendDropdown(node, [].concat(options.data));
            }
        };

        return that;

    })();

    /**
     * MODEL
     */

    Model = Backbone.Model.extend({
        defaults: {
            unread:  0,
            active: true,
            permissions: []
        },
        toJSON: function () {
            // sync/store only specific properties
            return _.pick.apply(this, [_.clone(this.attributes)].concat(['id', 'name', 'active']));
        },
        getCount: function () {
            return this.get('unread') === 0 ? '' : this.get('unread');
        },
        can: function (id) {
            return this.get('permissions').indexOf(id) > -1;
        },
        is: function (id) {
            if (id === 'disabled') return !this.get('active');
            return this.get(id);
        }
    });

    /**
     * COLLECTION
     */

    Collection = Backbone.Collection.extend({
        model: Model,
        refresh: function () {
            var def = $.Deferred(),
                self = this;
            // defer to ensure mail requests multiple first
            _.defer(function () {
                api.get().then(function (data) {
                    data = _.map(data, function (value, key) {
                        return { id: key, unread: value };
                    });
                    self.add(data, { merge: true });
                    def.resolve();
                });
            });
            return def;
        }
    });

    /**
     * VIEW: knows module, collection, module.props
     */

    View = Backbone.View.extend({
        events: {
            'click .category': 'onSelect',
            'contextmenu .category': 'showOptions',
            'dblclick .category': 'showOptions',
            'keydown .category': 'onKeydown',
            'selection:drop': 'onDrop',
            'click [data-action="tabbed-inbox-options"]': 'showOptions'
        },
        initialize: function (options) {
            _.extend(this, options || {});
            this.setElement($('.categories-toolbar-container'));
            // A11y: Do not add role to empty element
            $('.categories-toolbar-container').attr('role', 'menu');
            // helper
            this.ui = {
                list: this.$el.find('.classic-toolbar.categories'),
                body: this.$el.closest('.window-body'),
                container: this.$el.closest('.window-container')
            };
            // dnd
            dnd.enable({ draggable: true, container: this.ui.list, selection: this.selection, delegate: true, dropzone: true, dropzoneSelector: '.category' });
            this.ui.list.empty();
            // register listeners
            this.register();
        },
        register: function () {
            // collection
            this.listenTo(this.categories, 'update reset', _.throttle(this.render, 130));
            this.listenTo(this.categories, 'change', _.throttle(this.render, 200));
            // module
            this.listenTo(this.module, 'move:after', this.showDialog);
            this.listenTo(this.props, 'change:selected', this.onSelectionChange);
        },
        onSelectionChange: function (props, id) {
            this.ui.list.find('.category').removeClass('selected');
            this.refresh(this.categories.get(id));
        },
        refresh: function (list) {
            // ensure array
            list = list ? [].concat(list) : this.categories.models;
            _.each(list, function (model) {
                var node = this.ui.list.find('[data-id="' + model.get('id') + '"]');
                if (model.is('disabled')) { node.addClass('hidden'); } else { node.removeClass('hidden'); }
                if (model.id === this.props.get('selected')) {
                    node.addClass('selected');
                } else {
                    node.removeClass('selected');
                }
                node.find('.counter').text(model.getCount());
                //#. use as a fallback name in case a user enters a empty string as the name of tab
                node.find('.category-name').text(model.get('name').trim() || gt('Unnamed'));
            }.bind(this));
        },
        render: function (obj) {
            // full redraw
            if (!this.ui.list.children().length) return this.redraw();
            // duck checks: collection vs. single model
            var list = obj && obj.models ? obj.models : [obj];
            // simple update
            this.refresh(list);
        },
        redraw: function () {
            this.trigger('redraw');
            var container = this.ui.list;
            this.categories.forEach(function (model) {
                if (!exists(container, model)) {
                    container.append(
                        $('<li class="category">').append(
                            $('<a class="link" role="button">').append(
                                $('<div class="category-icon">'),
                                $('<div class="category-name truncate">').text(model.get('name')),
                                $('<div class="category-counter">').append(
                                    $('<span class="counter">').text(model.getCount())
                                )
                            ),
                            $('<div class="category-drop-helper">').text(gt('Drop here!'))
                        ).attr({
                            'data-id': model.get('id'),
                            'data-name': model.get('name')
                        })
                    );
                }
                // states
            });
            this.refresh();
            container.append($('<li class="free-space" aria-hidden="true">'));
        },
        showDialog: function (baton) {
            // triggers update event in this view (with data param)
            dialog.toast(this, baton);
        },
        showOptions: function (e) {
            // triggers update event in this view (with data param)
            new dialog.Options(this);
            // do not show native rightclick menu
            if (e && e.type === 'contextmenu') e.preventDefault();
        },
        show: function () {
            this.trigger('show:before');
            this.ui.container.addClass('mail-categories-enabled');
        },
        hide: function () {
            this.trigger('hide:before');
            this.ui.container.removeClass('mail-categories-enabled');
        },
        resolve: function (obj) {
            var id;
            if (_.isString(obj)) id = obj;
            if (!id) id = $(obj.target).closest('.category').attr('data-id');
            return this.categories.get(id);
        },
        onDrop: function (e, baton) {
            // prevent execution of copy/move handler
            e.stopPropagation();
            baton.data = mailAPI.resolve(baton.data);
            baton.targetname = $(baton.dropzone).attr('data-name');
            this.trigger('drop', baton);
        },
        onKeydown: function (e) {
            if (e.which === 13) this.onSelect(e);
        },
        onSelect: function (e) {
            // currently disabled
            var model = this.resolve(e);
            this.trigger('select', model.get('id'));
        }
    });

    // MODULE: SUBMODULE CONFIG
    var Config = function (context) {
        // hint: config === module.config
        var config = {
            // hint: this = module
            bind: function () {
                // bind all functions to context (config)
                _.each(config, function (func, key) {
                    if (key === 'bind') return;
                    this[key] = this[key].bind(context);
                }.bind(this));
                return this;
            },
            get: function () {
                return settings.get('categories', { enabled: false, list: [] });
            },
            set: function () {
                var config = this.config.get(),
                    list = merge(config.list, this.categories.toJSON());
                settings.set('categories/list', list);
            },
            load: function () {
                var config = this.config.get();
                this.categories.set(config.list);
                this.props.set('enabled', config.enabled);
                this.props.set('initialized', config.initialized);
                this.trigger('load');
                // update unread count
                _.defer(_.bind(this.refresh, this));
            },
            save: function () {
                this.trigger('save:before');
                this.config.set();
                settings.save()
                        .fail(yell)
                        .done(function () {
                            this.trigger('save:after');
                            this.config.load();
                        }.bind(this));
            }
        };
        return config.bind(context);
    };

    function retrigger(model) {
        // trigger event with new value (primitives)
        _.each(model.changed, function (value, key) {
            if (!_.isObject(value)) model.trigger(key + ':to:' + value);
        });
    }

     // MODULE: SUBMODULE PROCESS
    var Process = function (context) {
        var SECOND = 1000;
        // hint: proc === module.proc
        var proc = {
            // hint: this = module
            bind: function () {
                // bind all functions to context (config)
                _.each(proc, function (func, key) {
                    if (key === 'bind') return;
                    this[key] = this[key].bind(context);
                }.bind(this));
                return this;
            },
            start: function () {
                proc.off();
                var status = proc.get();
                if (_.contains(['notyetstarted', 'finished'], status)) return;
                // initial hint
                if (_.contains(['running'], status)) {
                    //#. tabbed inbox feature: the update job is running that assigns some common mails (e.g. from twitter.com) to predefined tabs
                    yell('info', gt('It will take some time until common mails are assigned to the default tabs.'));
                }
                // maybe an error occured?
                proc.notify();
                proc.on();
            },
            get: function () {
                this.config.load();
                // notyetstarted, running, finished
                return this.props.get('initialized');
            },
            on: function () {
                proc.id = setInterval(proc.notify, 20 * SECOND);
            },
            off: function () {
                clearInterval(proc.id);
            },
            notify: function () {
                var status = proc.get();
                if (status === 'finished') {
                    proc.off();
                    this.reload();
                }
                if (status === 'error') {
                    //#. tabbed inbox feature: in case the long running update job fails
                    yell('error', gt("Sorry, common mails couldn't be assigned automatically."));
                    proc.off();
                }
                // fallback
                if (_.contains(['notyetstarted'], status)) return proc.off();
            }
        };
        return proc.bind(context);
    };

    /**
     * CONTROLLER
     */

    module = {
        api: api,
        init: function (options) {
            // add event hub
            _.extend(module, Backbone.Events, options);
            // subs
            this.config = new Config(this);
            this.proc = new Process(this);
            this.props = new Backbone.Model();
            module.categories = new Collection();
            module.view = new View({ module: this, categories: module.categories, props: module.props });
            // register
            this.register();
            // inital visibility state
            this.setFolder();
            // load config
            this.config.load();
            // props
            this.props.set({
                'selected': this.restoreSelection(),
                'enabled': settings.get('categories/enabled')
            });
            this.initialized = true;
            // inital refresh
            //_.defer(_.bind(this.refresh, this));
            return module;
        },
        register: function () {
            // temporary
            settings.on('change:categories/enabled', function (e, value) {
                this.props.set('enabled', value);
            }.bind(this));

            this.listenTo(this.view, 'update', this.update);
            this.listenTo(this.view, 'select', this.select);
            // retrigger as custom value based event (change:enabled -> enabled:true/false)
            this.listenTo(this.props, 'change:enabled change:visible change:initialized', retrigger);
            // show & hide
            this.listenTo(this.props, 'change:folder', this.show);
            this.listenTo(this.props, 'change:selected', this.show);
            this.listenTo(this.props, 'enabled:to:true', this.show);
            this.listenTo(this.props, 'enabled:to:false', this.hide);
            this.listenTo(this.props, 'visible:to:false', _.bind(this.view.hide, this.view));
            this.listenTo(this.props, 'visible:to:true', _.bind(this.view.show, this.view));
            // first start
            this.listenTo(this.props, 'enabled:to:true', this.checkstate);
            this.listenTo(this.props, 'initialized:to:finished', this.refresh);
            // view: move and generalize
            this.listenTo(this.view, 'drop', this.move);
            this.listenTo(this.view, 'dialog:generalize', this.generalize);
            this.listenTo(this.view, 'dialog:revert', this.revert);
            // triggers settings save
            this.listenTo(this, 'update:after', this.config.save);
            // reload: listview
            this.listenTo(this.props, 'change:selected', this.reload);
            this.listenTo(this.props, 'change:enabled', this.reload);
            this.listenTo(this, 'move:after revert:after generalize:after', this.reload);
            // refresh: unread counter
            mailAPI.on('delete refresh.all', $.proxy(this.refresh, this));
            folderAPI.on('reload:' + accountAPI.getInbox(), $.proxy(this.refresh, this));
            this.listenTo(this.props, 'change:enabled', this.refresh);
            this.listenTo(this, 'move:after rever:after generalise:after', this.refresh);
            // toggle visibility
            this.listenTo(this.mail, 'folder:change', this.setFolder);
            // debug
            //this.listenTo(this.pool, 'all', _.partial(debug, 'green'));
            this.listenTo(this, 'all', _.partial(debug, 'green'));
            //this.listenTo(this.props, 'all', _.partial(debug, 'purple'));
            //this.listenTo(this.view, 'all', _.partial(debug, 'blue'));
            //this.listenTo(this.categories, 'all', _.partial(debug, 'red'));

            // empty state
            ext.point(this.mail.listView.ref + '/empty').extend({
                id: 'categories',
                index: 100,
                draw: function (baton) {
                    if (!baton.app.listView.model.get('categoryid')) return;
                    if (!baton.app.categories.isFolderSupported()) return;
                    // TODO: wording
                    //#. Helper text for mail tabs without content
                    this.text(gt('To fill this area please drag and drop mails to the title of this tab.'));
                }
            });
        },
        enable: function () {
            this.props.set('enabled', true);
        },
        disable: function () {
            this.props.set('enabled', false);
        },
        // toggle
        show: function () {
            if (!this.props.get('enabled')) return;
            if (!this.isFolderSupported()) return this.hide();
            this.mail.listView.model.set('categoryid', this.props.get('selected'));
            // state
            this.props.set('visible', true);
            this.restoreSelection();
            this.trigger('show');
        },
        hide: function () {
            // restore state
            _.url.hash('category', null);
            this.mail.listView.model.unset('categoryid');
            this.props.set('visible', false);
            this.trigger('hide');
        },
        restoreSelection: function () {
            var id = (this.categories.get(_.url.hash('category') || this.props.get('selected')) || this.categories.first() || {}).id;
            _.url.hash('category', id);
            return id;
        },
        checkstate: function () {
            this.config.load();
            this.proc.start();
        },
        // category-based actions
        select: function (categoryId) {
            _.url.hash('category', categoryId);
            this.props.set('selected', categoryId);
        },
        toggle: function (categoryId, action) {
            this.trigger('toggle', action);
            this.categories.get(categoryId).set('active', action === 'enable');
        },
        update: function (categories) {
            this.categories.set(categories);
            // we have to wait until changes reach middleware
            _.delay(function () {
                var selected = this.categories.get(this.props.get('selected'));
                if (selected.is('active')) return this.reload();
                // current tab disabled? use first active tab...
                var head = this.categories.findWhere({ active: true });
                this.select(head.get('id'));
            }.bind(this), 2000);
            this.trigger('update:after');
        },
        move: function (baton, revert) {
            baton.source = this.props.get('selected');
            api.move({ category: baton.target, data: baton.data })
                .done(_.bind(trigger, this, (revert ? 'revert:after' : 'move:after'), baton))
                .fail(yell);
        },
        revert: function (baton) {
            var data = _.extend({}, baton, { target: baton.source, source: baton.target });
            this.move(data, true);
        },
        generalize: function (baton) {
            api.train({ category: baton.target, data: baton.data })
            .done(_.bind(trigger, this, 'generalize:after', baton))
            .fail(yell);
        },
        // state toggling triggers
        setFolder: function (folder) {
            this.props.set('folder', folder || this.mail.folder.get());
        },
        isFolderSupported: function () {
            var folder = this.props.get('folder');
            return accountAPI.is('inbox', folder) && accountAPI.isPrimary(folder);
        },
        showConfig: function () {
            this.view.showOptions();
        },
        reload: function () {
            // TODO: dirty
            this.mail.listView.collection.expired = true;
            this.mail.listView.load();
            this.trigger('reload');
        },
        refresh: _.throttle(function () {
            return this.categories.refresh()
                .done(_.bind(trigger, this, 'refresh'));
        }, 500, { leading: false })
    };

    // hint: settings in io.ox/mail/settings/pane
    return {
        api: api,
        controller: module,
        picker: picker
    };

});
