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

define('io.ox/mail/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/flag-picker',
    'io.ox/mail/api',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/mail/actions',
    'less!io.ox/mail/style',
    'io.ox/mail/folderview-extensions'
], function (ext, links, actions, flagPicker, api, Dropdown, Toolbar, upload, dropzone, notifications, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/mail/classic-toolbar/links');

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
        'color': {
            prio: 'hi',
            mobile: 'none',
            icon: 'fa fa-bookmark',
            label: gt('Set color'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/color',
            customize: function (baton) {
                flagPicker.attach(this, { data: baton.data });
            }
        },
        'edit': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Edit draft'),
            ref: 'io.ox/mail/actions/edit'
        },
        'archive': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-archive',
            label: gt('Archive'),
            ref: 'io.ox/mail/actions/archive'
        },
        //
        // --- LO ----
        //
        'markunread': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/markunread',
            section: 'flags'
        },
        'markread': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Mark as read'),
            ref: 'io.ox/mail/actions/markread',
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
        'saveEML': {
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

    new actions.Action('io.ox/mail/actions/color', {
        requires: 'some',
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

    // local mediator
    function updateContactPicture() {
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

    // view dropdown
    ext.point('io.ox/mail/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            if (_.device('smartphone')) return;

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ caret: true, model: baton.app.props, label: gt('View'), tagName: 'li' })
            .header(gt('Layout'))
            .option('layout', 'vertical', gt('Vertical'))
            .option('layout', 'compact', gt('Compact'))
            .option('layout', 'horizontal', gt('Horizontal'))
            .option('layout', 'list', gt('List'))
            .divider()
            .header(gt('Options'))
            .option('folderview', true, gt('Folder view'))
            .option('checkboxes', true, gt('Checkboxes'))
            .option('contactPictures', true, gt('Contact pictures'))
            .option('exactDates', true, gt('Exact dates'))
            .divider()
            .link('statistics', gt('Statistics'), statistics.bind(null, baton.app))
            .listenTo(baton.app.props, 'change:layout', updateContactPicture);

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );

            updateContactPicture.call(dropdown);
        }
    });

    // classic toolbar
    ext.point('io.ox/mail/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            if (_.device('smartphone')) return;

            var toolbar = new Toolbar({ title: app.getTitle(), tabindex: 1 });
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbar.render().$el
            );
            app.updateToolbar = _.queued(function (list) {
                if (!list) return $.when();
                var isThread = this.props.get('thread');

                // resolve thread
                list = api.resolve(list, isThread);

                // extract single object if length === 1
                list = list.length === 1 ? list[0] : list;
                // draw toolbar
                var baton = ext.Baton({ $el: toolbar.$list, data: list, isThread: isThread, app: this }),
                    ret = ext.point('io.ox/mail/classic-toolbar').invoke('draw', toolbar.$list.empty(), baton);
                return $.when.apply($, ret.value()).then(function () {
                    toolbar.initButtons();
                });
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

});
