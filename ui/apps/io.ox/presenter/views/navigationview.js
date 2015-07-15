/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/views/navigationview', [
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/core'
], function (DisposableView, Ext, LinksPattern, ActionsPattern, Dropdown, gt) {

    /**
     * The NavigationView is responsible for displaying the bottom navigation bar.
     */

    'use strict';

    // define constants
    var NAVIGATION_ID = 'io.ox/presenter/navigation',
        NAVIGATION_LINKS_ID = NAVIGATION_ID + '/links',

        NAVIGATION_ACTION_ID = 'io.ox/presenter/actions/navigation',
        NAVIGATION_DROPDOWN_ID = NAVIGATION_ACTION_ID + '/dropdown',

        TOOLBAR_ACTION_ID = 'io.ox/presenter/actions/toolbar';

    /**
     * Creates the HTML mark-up for a slide navigation button.
     *
     * @param {String} type
     *  the button type to create, could be 'prev' or 'next'.
     *
     * @returns {jQuery}
     *  the button node.
     */
    function createNavigationButton (type) {
        var button = $('<a href="#" class="presenter-navigation-slide-button" tabindex="1" role="menuitem">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.attr((type === 'next') ? { title: gt('Next slide'), 'aria-label': gt('Next slide') } : { title: gt('Previous slide'), 'aria-label': gt('Previous slide') });
        icon.addClass((type === 'next') ? 'fa-arrow-down' : 'fa-arrow-up');
        return button.append(icon);
    }

    // define extension points for this NavigationView
    var navigationPoint = Ext.point(NAVIGATION_ID),
        // navigation link meta object used to generate extension points later
        navigationLinksMeta = {
            'pause': {
                prio: 'hi',
                mobile: 'lo',
                //icon: 'fa fa-pause',
                label: gt('Pause presentation'),
                ref: NAVIGATION_ACTION_ID + '/pause',
                customize: function () {
                    this.addClass('presenter-toolbar-pause')
                        .attr({
                            tabindex: '1',
                            title: gt('Pause Presentation'),
                            'aria-label': gt('Pause Presentation')
                        });
                    //this.parent().addClass('pull-left');
                }
            },
            'continue': {
                prio: 'hi',
                mobile: 'lo',
                //icon: 'fa fa-pause',
                label: gt('Continue presentation'),
                ref: NAVIGATION_ACTION_ID + '/continue',
                customize: function () {
                    this.addClass('presenter-toolbar-continue')
                        .attr({
                            tabindex: '1',
                            title: gt('Continue Presentation'),
                            'aria-label': gt('Continue Presentation')
                        });
                    //this.parent().addClass('pull-left');
                }
            },
            'fullscreen': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-arrows-alt',
                label: gt('Toggle fullscreen'),
                ref: TOOLBAR_ACTION_ID + '/fullscreen',

                customize: function () {
                    this.addClass('presenter-toolbar-fullscreen').attr({
                        tabindex: '1',
                        title: gt('Toggle fullscreen'),
                        'aria-label': gt('Toggle fullscreen')
                    });
                }
            }

        };

    // iterate link meta and create link extensions
    var linkIndex = 0;
    _.each(navigationLinksMeta, function (linkMeta, linkId) {
        linkMeta.id = linkId;
        linkMeta.index = (linkIndex += 100);
        Ext.point(NAVIGATION_LINKS_ID).extend(new LinksPattern.Link(linkMeta));
    });

    //extend navigation extension point with the navigation links
    navigationPoint.extend(new LinksPattern.InlineLinks({
        id: 'presenter-navigation-links',
        dropdown: true,
        compactDropdown: true,
        ref: NAVIGATION_LINKS_ID,
        customize: function () {
            this.addClass('dropup');
        }
    }));

    // Slide navigation
    Ext.point(NAVIGATION_ID).extend({
        id: 'slide-navigation',
        index: 100,
        draw: function (baton) {
            baton.context.renderPageNavigation();
        }
    });

    // Participants drop down
    Ext.point(NAVIGATION_ID).extend({
        id: 'participants-dropdown',
        index: 200,
        draw: function (baton) {
            if (!baton.context) { return; }
            //if (_.device('smartphone')) return;

            var dropdown,
                participantsJoined = false,
                rtModel = baton.context.app.rtModel,
                presenterId = rtModel.get('presenterId') || 'none',
                presenterName = rtModel.get('presenterName') || gt('none'),
                participants = rtModel.get('participants');

            dropdown = new Dropdown({ model: baton.context.app.rtModel, label: gt('Participants'), tagName: 'li', caret: true })
                .header(gt('Presenter'))
                .link(presenterId, presenterName, null)
                .divider()
                .header(gt('Participants'));

            _.each(participants, function (user) {
                if (!rtModel.isPresenter(user.userId)) {
                    participantsJoined = true;
                    dropdown.link(user.userId, user.userDisplayName, null);
                }
            }, this);

            if (!participantsJoined) {
                dropdown.link('none', gt('none'), null);
            }

            this.append(
                dropdown.render().$el.addClass('dropup presenter-participants-dropdown').attr('data-dropdown', 'view')
            );
        }
    });

    // define actions of this NavigationView
    var Action = ActionsPattern.Action;
    new Action(NAVIGATION_DROPDOWN_ID, {
        requires: function () { return true; },
        action: $.noop
    });

    new Action(NAVIGATION_ACTION_ID + '/pause', {
        id: 'pause',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canPause(userId));
        },
        action: function (baton) {
            console.info('pause action:', baton);
            baton.context.app.rtConnection.pausePresentation();
        }
    });

    new Action(NAVIGATION_ACTION_ID + '/continue', {
        id: 'continue',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canContinue(userId));
        },
        action: function (baton) {
            console.info('continue action:', baton);
            baton.context.app.rtConnection.continuePresentation();
        }
    });

    // define the Backbone view
    var NavigationView = DisposableView.extend({

        className: 'presenter-navigation',

        tagName: 'ul',

        initialize: function (options) {
            _.extend(this, options);
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));

            // register event handlers
            this.listenTo(this.presenterEvents, 'presenter:local:slide:change', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.render);
            this.listenTo(this.presenterEvents, 'presenter:participants:change', this.render);
        },

        /**
         * Renders this NavigationView.
         *
         * @returns {NavigationView}
         *  this view object itself.
         */
        render: function () {
            //console.info('NavigationView.render()');
            // draw navigation
            var navigation = this.$el.attr({ role: 'menu', 'aria-label': gt('Presenter Navigation') }),
                userId = this.app.rtConnection.getRTUuid(),
                rtModel = this.app.rtModel,
                baton = Ext.Baton({
                    context: this,
                    $el: navigation,
                    model: this.model,
                    models: [this.model],
                    data: this.model.toJSON()
                });
            // render navigation links
            navigation.empty();
            // the navigation panel is displayed for the presenter only and if the presentation is not paused.
            if (rtModel.isPresenter(userId) && !rtModel.isPaused()) {
                navigationPoint.invoke('draw', navigation, baton);
            }
            //navigationPoint.invoke('draw', navigation, baton);
            return this;
        },

        /**
         * Renders the slide navigation controls.
         */
        renderPageNavigation: function () {
            var // navigation buttons
                prev = createNavigationButton('prev'),
                next = createNavigationButton('next'),
                // slide input field
                slideInput = $('<input type="text" class="presenter-navigation-slide" tabindex="1" role="textbox">'),
                slideInputWrapper = $('<div class="presenter-navigation-slide-wrapper">').append(slideInput),
                // slide count
                slideCountDisplay = $('<div class="presenter-navigation-slide-total">'),
                group = $('<li class="presenter-navigation-slide-group" role="presentation">'),
                // slide data
                slideNumber = this.app.mainView.presentationView.getActiveSlideIndex() + 1,
                slideCount = this.app.mainView.presentationView.getSlideCount(),
                self = this;

            function setButtonState(nodes, state) {
                if (state) {
                    $(nodes).removeClass('disabled').removeAttr('aria-disabled');
                } else {
                    $(nodes).addClass('disabled').attr('aria-disabled', true);
                }
            }
            function onPrevSlide (event) {
                event.preventDefault();
                self.app.mainView.showPreviousSlide();
            }
            function onNextSlide (event) {
                event.preventDefault();
                self.app.mainView.showNextSlide();
            }
            function onInputKeydown(event) {
                event.stopPropagation();
                var keyCode = event.which;
                if (keyCode === 13 || keyCode === 27) {
                    self.$el.parent().focus();
                }
            }
            function onInputChange() {
                var newValue = parseInt($(this).val()),
                    oldValue = parseInt($(this).attr('data-page-number'));

                if (isNaN(newValue) || newValue > slideCount || newValue <= 0 ) {
                    $(this).val(oldValue);
                    return;
                }
                setButtonState([prev[0], next[0]], true);
                if (newValue === 1) {
                    setButtonState(prev, false);
                }
                if (newValue === slideCount) {
                    setButtonState(next, false);
                }
                $(this).attr('data-page-number', newValue);
                self.app.mainView.showSlide(newValue - 1);
            }

            // updates slide number in the slide input control
            slideInput.val(slideNumber).attr('data-page-number', slideNumber).trigger('change');
            slideCountDisplay.text(gt('of %1$d', slideCount));

            slideInput.on('keydown', onInputKeydown).on('change', onInputChange);
            prev.on('click', onPrevSlide);
            next.on('click', onNextSlide);

            group.append(prev, next, slideInputWrapper, slideCountDisplay);
            this.$el.prepend(group);
        },

        /**
         * Destructor of this view
         */
        disposeView: function () {
            this.model = null;
        }

    });

    return NavigationView;

});
