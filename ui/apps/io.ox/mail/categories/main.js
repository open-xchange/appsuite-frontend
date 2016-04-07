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

define('io.ox/mail/categories/main', [
    'io.ox/mail/categories/api',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/capabilities',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'less!io.ox/mail/categories/style'
], function (api, mailAPI, accountAPI, dnd, capabilities, yell, settings, gt) {

    'use strict';

    // TODO: trigger unread after train/move

    if (!capabilities.has('mail_categories')) {
        console.error("mail/categories/main: capababilty 'mail_categories' missing");
    }

    var DEBUG = true,
        // category config propertys that should be synced
        SYNCED = ['id', 'name', 'active'],
        Model, Collection, View, module;

    function trigger() { this.trigger.apply(this, arguments); }

    function senderlist(data) {
        return _.chain(data)
                .map(function (mail) { return mail.from[0][1]; })
                .uniq()
                .value();
    }

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

    // helper: log all events on view/collection/model/module
    function debug(color, name, detail) {
        if (DEBUG) return console.log('%c' + name + (detail && false ? ': ' + JSON.stringify(detail, undefined, 2) : ''), 'color: white; background-color: ' + color);
    }

    // MODEL
    Model = Backbone.Model.extend({
        defaults: {
            unread:  0,
            active: true,
            permissions: []
        },
        toJSON: function () {
            // sync/store only specific properties
            return _.pick.apply(this, [_.clone(this.attributes)].concat(SYNCED));
        },
        getCount: function () {
            return this.get('unread') || undefined;
        },
        can: function (id) {
            return this.get('permissions').indexOf(id) > -1;
        },
        is: function (id) {
            if (id === 'disabled') return !this.get('active');
        }
    });

    // COLLECTION
    Collection = Backbone.Collection.extend({
        model: Model,
        refresh: function () {
            var def = $.Deferred(),
                self = this;
            // defer to ensure mail multiple requests first
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

    // VIEW: SUBMODULE DIALOG
    var Dialog = function (context) {
        // hint: dialog === view.dialog
        var dialog = {
            // hint: this = view
            bind: function () {
                // bind all functions to context (view)
                _.each(dialog, function (func, key) {
                    if (key === 'bind') return;
                    this[key] = this[key].bind(context);
                }.bind(this));
                return this;
            },
            render: function (baton) {
                var def = $.Deferred(),
                    list = senderlist(baton.data);
                // modal dialog
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    this.dialog.instance = new dialogs.ModalDialog()
                            .header($('<h3>').text(gt('Apply for all mails?')))
                            .build(function () {
                                this.getPopup().addClass('mail-categopries-dialog');
                                this.getContentNode().append(
                                    // TODO: i18n plural
                                    //#. %1$s target mail category
                                    //#, c-format
                                    $('<p>').html(gt('This mail was moved to %1$s.', '<i>' + baton.target + '</i>')),
                                    //#. %1$s single mail address or comma separated list of multiple
                                    //#, c-format
                                    $('<p>').html(gt('Apply for mails from %1$s', '<b>' + list.join(', ') + '</b>'))
                                );
                            })
                            .data(baton)
                            .addPrimaryButton('generalize', gt('Apply'))
                            .addButton('cancel', gt('Cancel'))
                            .addAlternativeButton('revert', gt('Revert'));
                    def.resolve();
                }.bind(this));
                return def;
            },
            show: function (baton) {
                // preferred setting for generation (never, always, ask[default])
                if (this.props.get('generalize') === 'never') return;
                if (this.props.get('generalize') === 'always') return this.trigger('dialog:generalize', baton);

                // render modal dialog, register handler and show
                this.dialog.render(baton).then(function () {
                    this.dialog.register();
                    this.dialog.instance.show();
                }.bind(this));
            },
            register: function () {
                // retrigger on view: generalize -> data:apply, revert -> data:revert
                this.dialog.instance.on('generalize revert', function retrigger(e, data) {
                    this.trigger('dialog:' + e.type, data);
                }.bind(this));
            }

        };
        return dialog.bind(context);
    };

    // VIEW: knows module, collection, module.props
    View = Backbone.View.extend({
        dialog: undefined,
        events: {
            'click .category': 'onSelect',
            'click [data-action="toggle"]': 'onToggle',
            'selection:drop': 'onDrop'
        },
        initialize: function (options) {
            _.extend(this, options || {});
            this.setElement($('.categories-toolbar-container'));
            // helper
            this.ui = {
                list: this.$el.find('.classic-toolbar'),
                body: this.$el.closest('.window-body'),
                container: this.$el.closest('.window-container')
            };
            dnd.enable({ draggable: true, container: this.$el, selection: this.selection, dropzone: true, dropzoneSelector: '.category' });

            this.register();
        },
        register: function () {
            // collection
            this.listenTo(this.categories, 'update reset', _.throttle(this.render, 130));
            this.listenTo(this.categories, 'change:unread change:active change:name', this.refresh);
            // module
            this.listenTo(this.module, 'move:after', this.showDialog);
            this.listenTo(this.props, 'change:selected', this.refreshSelection);
        },
        refreshSelection: function (props, id) {
            this.ui.list.find('.category').removeClass('selected');
            this.refresh(this.categories.get(id));
        },
        refresh: function (model, node) {
            node = (node || {}).addClass ? node : this.ui.list.find('[data-id="' + model.get('id') + '"]');
            if (model.is('disabled')) { node.addClass('disabled'); } else { node.removeClass('disabled'); }
            //if (model.is('disabled')) { node.addClass('hidden'); } else { node.removeClass('hidden'); }
            if (model.id === this.props.get('selected')) {
                node.addClass('selected');
            } else {
                node.removeClass('selected');
            }
            if (model.getCount()) { node.find('.counter').text(model.getCount()); }
            node.find('.category-name').text(model.get('name'));
        },
        render: function () {
            this.trigger('render');
            var container = this.ui.list.empty(), node;
            this.categories.forEach(function (model) {
                container.append(
                    node = $('<li class="category">').append(
                        $('<div class="category-icon">'),
                        $('<div class="category-name truncate">').text(model.get('name')),
                        $('<div class="category-counter">').append(
                            $('<span class="counter">').text(model.getCount())
                        ),
                        $('<div class="category-actions">').append(
                            model.can('disable') ? $('<i class="fa fa-fw fa-eye-slash" data-action="toggle">') : $()
                        )
                    ).attr('data-id', model.get('id'))
                );
                // states
                this.refresh(model, node);
            }.bind(this));
        },
        showDialog: function (baton) {
            this.dialog = new Dialog(this);
            this.dialog.show(baton);
        },
        show: function () {
            debugger;
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
            this.trigger('drop', baton);
        },
        onSelect: function (e) {
            // action clicked
            if ($(e.target).closest('.category-actions').length) return;
            // currently disabled
            var model = this.resolve(e);
            if (model.is('disabled')) return;
            this.trigger('select', model.get('id'));
        },
        onToggle: function (e) {
            var model = this.resolve(e),
                name = model.is('disabled') ? 'enable' : 'disable';
            this.trigger(name, model.get('id'), name);
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
            load: function () {
                var config = this.config.get();
                this.categories.reset(config.list);
                this.props.set('enabled', config.enabled);
                this.trigger('load');
            },
            save: function () {
                this.trigger('save:before');
                var config = this.config.get(),
                    list = merge(config.list, this.categories.toJSON());
                settings.set('categories/enabled', this.props.get('enabled'));
                settings.set('categories/generalize', this.props.get('generalize') || 'ask');
                settings.set('categories/list', list);
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

    // CONTROLL
    module = {
        api: api,
        init: function (options) {
            // add event hub
            _.extend(module, Backbone.Events, options);
            // subs
            this.config = new Config(this);
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
            this.props.set('selected', this.preselected());
            // inital refresh
            _.defer(_.bind(this.refresh, this));
        },
        register: function () {
            this.listenTo(this.view, 'disable enable', this.toggle);
            this.listenTo(this.view, 'select', this.select);
            // retrigger as custom value based event (change:enabled -> enabled:true/false)
            this.listenTo(this.props, 'change:enabled change:visible', retrigger);
            // show & hide
            this.listenTo(this.props, 'change:folder', this.show);
            this.listenTo(this.props, 'change:selected', this.show);
            this.listenTo(this.props, 'enabled:to:true', this.show);
            this.listenTo(this.props, 'enabled:to:false', this.hide);
            this.listenTo(this.props, 'visible:to:false', _.bind(this.view.hide, this.view));
            this.listenTo(this.props, 'visible:to:true', _.bind(this.view.show, this.view));
            // view: move and generalize
            this.listenTo(this.view, 'drop', this.move);
            this.listenTo(this.view, 'dialog:generalize', this.generalize);
            this.listenTo(this.view, 'dialog:revert', this.revert);
            // triggers settings save
            this.listenTo(this.props, 'change:enabled', this.config.save);
            this.listenTo(this.categories, 'change:name change:active', this.config.save);
            // reload: listview
            this.listenTo(this.props, 'change:selected', this.reload);
            this.listenTo(this.props, 'change:enabled', this.reload);
            this.listenTo(this, 'move:after revert:after generalize:after', this.reload);
            // refresh: unread counter
            this.listenTo(this.pool, 'change:flags', this.refresh);
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
        },
        // toggle
        show: function () {
            if (!this.props.get('enabled')) return;
            if (!this.isFolderSupported()) return this.hide();
            debugger;
            // thread restore
            if (this.props.get('thread') === undefined) {
                this.props.set('thread', this.mail.props.get('thread'));
            }
            this.mail.props.set('thread', false);
            // request param
            this.mail.listView.model.set('filter', this.props.get('selected'));
            // state
            this.props.set('visible', true);
            this.mail.left.find('[data-name="thread"]').addClass('disabled');
            this.trigger('show');
        },
        hide: function () {
            // restore state
            this.mail.listView.model.unset('filter');
            if (this.props.get('thread')) {
                this.mail.props.set('thread', this.props.get('thread'));
            }
            this.props.unset('thread');
            this.mail.left.find('[data-name="thread"]').removeClass('disabled');
            this.props.set('visible', false);
            this.trigger('hide');
        },
        enable: function () {
            this.props.set('enabled', true);
            this.trigger('enable');
        },
        disable: function () {
            this.props.set('enabled', false);
            this.trigger('disable');
        },
        preselected: function () {
            var id = (this.categories.get(_.url.hash('category')) || this.categories.first() || {}).id;
            _.url.hash('category', id);
            return id;
        },
        // actions
        select: function (categoryId) {
            _.url.hash('category', categoryId);
            this.props.set('selected', categoryId);
        },
        toggle: function (categoryId, action) {
            this.trigger('toggle', action);
            this.categories.get(categoryId).set('active', action === 'enable');
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
        reload: function () {
            // TODO: dirty
            //this.mail.listView.model.set('filter', this.props.get('selected'));
            //this.mail.listView.loader.loading = false;
            this.mail.listView.collection.expired = true;
            this.mail.listView.reload();
            this.trigger('reload');
        },
        refresh: function () {
            return this.categories.refresh()
                .done(_.bind(trigger, this, 'refresh'));
        }
    };

    // hint: settings at io.ox/mail/settings/pane

    window.horst = module;
    return module;

});
