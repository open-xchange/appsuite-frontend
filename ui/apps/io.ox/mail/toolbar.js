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
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/flag-picker',
    'io.ox/mail/api',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/api/mailfilter',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/mail/actions',
    'less!io.ox/mail/style',
    'io.ox/mail/folderview-extensions'
], function (ext, links, actions, flagPicker, api, capabilities, Dropdown, Toolbar, mailfilter, settings, mailSettings, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/mail/classic-toolbar/links'),
        moduleReady = $.when();

    var meta = {
        //
        // --- HI ----
        //
        'compose': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Compose'),
            title: gt('Compose new email'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/compose'
        },
        'edit': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Edit draft'),
            ref: 'io.ox/mail/actions/edit'
        },
        'edit-copy': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Edit copy'),
            ref: 'io.ox/mail/actions/edit-copy'
        },
        'reply': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-reply',
            label: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply'
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-reply-all',
            label: gt('Reply to all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all'
        },
        'forward': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-mail-forward',
            label: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward'
        },
        'delete': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-trash-o',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete'
        },
        'spam': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-ban',
            label: gt('Mark as spam'),
            ref: 'io.ox/mail/actions/spam'
        },
        'nospam': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-thumbs-up',
            label: gt('Not spam'),
            ref: 'io.ox/mail/actions/nospam'
        },
        'category': {
            prio: 'hi',
            mobile: 'none',
            icon: 'fa fa-folder-open-o',
            label: gt('Set category'),
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
            label: gt('Set color'),
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
            label: gt.pgettext('verb', 'Flag'),
            ref: 'io.ox/mail/actions/flag'
        },
        'unflag': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-star-o',
            //#. Verb: (to) unflag messages
            label: gt.pgettext('verb', 'Unflag'),
            ref: 'io.ox/mail/actions/unflag'
        },
        'archive': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-archive',
            //#. Verb: (to) archive messages
            label: gt.pgettext('verb', 'Archive'),
            ref: 'io.ox/mail/actions/archive'
        },
        //
        // --- LO ----
        //
        'mark-read': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Mark as read'),
            ref: 'io.ox/mail/actions/mark-read',
            section: 'flags'
        },
        'mark-unread': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/mark-unread',
            section: 'flags'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
            ref: 'io.ox/mail/actions/move',
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Print'),
            ref: 'io.ox/mail/actions/print',
            section: 'export'
        },
        'save-as-eml': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Save as file'),
            ref: 'io.ox/mail/actions/save',
            section: 'export'
        },
        'source': {
            prio: 'lo',
            mobile: 'none',
            //#. source in terms of source code
            label: gt('View source'),
            ref: 'io.ox/mail/actions/source',
            section: 'export'
        },
        'reminder': {
            prio: 'lo',
            mobile: 'none',
            label: gt('Reminder'),
            ref: 'io.ox/mail/actions/reminder',
            section: 'keep'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'none',
            label: gt('Add to portal'),
            ref: 'io.ox/mail/actions/add-to-portal',
            section: 'keep'
        }
    };

    // local dummy action

    new actions.Action('io.ox/mail/actions/category', {
        capabilities: 'mail_categories',
        requires: function (e) {
            return e.collection.has('some') && e.baton.app.props.get('categories');
        },
        action: $.noop
    });

    new actions.Action('io.ox/mail/actions/color', {
        requires: function (e) {
            return mailSettings.get('features/flag/color') && e.collection.has('some');
        },
        action: $.noop
    });

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/mail/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/mail/classic-toolbar/links'
    }));

    var hasVacationNoticeAction;
    (function () {
        var configReady = mailfilter.getConfig().then(function (config) {
            hasVacationNoticeAction = !!_(config.actioncmds).findWhere({ id: 'vacation' });
        });

        moduleReady = moduleReady.then(function () {
            return configReady;
        });
    })();

    // view dropdown
    ext.point('io.ox/mail/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            if (_.device('smartphone')) return;

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ caret: true, model: baton.app.props, label: gt('View'), tagName: 'li', attributes: { role: 'presentation' } })
            .group(gt('Layout'))
            .option('layout', 'vertical', gt('Vertical'), { radio: true, group: true });
            // offer compact view only on desktop
            if (_.device('desktop')) dropdown.option('layout', 'compact', gt('Compact'), { radio: true, group: true });
            dropdown.option('layout', 'horizontal', gt('Horizontal'), { radio: true, group: true })
            .option('layout', 'list', gt('List'), { radio: true, group: true })
            .divider();

            // feature: tabbed inbox
            if (capabilities.has('mail_categories') && !_.device('smartphone')) {
                dropdown
                .group(gt('Inbox'))
                .option('categories', true, gt('Use categories'), { group: true })
                //#. term is followed by a space and three dots (' …')
                //#. the dots refer to the term 'Categories' right above this dropdown entry
                //#. so user reads it as 'Configure Categories'
                .link('categories-config', gt('Configure') + ' …', _.bind(onConfigureCategories, this, baton.app.props), { icon: true, group: true })
                .divider();
            }

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

            if (capabilities.has('mailfilter_v2') && hasVacationNoticeAction) {
                dropdown.link('vacation-notice', gt('Vacation notice'), onOpenVacationNotice);
            }

            if (settings.get('folder/mailattachments', {}).all) {
                dropdown.link('attachments', gt('All attachments'), allAttachments.bind(null, baton.app));
            }

            dropdown
            .link('statistics', gt('Statistics'), statistics.bind(null, baton.app))
            .listenTo(baton.app.props, 'change:layout', updateContactPicture);

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );

            toggleTextPreview();
            baton.app.on('folder:change', toggleTextPreview);

            function toggleTextPreview() {
                dropdown.$('[data-name="textPreview"]').toggle(baton.app.supportsTextPreviewConfiguration());
            }

            updateContactPicture.call(dropdown);
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

            var toolbarView = new Toolbar({ title: app.getTitle() });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.render().$el
            );

            function updateCallback($toolbar) {
                toolbarView.replaceToolbar($toolbar).initButtons();
            }

            app.updateToolbar = _.debounce(function (selection) {
                if (!selection) return;
                var isThread = this.isThreaded();
                // resolve thread
                var list = api.resolve(selection, isThread);
                // extract single object if length === 1
                list = list.length === 1 ? list[0] : list;
                // disable visible buttons
                toolbarView.disableButtons();
                // draw toolbar
                var $toolbar = toolbarView.createToolbar(),
                    baton = ext.Baton({ $el: $toolbar, data: list, isThread: isThread, selection: selection, app: this }),
                    ret = ext.point('io.ox/mail/classic-toolbar').invoke('draw', $toolbar, baton);
                $.when.apply($, ret.value()).done(_.lfo(updateCallback, $toolbar));
            }, 10);
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            if (_.device('smartphone')) return;
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.listView.on('selection:change change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'metrics-toolbar',
        index: 10300,
        setup: function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    toolbar = nodes.body.find('.classic-toolbar-container, .categories-toolbar-container');

                // toolbar actions
                toolbar.on('mousedown', '.io-ox-action-link', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                toolbar.on('mousedown', '.category', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: 'select-tab',
                        detail: $(e.currentTarget).attr('data-id')
                    });
                });
                // toolbar options dropdown
                toolbar.on('mousedown', '.dropdown a:not(.io-ox-action-link)', function (e) {
                    var node =  $(e.target).closest('a'),
                        isToggle = node.attr('data-toggle') === 'true';
                    if (!node.attr('data-name')) return;
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-name'),
                        detail: isToggle ? !node.find('.fa-check').length : node.attr('data-value')
                    });
                });
            });
        }
    });

    return moduleReady;
});
