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

    var collection = new Backbone.Collection(),
        // selector for window container for convenience purpose
        container = '#io-ox-core',
        // used when dragging, prevents iframe event issues
        backdrop = $('<div id="floating-window-backdrop">');

    var WindowModel = Backbone.Model.extend({
        defaults: {
            minimized: false,
            active: true,
            floating: true,
            lazy: false,
            displayStyle: 'normal',
            title: '',
            showStickybutton: false,
            showInTaskbar: true,
            size: 'width-md' // -xs, -sm, -md, -lg
        }
    });

    var WindowView = DisposableView.extend({

        events: {
            'click [data-action="minimize"]': 'onMinimize',
            'click [data-action="close"]':    'onQuit',
            'mousedown :not(.controls)':      'activate',
            'mousedown .floating-header':     'startDrag',
            'keydown':                        'onKeydown',
            'dblclick .floating-header':      'toggleDisplaystyle',
            'click button[data-view]':        'toggleDisplaystyle'
        },

        initialize: function (options) {
            this.options = options || {};
            this.listenTo(this, 'dispose', remove);

            if (!this.model) {
                this.model = new WindowModel(
                    _(options).pick('title', 'minimized', 'active', 'closable', 'win', 'showStickybutton', 'taskbarIcon', 'width', 'height', 'showInTaskbar', 'size')
                );
            }

            this.model.set('previousFocus', document.activeElement, { silent: true });

            this.listenTo(this.model, {
                'activate': this.activate,
                'deactivate': this.deactivate,
                'change:displayStyle': this.changeDisplayStyle,
                'change:minimized': this.toggle,
                'change:count': this.onChangeCount,
                'close': function () { this.$el.remove(); }
            });
            this.$body = this.options.$body || $('<div>');
            this.$body = this.$el.find('.window-container-center').length > 0 ? this.$el.find('.window-container-center') : this.$body;
            collection.add(this.model);
            if (!this.model.get('lazy')) new TaskbarElement({ model: this.model }).render();

            //bind some functions
            _.bindAll(this, 'drag', 'stopDrag', 'keepInWindow');

            $(window).on('resize', this.keepInWindow);
            this.listenTo(this, 'dispose', function () { $(window).off('resize', this.keepInWindow); });
        },

        renderWindowControls: function () {
            var isNormal = this.model.get('displayStyle') === 'normal';
            this.$displayStyleToggle =
                $('<button type="button" class="btn btn-link">').attr('data-view', isNormal ? 'maximized' : 'normal').append(
                    $('<i class="fa" aria-hidden="true">').addClass(isNormal ? 'fa-expand' : 'fa-compress')
                );
            return $('<div class="controls">').append(
                $('<button type="button" class="btn btn-link" data-action="minimize">').attr('title', gt('Minimize')).append($('<i class="fa fa-window-minimize" aria-hidden="true">')),
                this.$displayStyleToggle,
                this.model.get('showStickybutton') ? $('<button type="button" class="btn btn-link" data-view="sticky">').append('<i class="fa fa-thumb-tack" aria-hidden="true">') : '',
                this.model.get('closable') ? $('<button type="button" class="btn btn-link" data-action="close">').append('<i class="fa fa-times" aria-hidden="true">') : ''
            );
        },

        keepInWindow: function () {
            // return when minimized or not attached
            if (this.model.get('minimized') || this.$el.parent().length === 0) return;

            // move window
            if (this.el.offsetLeft !== 0 || this.el.offsetTop !== 0) {
                this.$el.css({
                    left: Math.max(0, Math.min($(container).width() - this.el.offsetWidth, this.el.offsetLeft)) + 'px',
                    top: Math.max(0, Math.min($(container).height() - this.el.offsetHeight, this.el.offsetTop)) + 'px'
                });
                // used by tinymce to calculate the topbar position
                this.trigger('move');
            }

            // resize window
            // if there is enough space available, expand the window to original proportions, if not make it smaller
            if (this.el.offsetLeft === 0) {
                if (this.model.get('initialWidth') === undefined) this.model.set('initialWidth', this.el.offsetWidth);
                this.$el.css('width', Math.min($(container).width(), this.model.get('initialWidth')) + 'px');
            }

            // no height calculation for maximized windows
            if (this.model.get('displayStyle') === 'normal' && this.el.offsetTop === 0) {
                if (this.model.get('initialHeight') === undefined) this.model.set('initialHeight', this.el.offsetHeight);
                this.$el.css('height', Math.min($(container).height(), this.model.get('initialHeight')) + 'px');
            }
        },

        startDrag: function (e) {
            //only drag on left click
            if (!e.which === 1) return;
            // needed for safari to stop selecting the whole UI
            e.preventDefault();
            // set starting Position
            // silent so the taskbar does not redraw
            this.model.set('offsetX', e.clientX - this.el.offsetLeft, { silent: true });
            this.model.set('offsetY', e.clientY - this.el.offsetTop, { silent: true });
            // register handlers
            $(document).on('mousemove', this.drag);
            $(document).on('mouseup', this.stopDrag);
            // add backdrop to prevent iframe drag issues
            $(container).append(backdrop);
        },

        drag: function (e) {
            // apply changes and adjust to window
            this.$el.css({
                left: e.clientX - this.model.get('offsetX') + 'px',
                top: e.clientY - this.model.get('offsetY') + 'px'
            });
            this.keepInWindow();
            // failsafe, if the button is no longer pressed we stop the dragging
            if (e.which !== 1) this.stopDrag();
        },

        stopDrag: function () {
            // save pos so it can be restored after minimize maximize
            // silent so the taskbar does not redraw
            this.model.set('xPos', this.$el.css('left'), { silent: true });
            this.model.set('yPos', this.$el.css('top'), { silent: true });

            $(document).off('mousemove', this.drag);
            $(document).off('mouseup', this.stopDrag);
            backdrop.remove();
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
            $(container).append(this.$el);
            this.$el.focus();
            //if (backdrop.parents().length === 0) $('#io-ox-screens').append(backdrop);
            this.activate();
            return this;
        },

        changeDisplayStyle: function (model, style) {
            var isNormal = style === 'normal';
            this.$displayStyleToggle.attr('data-view', isNormal ? 'maximized' : 'normal')
                .find('i').toggleClass('fa-expand', isNormal).toggleClass('fa-compress', !isNormal);
            // sticky windows push the rest of appsuite to the left. So an indicator class is needed
            $('#io-ox-windowmanager').toggleClass('has-sticky-window', style === 'sticky');
            this.$el.removeClass('normal maximized sticky').addClass(style);

            // clean up css on display style change
            this.$el.css({
                height: '',
                width: ''
            });
            this.model.set('initialWidth', this.el.offsetWidth);
            this.model.set('initialHeight', this.el.offsetHeight);

            $(window).trigger('changefloatingstyle');
            _.defer(function () { $(window).trigger('resize'); });
        },

        toggleDisplaystyle: function (e) {
            if (e.type === 'dblclick') return this.model.set('displayStyle', this.$displayStyleToggle.attr('data-view'));
            if (e && e.currentTarget && e.type === 'click') return this.model.set('displayStyle', $(e.currentTarget).attr('data-view'));
            if (!this.model.get('minimized') || this.model.get('displayStyle') === 'sticky') return;
            this.model.set('displayStyle', this.model.get('displayStyle') === 'normal' ? 'maximized' : 'normal');
        },

        activate: function () {
            if (this.$el.hasClass('active')) return;
            collection.each(function (windowModel) { windowModel.trigger('deactivate'); });
            this.$el.addClass('active');
            this.model.set('active', true);

            // if this window does not have the focus, focus it now
            if (this.$el.has(document.activeElement).length === 0) {
                a11y.getTabbable(this.$body).first().focus();
            }

            if (this.model.get('lazy')) return this.model.set('lazy', false);
            this.keepInWindow();
            ox.trigger('change:document:title', this.model.get('title'));
        },

        deactivate: function () {
            this.$el.removeClass('active');
            this.model.set('active', false);
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
            if (app && app.get('title')) ox.trigger('change:document:title', app.get('title'));
            this.model.set('minimized', true);
            this.$el.css({
                left: this.model.get('xPos'),
                top: this.model.get('yPos')
            });
        },

        onMinimize: function () {
            var self = this;

            var taskBarEl = $('#io-ox-taskbar').find('[data-cid="' + this.model.cid + '"]');
            // minimizing a window moves it to the last position
            $('#io-ox-taskbar').append(taskBarEl);
            taskBarEl.show();
            var windowWidth = this.model.get('displayStyle') === 'normal' ? this.$el.width() : $('body').width();
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
            if (minimized) {
                this.deactivate();
                return;
            }
            this.activate();
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
            'click [data-action="restore"]': 'onClick'
        },
        initialize: function () {
            this.listenTo(this.model, {
                'close': this.onRemove,
                'change:title': this.onChangeTitle,
                'change:count': this.onChangeCount,
                'change:minimized': this.onChangeMinimized
            });
        },
        onClick: function () {
            if (!this.model.get('floating')) {
                this.model.set('minimized', false);
                this.model.get('win').app.launch();
                return;
            }
            var initialState = this.model.get('minimized');
            this.model.set('minimized', !initialState);
            ox.trigger('change:document:title', this.model.get('title'));
            this.model.trigger('lazyload');
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
                        a11y.focusListSelection($('.window-container:visible').first());
                    }
                    collection.remove(model);
                }
            });
        },

        onChangeTitle: function () {
            var title = this.model.get('title').trim();
            this.$title.text(title);
            this.$el.attr('title', title);
            if (!this.model.get('minimized')) ox.trigger('change:document:title', this.model.get('title'));
        },

        onChangeCount: function () {
            this.$count.toggle(this.model.get('count') > 0).text(this.model.get('count'));
        },

        onChangeMinimized: function () {
            this.$el.toggle(this.model.get('minimized'));
        },

        render: function () {
            this.$el.attr('data-cid', this.model.cid).append(
                $('<button type="button" class="taskbar-button" data-action="restore">').append(
                    this.$icon = this.model.get('taskbarIcon') ? $('<i class="fa">').addClass(this.model.get('taskbarIcon')) : $(),
                    this.$title = $('<span class="title">'),
                    this.$count = $('<span class="count label label-danger">'),
                    // margin-right-auto for flex
                    $('<span class="spacing">'),
                    $('<i class="maximize-icon pull-right fa fa-window-maximize" aria-hidden="true">')
                )
            );

            this.onChangeTitle();
            this.onChangeCount();
            this.onChangeMinimized();

            $('#io-ox-taskbar').append(this.$el);
            return this;
        }
    });

    var TaskbarView = DisposableView.extend({
        el: '#io-ox-taskbar',
        initialize: function () {
            this.listenTo(collection, {
                'add remove change': this.toggle
            });
            this.listenTo(ox.ui.apps, 'launch resume', this.onLaunchResume);
        },

        toggle: function () {
            var hasStickyWindow = collection.where({ displayStyle: 'sticky' }).length > 0;

            $('#io-ox-windowmanager').toggleClass('has-sticky-window', hasStickyWindow);
        },
        onLaunchResume: function (app) {
            var model = app && app.get('window') && app.get('window').floating && app.get('window').floating.model;
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

        var taskbarItem = new TaskbarElement({ model: model }).render();
        app.getWindow().on('hide show', function () {
            model.set('minimized', !this.state.visible);
            // minimizing a window moves it to the last position
            if (!this.state.visible) $('#io-ox-taskbar').append(taskbarItem.$el);
        });
    };

    return {
        View: WindowView,
        collection: collection,
        Model: WindowModel,
        TaskbarElement: TaskbarElement,
        addNonFloatingApp: addNonFloatingApp
    };

});
