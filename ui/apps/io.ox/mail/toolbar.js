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
 */

define.async('io.ox/mail/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/tk/flag-picker',
    'io.ox/mail/api',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/api/mailfilter',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/mail/actions',
    'less!io.ox/mail/style',
    'io.ox/mail/folderview-extensions'
], function (ext, actionsUtil, flagPicker, api, capabilities, Dropdown, ToolbarView, mailfilter, settings, mailSettings, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/mail/toolbar/links'),
        moduleReady = $.when();

    var meta = {
        //
        // --- HI ----
        //
        // 'compose': {
        //     prio: 'hi',
        //     mobile: 'hi',
        //     title: gt('Compose'),
        //     tooltip: gt('Compose new email'),
        //     drawDisabled: true,
        //     ref: 'io.ox/mail/actions/compose'
        // },
        'edit': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Edit draft'),
            ref: 'io.ox/mail/actions/edit'
        },
        'edit-copy': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Edit copy'),
            ref: 'io.ox/mail/actions/edit-copy'
        },
        'reply': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-reply',
            title: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply'
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-reply-all',
            title: gt('Reply to all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all'
        },
        'forward': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-mail-forward',
            title: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward'
        },
        'delete': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-trash-o',
            title: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete'
        },
        'spam': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-ban',
            title: gt('Mark as spam'),
            ref: 'io.ox/mail/actions/spam'
        },
        'nospam': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-thumbs-up',
            title: gt('Not spam'),
            ref: 'io.ox/mail/actions/nospam'
        },
        'category': {
            prio: 'hi',
            mobile: 'none',
            icon: 'fa fa-folder-open-o',
            title: gt('Set category'),
            ref: 'io.ox/mail/actions/category',
            customize: function (baton) {
                if (!mailSettings.get('categories/enabled')) return;
                require(['io.ox/mail/categories/picker'], function (picker) {
                    picker.attach(this, { props: baton.app.props, data: baton.data });
                }.bind(this));
            }
        },
        'color': {
            prio: 'hi',
            mobile: 'none',
            icon: 'fa fa-bookmark-o',
            title: gt('Set color'),
            ref: 'io.ox/mail/actions/color',
            customize: function (baton) {
                if (!mailSettings.get('features/flag/color')) return;
                flagPicker.attach(this, { data: baton.data });
            }
        },
        'flag': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-star',
            //#. Verb: (to) flag messages
            title: gt.pgettext('verb', 'Flag'),
            ref: 'io.ox/mail/actions/flag'
        },
        'unflag': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-star-o',
            //#. Verb: (to) unflag messages
            title: gt.pgettext('verb', 'Unflag'),
            ref: 'io.ox/mail/actions/unflag'
        },
        'archive': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-archive',
            //#. Verb: (to) archive messages
            title: gt.pgettext('verb', 'Archive'),
            ref: 'io.ox/mail/actions/archive'
        },
        //
        // --- LO ----
        //
        'mark-read': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Mark as read'),
            ref: 'io.ox/mail/actions/mark-read',
            section: 'flags'
        },
        'mark-unread': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/mark-unread',
            section: 'flags'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/mail/actions/move',
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Print'),
            ref: 'io.ox/mail/actions/print',
            section: 'export'
        },
        'save-as-eml': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Save as file'),
            ref: 'io.ox/mail/actions/save',
            section: 'export'
        },
        'source': {
            prio: 'lo',
            mobile: 'none',
            //#. source in terms of source code
            title: gt('View source'),
            ref: 'io.ox/mail/actions/source',
            section: 'export'
        },
        'reminder': {
            prio: 'lo',
            mobile: 'none',
            title: gt('Reminder'),
            ref: 'io.ox/mail/actions/reminder',
            section: 'keep'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'none',
            title: gt('Add to portal'),
            ref: 'io.ox/mail/actions/add-to-portal',
            section: 'keep'
        }
    };

    // transform into extensions

    var index = 0;
    _(meta).each(function (extension, id) {
        point.extend(_.extend({ id: id, index: index += 100 }, extension));
    });

    // local dummy action

    var Action = actionsUtil.Action;

    new Action('io.ox/mail/actions/category', {
        capabilities: 'mail_categories',
        collection: 'some',
        matches: function (baton) {
            return !!baton.app.props.get('categories');
        },
        action: $.noop
    });

    new Action('io.ox/mail/actions/color', {
        toggle: mailSettings.get('features/flag/color'),
        collection: 'some',
        action: $.noop
    });

    // view dropdown
    ext.point('io.ox/mail/toolbar/links').extend({
        id: 'view-dropdown',
        index: 10000,
        custom: true,
        draw: function (baton) {

            if (2 > 1) return;
            if (_.device('smartphone')) return;

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ el: this, caret: true, model: baton.app.props, label: gt('View') });

            dropdown.render().$el.addClass('dropdown pull-right').attr('data-dropdown', 'view');
            ext.point('io.ox/mail/toolbar/links/view-dropdown').invoke('draw', dropdown, baton);
        }
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'layout',
        index: 100,
        draw: function () {
            this.group(gt('Layout'))
            .option('layout', 'vertical', gt('Vertical'), { radio: true, group: true });
            // offer compact view only on desktop
            if (_.device('desktop')) this.option('layout', 'compact', gt('Compact'), { radio: true, group: true });
            this.option('layout', 'horizontal', gt('Horizontal'), { radio: true, group: true })
            .option('layout', 'list', gt('List'), { radio: true, group: true })
            .divider();
        }
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'categories',
        index: 200,
        draw: function (baton) {
            // feature: tabbed inbox
            if (capabilities.has('mail_categories') && !_.device('smartphone')) {
                this
                .group(gt('Inbox'))
                .option('categories', true, gt('Use categories'), { group: true })
                //#. term is followed by a space and three dots (' …')
                //#. the dots refer to the term 'Categories' right above this dropdown entry
                //#. so user reads it as 'Configure Categories'
                .link('categories-config', gt('Configure') + ' …', _.bind(onConfigureCategories, this, baton.app.props), { icon: true, group: true })
                .divider();
            }
        }
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'options',
        index: 300,
        draw: function (baton) {
            var dropdown = this;
            dropdown
            .group(gt('Options'))
            .option('folderview', true, gt('Folder view'), { group: true });
            if (settings.get('selectionMode') !== 'alternative') {
                dropdown.option('checkboxes', true, gt('Checkboxes'), { group: true });
            }
            if (baton.app.supportsTextPreview()) {
                dropdown.option('textPreview', true, gt('Text preview'), { group: true });
            }
            dropdown
            .option('contactPictures', true, gt('Contact pictures'), { group: true })
            .option('exactDates', true, gt('Exact dates'), { group: true })
            .option('alwaysShowSize', true, gt('Message size'), { group: true })
            .divider();

            dropdown.listenTo(baton.app.props, 'change:layout', updateContactPicture);

            toggleTextPreview();
            baton.app.on('folder:change', toggleTextPreview);

            function toggleTextPreview() {
                dropdown.$('[data-name="textPreview"]').toggle(baton.app.supportsTextPreviewConfiguration());
            }

            updateContactPicture.call(dropdown);
        }
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'vacation-notice',
        index: 400,
        draw: (function () {
            var hasVacationNoticeAction,
                configReady = mailfilter.getConfig().then(function doneFilter(config) {
                    hasVacationNoticeAction = !!_(config.actioncmds).findWhere({ id: 'vacation' });
                }, function failFilter() {
                    hasVacationNoticeAction = false;
                });

            moduleReady = moduleReady.then(function () {
                return configReady;
            });

            return function () {
                if (!capabilities.has('mailfilter_v2') || !hasVacationNoticeAction) return;
                this.link('vacation-notice', gt('Vacation notice'), onOpenVacationNotice);
            };
        })()
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'mail-attachments',
        index: 500,
        draw: function (baton) {
            if (!settings.get('folder/mailattachments', {}).all) return;
            this.link('attachments', gt('All attachments'), allAttachments.bind(null, baton.app));
        }
    });

    ext.point('io.ox/mail/toolbar/links/view-dropdown').extend({
        id: 'statistics',
        index: 600,
        draw: function (baton) {
            this.link('statistics', gt('Statistics'), statistics.bind(null, baton.app));
        }
    });

    // local mediator
    function updateContactPicture() {
        // disposed?
        if (!this.model) return;
        // only show this option if preview pane is right (vertical/compact)
        var li = this.$el.find('[data-name="contactPictures"]').parent(),
            layout = this.model.get('layout');
        if (layout === 'vertical' || layout === 'compact') li.show(); else li.hide();
    }

    function statistics(app, e) {
        e.preventDefault();
        require(['io.ox/mail/statistics']).done(function (statistics) {
            statistics.open(app);
        });
    }

    function allAttachments(app, e) {
        e.preventDefault();
        var attachmentView = settings.get('folder/mailattachments', {});
        ox.launch('io.ox/files/main', { folder: attachmentView.all }).done(function () {
            this.folder.set(attachmentView.all);
        });
    }

    function onConfigureCategories(props) {
        require(['io.ox/mail/categories/edit'], function (dialog) {
            dialog.open(props);
        });
    }

    function onOpenVacationNotice(e) {
        e.preventDefault();
        require(['io.ox/mail/mailfilter/vacationnotice/view'], function (view) { view.open(); });
    }

    // classic toolbar
    ext.point('io.ox/mail/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            if (_.device('smartphone')) return;

            var toolbarView = new ToolbarView({ point: 'io.ox/mail/toolbar/links', title: app.getTitle() });
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            app.updateToolbar = function (selection) {
                var options = { data: [], folder_id: this.folder.get(), app: this, isThread: this.isThreaded() };
                toolbarView.setSelection(selection.map(_.cid), function () {
                    // resolve thread
                    options.data = api.resolve(selection, options.isThread);
                    return options;
                });
            };

            app.forceUpdateToolbar = function (selection) {
                toolbarView.selection = null;
                this.updateToolbar(selection);
            };
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            if (_.device('smartphone')) return;
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.listView.on('selection:change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
            app.listView.on('change', function (model) {
                if (!('flags' in model.changed)) return;
                app.forceUpdateToolbar(app.listView.selection.get());
            });
        }
    });

    return moduleReady;
});
