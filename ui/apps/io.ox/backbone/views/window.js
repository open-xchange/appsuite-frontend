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
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (DisposableView, a11y, gt, settings) {

    'use strict';

    var collection = ox.ui.floatingWindows = new Backbone.Collection(),
        // selector for window container for convenience purpose
        container = '#io-ox-core',
        // used when dragging, prevents iframe event issues
        backdrop = $('<div id="floating-window-backdrop">'),
        minimalPixelsInside = 100,
        // shift for new windows in px
        shift = 30;

    var TaskbarView = DisposableView.extend({
        tagName: 'ul',
        id: 'io-ox-taskbar',
        className: 'f6-target',
        attributes: {
            role: 'toolbar',
            'aria-label': gt('Minimized windows'),
            'aria-hidden': true
            // Adding aria-roledescription would be nice in the future, but this is part of wai-aria 1.1
            // and should not be enabled for now, as there are inconsistencies between screen readers atm.
            // 'aria-roledescription': gt('Taskbar')
        },
        initialize: function () {
            this.listenTo(ox.ui.apps, 'launch resume', this.onLaunchResume);
        },
        onLaunchResume: function (app) {
            var model = app && app.get('window') && app.get('window').floating && app.get('window').floating.model;
            if (!model) return;
            model.set('minimized', false);
            collection.add(model);
        },
        addByCid: function (cid) {
            // minimizing a window moves it to the last position
            return this.add(this.$el.find('[data-cid="' + cid + '"]')).show();
        },
        updateTaskbar: function () {
            var items = this.$el.find('li').filter(function () {
                return $(this).css('display') !== 'none';
            });
            var hasItems = items.length > 0;
            $('html').toggleClass('taskbar-visible', hasItems);
            this.$el.toggleClass('f6-target', hasItems);
            if (hasItems) this.$el.removeAttr('aria-hidden');
            else this.$el.attr('aria-hidden', true);
        },
        add: function (el) {
            var isAddedToDom = el.parent().length === 0;
            this.$el.append(el);
            // we only need to update this for new nodes, if append was just used to change the order there is no need to update (is done via minimize attribute listener)
            if (isAddedToDom) this.updateTaskbar();
            return el;
        },
        render: function () {
            $('#io-ox-taskbar-container').empty().attr('aria-label', gt('Minimized windows')).append(this.$el);
            return this;
        }
    });

    var taskbar = new TaskbarView().render();

    var WindowModel = Backbone.Model.extend({

        defaults: {
            minimized: false,
            active: true,
            floating: true,
            lazy: false,
            mode: 'normal', // normal, maximized
            title: '',
            showInTaskbar: true,
            size: 'width-md', // -xs, -sm, -md, -lg,
            wasMoved: false,
            quitOnEscape: true,
            stickable: false,
            resizable: true,
            closable: false
        },

        initialize: function (options) {
            options = options || {};
            // if not given via options try to get the last used display mode for the app
            if (_.device('desktop') && settings.get('features/floatingWindows/preferredMode/enabled', true) && !options.mode && options.name && settings.get('features/floatingWindows/preferredMode/apps', {})[options.name]) {
                this.set('mode', settings.get('features/floatingWindows/preferredMode/apps', {})[options.name]);
            }
        }
    });

    var WindowView = DisposableView.extend({

        events: {
            'click [data-action="minimize"]':    'onMinimize',
            'click [data-action="close"]':       'onQuit',
            'click [data-action="stick"]':       'onStick',
            'click [data-action="normalize"]':   'toggleMode',
            'click [data-action="maximize"]':    'toggleMode',
            'dblclick .floating-header':         'toggleMode',
            'mousedown :not(.controls)':         'activate',
            'mousedown .floating-header':        'startDrag',
            'keydown':                           'onKeydown'
        },

        initialize: function (options) {

            this.options = options || {};
            this.listenTo(this, 'dispose', remove);

            if (!this.model) {
                this.model = new WindowModel(
                    _(this.options).pick('title', 'minimized', 'active', 'closable', 'win', 'taskbarIcon', 'width', 'height', 'showInTaskbar', 'size', 'mode', 'floating', 'sticky', 'stickable', 'resizable', 'quitOnEscape')
                );
            }

            this.model.set('previousFocus', document.activeElement, { silent: true });

            this.listenTo(this.model, {
                'activate': this.activate,
                'deactivate': this.deactivate,
                'change:mode': this.onChangeMode,
                'change:minimized': this.toggle,
                'change:count': this.onChangeCount,
                'change:sticky': this.onChangeStickyMode,
                'close': function () { this.$el.remove(); }
            });
            this.$body = this.options.$body || $('<div>');
            this.$body = this.$el.find('.window-container-center').length > 0 ? this.$el.find('.window-container-center') : this.$body;
            collection.add(this.model);
            if (!this.model.get('lazy') && this.model.get('showInTaskbar')) new TaskbarElement({ model: this.model }).render();

            //bind some functions
            _.bindAll(this, 'drag', 'stopDrag', 'keepInWindow', 'onResize');

            $(window).on('resize', this.keepInWindow, this.onResize);
            this.listenTo(this, 'dispose', function () { $(window).off('resize', this.keepInWindow); });
        },

        renderControls: function () {
            var isNormal = this.model.get('mode') === 'normal';
            var controls = [];
            if (this.model.get('stickable')) controls.push($('<button type="button" class="btn btn-link" data-action="stick" tabindex="-1">').attr('aria-label', gt('Stick to the right side')).append($('<i class="fa fa-window-maximize fa-rotate-90" aria-hidden="true">').attr('title', gt('Stick to the right side'))));
            if (this.model.get('resizable')) {
                //#. window resize
                controls.push($('<button type="button" class="btn btn-link" data-action="minimize" tabindex="-1">').attr('aria-label', gt('Minimize')).append($('<i class="fa fa-window-minimize" aria-hidden="true">').attr('title', gt('Minimize'))));
                //#. window resize
                controls.push($('<button type="button" class="btn btn-link" data-action="normalize" tabindex="-1">').attr('aria-label', gt('Shrink')).append($('<i class="fa fa-compress" aria-hidden="true">').attr('title', gt('Shrink'))).toggleClass('hidden', isNormal));
                //#. window resize
                controls.push($('<button type="button" class="btn btn-link" data-action="maximize" tabindex="-1">').attr('aria-label', gt('Maximize')).append($('<i class="fa fa-expand" aria-hidden="true">').attr('title', gt('Maximize'))).toggleClass('hidden', !isNormal));
            }
            if (this.model.get('closable')) controls.push($('<button type="button" class="btn btn-link" data-action="close" tabindex="-1">').attr('aria-label', gt('Close')).append($('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Close'))));
            // Remove tabindex attribute from first attribute to make it tabable
            if (controls.length > 0) controls[0].removeAttr('tabindex');
            return $('<div class="controls" role="toolbar">').append(controls);
        },

        onResize: function () {
            if (!this.model) return;

            if (this.model.get('forceChangeMode')) {
                this.model.set('forceChangeMode', false);
                this.model.set('noOverflow', !this.isOverfloating(this.$el));
                return;
            }

            if (!_.isBoolean(this.model.get('noOverflow'))) this.model.set('noOverflow', true);

            if (this.model.get('mode') === 'maximized' && this.isOverfloating(this.$el) && this.model.get('noOverflow')) {
                this.model.set('onResize', true);
                this.model.set('mode', 'normal');
            }

            this.model.set('noOverflow', !this.isOverfloating(this.$el));
        },

        isOverfloating: function (el) {
            // returns true if el overfloats the browser screen
            return el.position().left + el.width() > document.documentElement.clientWidth
                || el.position().top + el.height() > document.documentElement.clientHeight
                || el.position().left < 0
                || el.position().top < 0;
        },

        keepInWindow: function (usePadding) {
            if (!this.$el.is(':visible')) return;

            // maybe an event, never use padding if that's the case
            if (!_.isBoolean(usePadding)) usePadding = false;

            // return when minimized, the minimizing animation is playing or if not attached
            if (this.model.get('minimized') || this.minimizing || this.$el.parent().length === 0) return;

            // move window
            if (this.el.offsetLeft !== (minimalPixelsInside - this.el.offsetWidth) || this.el.offsetTop !== 0) {
                var left = Math.max(minimalPixelsInside - this.el.offsetWidth, Math.min($(container).width() - minimalPixelsInside, this.el.offsetLeft)),
                    top = Math.max(0, Math.min($(container).height() - minimalPixelsInside, this.el.offsetTop));

                if (usePadding) {
                    var spaceLeftX = $(container).width() - this.el.offsetWidth,
                        spaceLeftY = $(container).height() - this.el.offsetHeight;

                    if (spaceLeftX) {
                        // uncomment if padding is also desired on the left
                        // if (left < 16) left = Math.min(Math.floor(spaceLeftX / 2), 16);
                        if (left > spaceLeftX - 16) left = Math.max(0, spaceLeftX - 16);
                    }
                    if (spaceLeftY) {
                        // uncomment if padding is also desired on the top
                        // if (top < 16) top = Math.min(Math.floor(spaceLeftY / 2), 16);
                        if (top > spaceLeftY - 16) top = Math.max(0, spaceLeftY - 16);
                    }
                }

                this.$el.css({
                    left: left + 'px',
                    top: top + 'px'
                });

                // used by tinymce to calculate the topbar position
                this.trigger('move');
            }

            // resize window
            // doesn't really work if we allow overlapping

            // if there is enough space available, expand the window to original proportions, if not make it smaller
            /*if (this.el.offsetLeft === 0) {
                if (this.model.get('initialWidth') === undefined) this.model.set('initialWidth', this.el.offsetWidth);
                this.$el.css('width', Math.min($(container).width(), this.model.get('initialWidth')) + 'px');
            }

            // no height calculation for maximized windows
            if (this.model.get('mode') === 'normal' && this.el.offsetTop === 0) {
                if (this.model.get('initialHeight') === undefined) this.model.set('initialHeight', this.el.offsetHeight);
                this.$el.css('height', Math.min($(container).height(), this.model.get('initialHeight')) + 'px');
            }*/
        },

        startDrag: function (e) {
            // do nothing if the minimizing animation is playing
            if (this.minimizing) return;
            // only drag on left click
            if (e.which !== 1) return;
            // needed for safari to stop selecting the whole UI
            e.preventDefault();
            // set starting Position
            // silent so the taskbar does not redraw
            this.model.set('offsetX', e.clientX - this.el.offsetLeft, { silent: true });
            this.model.set('offsetY', e.clientY - this.el.offsetTop, { silent: true });
            // register handlers
            $(document).on('mousemove', this.drag);
            $(document).on('mouseup', this.stopDrag);

            this.lastActiveElement = $(document.activeElement);
            this.$el.focus();

            // add backdrop to prevent iframe drag issues
            $(container).append(backdrop);
            this.$el.addClass('dragging');
        },

        drag: function (e) {

            if (!this.model.get('wasMoved') && (this.$el.css('left') !== e.clientX - this.model.get('offsetX') + 'px' || this.$el.css('top') !== e.clientY - this.model.get('offsetY') + 'px')) {
                this.model.set('wasMoved', true);
            }

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
            if (this.lastActiveElement) {
                this.lastActiveElement.focus();
                this.lastActiveElement = null;
            }
            backdrop.remove();
            this.$el.removeClass('dragging');
            this.model.set('noOverflow', !this.isOverfloating(this.$el));
        },

        onQuit: function () {
            this.model.trigger('quit');
        },

        onStick: function () {
            this.model.set('sticky', true);
        },

        onKeydown: function (e) {
            this.onEscape(e);
            this.onTab(e);
        },

        onEscape: function (e) {
            if (e.which !== 27) return;
            if (e.isDefaultPrevented()) return;
            if (!this.model.get('quitOnEscape')) return;
            if ($(e.target).hasClass('mce-panel') || $(e.target).hasClass('mce-content-body') || $(e.target).hasClass('token-input')) return;
            this.onQuit();
        },

        onTab: function (e) {
            if (e.which !== 9) return;
            a11y.trapFocus(this.$el, e);
        },

        open: function () {
            var isSticky = this.model.get('sticky') === true;
            // special case: no app started yet (see CAS-267)
            if (!ox.ui.windowManager.getWindows().length) {
                $('#io-ox-windowmanager').toggle(isSticky);
                $('#io-ox-desktop').toggle(!isSticky);
            }
            if (isSticky) {
                $('#io-ox-windowmanager').append(
                    $('<div class="io-ox-windowmanager-sticky-panel border-left" role="region">').append(this.$body)
                );
                checkIfSticky();
                return this;
            }
            this.$('.floating-body').append(this.$body);
            $(container).append(this.$el);
            this.$el.focus();
            //if (backdrop.parents().length === 0) $('#io-ox-screens').append(backdrop);
            this.activate({ firstTime: true });
            checkIfSticky();
            return this;
        },

        onChangeMode: function () {
            this.model.set('forceChangeMode', true);

            // do nothing if the minimizing animation is playing
            if (this.minimizing) return;

            var isNormal = this.model.get('mode') === 'normal';

            var elOrigLeft = this.el.offsetLeft,
                elOrigWidth = this.el.offsetWidth;

            this.$('[data-action="normalize"]').toggleClass('hidden', isNormal);
            this.$('[data-action="maximize"]').toggleClass('hidden', !isNormal);
            this.$el.removeClass('normal maximized').addClass(this.model.get('mode'));
            this.$el.css({ height: '', width: '' });

            this.model.set({ 'initialWidth': this.el.offsetWidth, 'initialHeight': this.el.offsetHeight });
            $(window).trigger('changefloatingstyle');

            if (this.model.get('onResize')) {
                this.$el.css('left', elOrigLeft);
                this.model.set('onResize', false);
            } else {
                var percentage = (elOrigLeft / (document.documentElement.clientWidth - elOrigWidth)),
                    growingDiff = this.el.offsetWidth - elOrigWidth;
                this.$el.css('left', elOrigLeft - percentage * growingDiff);
            }

            this.$('.token-input.tt-input').trigger('updateWidth');

            // save value as new preference for this app
            if (_.device('desktop') && settings.get('features/floatingWindows/preferredMode/enabled', true) && this.model.get('name')) {
                var preferences = settings.get('features/floatingWindows/preferredMode/apps', {});
                preferences[this.model.get('name')] = this.model.get('mode');
                settings.set('features/floatingWindows/preferredMode/apps', preferences).save();
            }
            this.keepInWindow(this.model.get('mode') === 'maximized');
            _.defer(function () {
                $(window).trigger('resize');
            });
        },

        toggleMode: function (e) {
            // do nothing if the minimizing animation is playing
            if (this.minimizing) return;
            if (this.model.get('resizable') === false) return;
            // click on disabled header should not toggle the window
            if (e && $(e.currentTarget).attr('disabled') === 'disabled') return;
            this.model.set('mode', this.model.get('mode') === 'maximized' ? 'normal' : 'maximized');
        },

        shift: function () {
            // no auto positioning for moved windows
            if (this.model.get('wasMoved')) return;

            // get occupied positions of unmoved windows (number of unmoved windows is not enough here because there might be gaps due to minimized/closed windows)
            var occupiedPositions = _(collection.filter({ minimized: false, floating: true, wasMoved: false })).chain().without(this.model).pluck('attributes').pluck('shift').value(),
                nextValidPosition = _.difference(_.range(occupiedPositions.length), occupiedPositions)[0];

            if (!nextValidPosition) nextValidPosition = occupiedPositions.length;
            this.$el.css({
                left: this.$el.position().left + nextValidPosition * shift + 'px',
                top: this.$el.position().top + nextValidPosition * shift + 'px'
            });

            this.model.set('shift', nextValidPosition);
        },

        activate: function (e) {
            if (this.$el.hasClass('active')) return;
            collection.each(function (windowModel) { windowModel.trigger('deactivate'); });
            this.$el.addClass('active');
            this.model.set('active', true);

            // if this window does not have the focus, focus it now
            if (this.$el.has(document.activeElement).length === 0 && !e) {
                a11y.getTabbable(this.$body).first().focus();
            }

            if ($(container).width() < this.$el.width()) this.model.set('mode', 'normal');

            // shift new windows, so they don't fully overlap each other
            if (e && e.firstTime) {
                this.shift();
            }

            this.keepInWindow();
            if (e && e.firstTime && this.model.get('mode') === 'maximized') {
                this.$el.css('top', Math.max(0, Math.min(32, $(container).height() - this.$el.height())));
            }

            if (this.model.get('lazy')) return this.model.set('lazy', false);

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

        onChangeStickyMode: function () {
            if (this.$el.is(':visible')) this.$el.detach();
            else this.$body.closest('.io-ox-windowmanager-sticky-panel').detach();
            this.open();
        },

        minimize: function () {
            var app = ox.ui.App.getCurrentApp();
            if (app && app.get('title')) ox.trigger('change:document:title', app.get('title'));
            this.model.set('minimized', true);
            this.minimizing = false;
            this.$el.css({
                left: this.model.get('xPos'),
                top: this.model.get('yPos')
            });
        },

        onMinimize: function () {
            // don't animate multiple times
            if (this.minimizing) return;
            // doesn't have a taskbar entry, return
            if (!this.model.get('showInTaskbar')) return;
            var self = this;
            var taskBarEl = taskbar.addByCid(this.model.cid);
            var windowWidth = this.$el.width();
            var left = taskBarEl.offset().left + taskBarEl.width() / 2 - windowWidth / 2;
            var top = $('body').height() - this.$el.height() / 2;

            this.minimizing = true;
            this.$el.velocity({ translateZ: 0, left: left + 'px', top: top + 'px', scale: 0.2, opacity: 0 }, {
                complete: function (el) {
                    var c = $(el).data('velocity');
                    c.transformCache = {};
                    $(el).removeAttr('style').data('velocity', c);
                    self.minimize();
                    self.minimizing = false;
                }
            });
        },

        toggle: function (model, minimized) {
            this.$el.toggle(!minimized);
            checkIfSticky();
            if (minimized) return this.deactivate();
            this.activate();
            // shift window if needed (no 100% overlapping)
            this.shift();
        },

        render: function () {
            var title_id = _.uniqueId('title');
            this.$el.addClass('floating-window window-container')
                .addClass(this.model.get('mode'))
                .addClass(this.model.get('size'))
                .attr({ 'aria-labelledby': title_id, tabindex: -1, role: 'dialog' })
                .append(
                    $('<div class="abs floating-window-content" role="document">').append(
                        this.$header = this.$header || $('<div class="floating-header abs">').append(
                            $('<h1>').append(
                                $('<span class="title">').attr('id', title_id).text(this.model.get('title') || '\u00A0'),
                                $('<span class="count label label-danger">').toggle(this.model.get('count') > 0).text(this.model.get('count'))
                            ),
                            this.renderControls()
                        ),
                        $('<div class="floating-body abs">').append(this.$body)
                    )
                );
            return this;
        }
    });

    function remove() {
        collection.remove(this.model);
        taskbar.updateTaskbar();
    }

    var TaskbarElement = DisposableView.extend({
        tagName: 'li',
        attributes: {
            role: 'presentation'
        },
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
            if (!this.model.get('floating') && this.model.get('win')) {
                this.model.set('minimized', false);
                this.model.get('win').app.launch();
                return;
            }
            this.model.set('minimized', false);
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
                    // some apps have a special way of closing. Mail compose closes with a big delay for example (waits for errors on send before it fully closes etc)
                    // make sure collection and taskbar are properly cleaned up
                    collection.remove(model);
                    taskbar.updateTaskbar();
                }
            });
        },

        onChangeTitle: function () {
            var title = this.model.get('title') || '';
            title = title.trim();
            this.$title.text(title);
            this.$button.attr('aria-label', title);
            if (!this.model.get('minimized')) ox.trigger('change:document:title', this.model.get('title'));
        },

        onChangeCount: function () {
            this.$count.toggle(this.model.get('count') > 0).text(this.model.get('count'));
        },

        onChangeMinimized: function (options) {
            options = options || {};
            this.$el.toggle(this.model.get('minimized'));
            // don't grab the focus if this is just called from the render function (savepoints start minimized but shouldn't grab the focus when drawn for the first time)
            if (!options.isRender && this.model.get('minimized')) this.$el.find('[data-action="restore"]').focus();
            taskbar.updateTaskbar();
        },

        render: function () {
            this.$el.attr('data-cid', this.model.cid).append(
                this.$button = $('<button type="button" class="taskbar-button" data-action="restore">').append(
                    this.$icon = this.model.get('taskbarIcon') ? $('<i class="fa" aria-hidden="true">').addClass(this.model.get('taskbarIcon')) : $(),
                    this.$title = $('<span role="presentation" class="title" aria-hidden="true">'),
                    this.$count = $('<span role="presentation" class="count label label-danger">'),
                    // margin-right-auto for flex
                    $('<span role="presentation" class="spacing">'),
                    $('<i role="presentation" class="maximize-icon pull-right fa fa-window-maximize" aria-hidden="true">')
                )
            );

            this.onChangeTitle();
            this.onChangeCount();
            this.onChangeMinimized({ isRender: true });

            taskbar.add(this.$el);
            return this;
        }
    });

    // used to add apps that do not use floating windows to the taskbar => office, planningview etc
    // options: lazyload - used by restore points to create taskbarentries without starting the app
    var addNonFloatingApp = function (app, options) {
        if (!app) return;

        // this is for apps that have a lot of rampup to do
        // once they are ready trigger revealApp and it shows up
        if (app.get('startHidden')) {
            app.once('revealApp', function () {
                app.set('startHidden', false);
                addNonFloatingApp(app, options);
            });
            return;
        }

        var win = app.getWindow();

        // no duplicates
        if (collection.findWhere({ appId: app.id }) && collection.findWhere({ appId: app.id }).get('win')) return;

        options = options || {};

        var model = collection.findWhere({ appId: app.id });

        // in case of lazyloading a non floating app only the window is missing
        if (model) {
            model.set('win', win);
        } else {
            model = new WindowModel({
                floating: false,
                win: win,
                title: app.getTitle() || '',
                closable: true,
                minimized: !!options.lazyload,
                taskbarIcon: app.get('userContentIcon'),
                appId: app.id
            });
        }

        var toggleNonFloating = function () {
            model.set('minimized', !this.state.visible);
            // minimizing a window moves it to the last position
            if (!this.state.visible) taskbar.add(taskbarItem.$el);
        };

        if (!options.lazyload) {
            app.on('change:title', function (app, title) { model.set('title', title); });

            model.once('quit', function () { app.quit(); });
            app.once('quit', function () { model.trigger('close'); });
            app.on('app:deregistertaskbar', function () { win.off('hide show', toggleNonFloating); });
            win.on('quit', function () { win.off('hide show', toggleNonFloating); });
        }

        if (!collection.findWhere({ appId: app.id })) collection.add(model);
        if (app.get('hideTaskbarEntry') === true) return;

        var taskbarItem = app.taskbarItem || new TaskbarElement({ model: model }).render();
        app.taskbarItem = taskbarItem;

        if (!options.lazyload) {
            win.on('hide show', toggleNonFloating);
        }

        return taskbarItem;
    };

    function checkIfSticky() {
        // add marker class if we find a sticky non minimized window
        $('#io-ox-screens').toggleClass('has-sticky-window', !!collection.findWhere({ sticky: true, minimized: false }));
    }

    return {
        View: WindowView,
        collection: collection,
        Model: WindowModel,
        TaskbarElement: TaskbarElement,
        addNonFloatingApp: addNonFloatingApp
    };

});
