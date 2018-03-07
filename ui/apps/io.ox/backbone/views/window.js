/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/window', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/a11y',
    'gettext!io.ox/core'
], function (DisposableView, a11y, gt) {

    'use strict';

    var backdrop = $('<div id="floating-window-backdrop">').on({
        'click': function () {
            _(collection.filter(function (model) { return model.get('floating'); })).each(function (model) {
                model.set('minimized', true);
            });
            ox.trigger('change:document:title', ox.ui.App.getCurrentApp().get('title'));
            backdrop.hide();
        },
        'drag dragend dragenter dragexit dragleave dragover dragstart drop': function (e) {
            // prevent drag bubbling to underlying dropzones cause drop somehow doesn't bubble reliably
            e.stopPropagation();
        }
    }).hide();

    var collection = new Backbone.Collection();

    var WindowModel = Backbone.Model.extend({
        defaults: {
            minimized: false,
            floating: true,
            lazy: false,
            displayStyle: 'cornered',
            title: '',
            showStickybutton: false,
            showInTaskbar: true,
            size: 'width-md height-md' // -lg, -md, -sm, -xs
        }
    });

    var WindowView = DisposableView.extend({

        events: {
            'click [data-action="minimize"]': 'onMinimize',
            'click [data-action="close"]':    'onQuit',
            'keydown':                        'onKeydown',
            'dblclick .floating-header':      'toggleDisplaystyle',
            'click button[data-view]':        'toggleDisplaystyle'
        },

        initialize: function (options) {
            this.options = options || {};
            this.listenTo(this, 'dispose', remove);
            if (!this.model) this.model = new WindowModel(_.pick(options, 'title', 'minimized', 'closable', 'win', 'showStickybutton', 'taskbarIcon', 'width', 'height', 'showInTaskbar'));

            this.model.set('previousFocus', document.activeElement, { silent: true });

            this.listenTo(this.model, {
                'activate': this.activate,
                'change:displayStyle': this.changeDisplayStyle,
                'change:minimized': this.toggle,
                'change:count': this.onChangeCount,
                'close': function () { this.$el.remove(); }
            });
            this.$body = this.options.$body || $('<div>');
            this.$body = this.$el.find('.window-container-center').length > 0 ? this.$el.find('.window-container-center') : this.$body;
            collection.add(this.model);
            if (!this.model.get('lazy')) new TaskbarElement({ model: this.model }).render();
        },

        renderWindowControls: function () {
            var isCornered = this.model.get('displayStyle') === 'cornered';
            this.$displayStyleToggle =
                $('<button type="button" class="btn btn-link">').attr('data-view', isCornered ? 'centered' : 'cornered').append(
                    $('<i class="fa" aria-hidden="true">').addClass(isCornered ? 'fa-expand' : 'fa-compress')
                );
            return $('<div class="controls">').append(
                $('<button type="button" class="btn btn-link" data-action="minimize">').attr('title', gt('Minimize')).append($('<i class="fa fa-window-minimize" aria-hidden="true">')),
                this.$displayStyleToggle,
                this.model.get('showStickybutton') ? $('<button type="button" class="btn btn-link" data-view="sticky">').append('<i class="fa fa-thumb-tack" aria-hidden="true">') : '',
                this.model.get('closable') ? $('<button type="button" class="btn btn-link" data-action="close">').append('<i class="fa fa-times" aria-hidden="true">') : ''
            );
        },

        onQuit: function () {
            this.model.trigger('quit');
        },

        onKeydown: function (e) {
            this.onEscape(e);
            this.onTab(e);
        },

        onEscape: function (e) {
            if (e.which !== 27) return;
            if (e.isDefaultPrevented()) return;
            if ($(e.target).hasClass('mce-content-body') || $(e.target).hasClass('token-input')) return;
            this.onQuit();
        },

        onTab: function (e) {
            if (e.which !== 9) return;
            a11y.trapFocus(this.$el, e);
        },

        open: function () {
            $('#io-ox-screens').append(this.$el);
            this.$el.focus();
            if (backdrop.parents().length === 0) $('#io-ox-screens').append(backdrop);
            this.activate();
            return this;
        },

        changeDisplayStyle: function (model, style) {
            var isCornered = style === 'cornered';
            this.$displayStyleToggle.attr('data-view', isCornered ? 'centered' : 'cornered')
                .find('i').toggleClass('fa-expand', isCornered).toggleClass('fa-compress', !isCornered);
            // sticky windows push the rest of appsuite to the left. So an indicator class is needed
            $('#io-ox-windowmanager').toggleClass('has-sticky-window', style === 'sticky');
            this.$el.removeClass('cornered centered sticky').addClass(style);
            _.defer(function () { $(window).trigger('resize'); });
        },

        toggleDisplaystyle: function (e) {
            if (e.type === 'dblclick') return this.model.set('displayStyle', this.$displayStyleToggle.attr('data-view'));
            if (e && e.currentTarget && e.type === 'click') return this.model.set('displayStyle', $(e.currentTarget).attr('data-view'));
            if (!this.model.get('minimized') || this.model.get('displayStyle') === 'sticky') return;
            this.model.set('displayStyle', this.model.get('displayStyle') === 'cornered' ? 'centered' : 'cornered');
        },

        activate: function () {
            if (this.model.get('lazy')) return this.model.set('lazy', false);
            ox.trigger('change:document:title', this.model.get('title'));
        },

        setTitle: function (title) {
            this.title = title;
            this.$header.find('h1 .title').text(title || '\u00A0');
            this.model.set('title', title);
            return this;
        },

        onChangeCount: function () {
            this.$header.find('h1 .count').toggle(this.model.get('count') > 0).text(this.model.get('count'));
        },

        minimize: function () {
            var app = ox.ui.App.getCurrentApp();
            if (app && app.get('title')) ox.trigger('change:document:title', app && app.get('title') ? app.get('title') : null);
            this.model.set('minimized', true);
        },

        onMinimize: function (e) {
            $('html').toggleClass('taskbar-visible', true);
            var self = this;
            if (!e && !e.type === 'click') this.minimize();

            var taskBarEl = $('#io-ox-taskbar').find('[data-cid="' + this.model.cid + '"]');
            var windowWidth = this.model.get('displayStyle') === 'cornered' ? this.$el.width() : $('body').width();
            var left = taskBarEl.offset().left + taskBarEl.width() / 2 - windowWidth / 2;
            var top = $('body').height() - this.$el.height() / 2;

            this.$el.velocity({ translateZ: 0, left: left + 'px', top: top + 'px', scale: 0.2, opacity: 0 }, {
                complete: function (el) {
                    var c = $(el).data('velocity');
                    c.transformCache = {};
                    $(el).removeAttr('style').data('velocity', c);
                    self.minimize();
                }
            });
        },

        toggle: function (model, minimized) {
            this.$el.toggle(!minimized);
            backdrop.toggle(collection.where({ minimized: false, floating: true }).length > 0);
        },

        render: function () {
            var title_id = _.uniqueId('title');
            this.$el.addClass('floating-window window-container')
                .addClass(this.model.get('displayStyle'))
                .addClass(this.model.get('size'))
                .attr({ 'aria-labelledby': title_id, tabindex: -1, role: 'dialog' })
                .append(
                    $('<div class="abs floating-window-content" role="document">').append(
                        this.$header = this.$header || $('<div class="floating-header abs">').append(
                            $('<h1>').append(
                                $('<span class="title">').attr('id', title_id).text(this.model.get('title') || '\u00A0'),
                                $('<span class="count label label-danger">').toggle(this.model.get('count') > 0).text(this.model.get('count'))
                            ),
                            this.renderWindowControls()
                        ),
                        $('<div class="floating-body abs">').append(this.$body)
                    )
                );
            return this;
        }
    });

    function remove() {
        collection.remove(this.model);
    }

    var TaskbarElement = DisposableView.extend({
        tagName: 'li',
        events: {
            'click [data-action="restore"]': 'onClick',
            'click [data-action="close"]': 'onClose'
        },
        initialize: function () {
            this.listenTo(this.model, {
                'close': this.onRemove,
                'change:title': this.onChangeTitle,
                'change:count': this.onChangeCount
            });
        },
        onClick: function () {
            if (this.$el) this.$el.addClass('active').siblings().removeClass('active');
            if (!this.model.get('floating')) {
                this.model.set('minimized', false);
                this.model.get('win').app.launch();
                return;
            }
            var initialState = this.model.get('minimized');
            collection.trigger('minimize');
            this.model.set('minimized', !initialState);
            ox.trigger('change:document:title', this.model.get('title'));
            this.model.trigger('lazyload');
        },

        onClose: function () {
            if (this.model.get('lazy')) {
                this.model.set('quitAfterLaunch', true);
                this.onClick();
            } else {
                this.model.trigger('quit');
            }
        },

        onRemove: function () {
            var model = this.model;
            var siblings = this.$el.siblings();
            this.$el.velocity('fadeOut', {
                duration: 200, complete: function (el) {
                    $(el).remove();
                    if ($(model.get('previousFocus')).is(':visible')) {
                        // Restore previous focus if possible
                        $(model.get('previousFocus')).focus();

                    } else if (siblings.length >= 1) {
                        // If previous focus can't be restored focus next minimized window in taskbar if present
                        siblings.first().focus();
                    } else if ($('.folder-tree').is(':visible')) {
                        // Reset focus to foldertree of current App if visible
                        $('.folder-tree:visible .folder.selected').focus();
                    } else {
                        a11y.getFirstFocusableListItem($('.window-container:visible').first()).visibleFocus();
                    }
                    collection.remove(model);
                }
            });
        },

        onChangeTitle: function () {
            var title = this.model.get('title').trim();
            this.$title.text(title);
            if (!this.model.get('minimized')) ox.trigger('change:document:title', this.model.get('title'));
        },

        onChangeCount: function () {
            this.$count.toggle(this.model.get('count') > 0).text(this.model.get('count'));
        },

        render: function () {
            this.$el.attr('data-cid', this.model.cid).append(
                $('<button type="button" class="taskbar-button" data-action="restore">').append(
                    this.$icon = this.model.get('taskbarIcon') ? $('<i class="fa">').addClass(this.model.get('taskbarIcon')) : $(),
                    this.$title = $('<span class="title">'),
                    this.$count = $('<span class="count label label-danger">')

                )
            );

            if (this.model.get('closable')) {
                this.$el.append($('<button type="button" class="btn btn-link pull-right" data-action="close">')
                    .append('<i class="fa fa-times" aria-hidden="true">')
                );
            }
            this.onChangeTitle();
            this.onChangeCount();
            $('#io-ox-taskbar').prepend(this.$el);
            return this;
        }
    });

    var TaskbarView = DisposableView.extend({
        el: '#io-ox-taskbar',
        initialize: function () {
            this.listenTo(collection, {
                'add remove change': this.toggle,
                'minimize': this.minimizeAll
            });
            this.listenTo(ox.ui.apps, 'launch resume', this.onLaunchResume);
        },
        minimizeAll: function () {
            collection.forEach(function (model) { model.set('minimized', true); });
        },
        toggle: function () {
            var taskbarVisible = collection.where({ minimized: true }).length > 0,
                hasStickyWindow = collection.where({ displayStyle: 'sticky' }).length > 0,
                backdropVisible = collection.where({ minimized: false, floating: true }).length > 0;

            $('html').toggleClass('taskbar-visible', taskbarVisible);
            $('#io-ox-windowmanager').toggleClass('has-sticky-window', hasStickyWindow);
            backdrop.toggle(backdropVisible);
        },
        onLaunchResume: function (app) {
            var model = app && app.get('window') && app.get('window').floating && app.get('window').floating.model;
            // minimize all on app change;
            collection.forEach(function (m) { m.set('minimized', true); });
            if (!model) return;
            model.set('minimized', false);
            collection.add(model);
        }
    });

    new TaskbarView().render();

    // used to add apps that do not use floating windows to the taskbar => office, planningview etc
    var addNonFloatingApp = function (app) {
        if (!app) return;

        var model = new WindowModel({
            floating: false,
            win: app.getWindow(),
            title: app.getTitle() || '',
            closable: true,
            minimized: false,
            taskbarIcon: app.get('userContentIcon')
        });

        app.on('change:title', function (app, title) { model.set('title', title); });

        model.once('quit', function () { app.quit(); });
        app.once('quit', function () { model.trigger('close'); });

        collection.add(model);
        if (app.get('hideTaskbarEntry') === true) return;
        new TaskbarElement({ model: model }).render();
    };

    return {
        View: WindowView,
        collection: collection,
        Model: WindowModel,
        TaskbarElement: TaskbarElement,
        addNonFloatingApp: addNonFloatingApp
    };

});
