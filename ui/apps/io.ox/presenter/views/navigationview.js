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
    'gettext!io.ox/presenter',
    'io.ox/presenter/actions'
], function (DisposableView, Ext, LinksPattern, ActionsPattern, Dropdown, gt) {

    /**
     * The NavigationView is responsible for displaying the bottom navigation bar.
     */

    'use strict';

    // define constants
    var NAVIGATION_ID = 'io.ox/presenter/navigation',
        NAVIGATION_LINKS_ID = NAVIGATION_ID + '/links',
        NAVIGATION_DROPDOWN_ID = 'io.ox/presenter/actions/navigation/dropdown',
        PRESENTER_ACTION_ID = 'io.ox/presenter/actions';

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
        var button = $('<a href="#" class="presenter-navigation-slide-button" tabindex="1" role="menuitem" aria-disabled="false">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.attr((type === 'next') ? {
            //#. button tooltip for 'go to next presentation slide' action
            title: gt('Next slide'),
            'aria-label': gt('Next slide')
        } : {
            //#. button tooltip for 'go to previous presentation slide' action
            title: gt('Previous slide'),
            'aria-label': gt('Previous slide')
        });
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
                //#. button label for pausing the presentation
                label: gt('Pause presentation'),
                ref: PRESENTER_ACTION_ID + '/pause',
                customize: function () {
                    this.addClass('presenter-toolbar-pause')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for pausing the presentation
                            title: gt('Pause presentation'),
                            'aria-label': gt('Pause presentation')
                        });
                }
            },
            'continue': {
                prio: 'hi',
                mobile: 'lo',
                //#. button label for continuing the presentation
                label: gt('Continue presentation'),
                ref: PRESENTER_ACTION_ID + '/continue',
                customize: function () {
                    this.addClass('presenter-toolbar-continue')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for continuing the presentation
                            title: gt('Continue presentation'),
                            'aria-label': gt('Continue presentation')
                        });
                }
            },
            'fullscreen': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-arrows-alt',
                //#. button label for toggling fullscreen mode
                label: gt('Toggle fullscreen'),
                ref: PRESENTER_ACTION_ID + '/fullscreen',

                customize: function () {
                    this.addClass('presenter-toolbar-fullscreen').attr({
                        tabindex: '1',
                        //#. button label for toggling fullscreen mode
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
            baton.context.renderSlideNavigation();
        }
    });

    // Participants drop down
    Ext.point(NAVIGATION_ID).extend({
        id: 'participants-dropdown',
        index: 200,
        draw: function (baton) {
            if (!baton.context) { return; }
            //if (_.device('smartphone')) return;

            function quoteId (id) {
                return id.replace( /(:|@|\/|\.|\[|\]|,)/g, '\\$1' );
            }

            var dropdown,
                participantsJoined = false,
                rtModel = baton.context.app.rtModel,
                presenterId = rtModel.get('presenterId') || 'none',
                presenterName = rtModel.get('presenterName') ||
                    //#. text of an user list that shows the names of presenting user and participants.
                    //#. the text to display as presenter name if no user is presenting yet.
                    gt('none'),
                participants = rtModel.get('participants');

            dropdown = new Dropdown({
                model: baton.context.app.rtModel,
                //#. text of an user list that shows the names of presenting user and participants.
                //#. the dropdown button label for the participants dropdown.
                label: gt('Participants'),
                tagName: 'li',
                caret: true
            })
                //#. text of an user list that shows the names of presenting user and participants.
                //#. the presenter section label.
                .header(gt('Presenter'))
                .link(presenterId, presenterName, null)
                .divider()
                //#. text of an user list that shows the names of presenting user and participants.
                //#. the participants section label.
                .header(gt('Participants'));

            _.each(participants, function (user) {
                if (!rtModel.isPresenter(user.userId)) {
                    participantsJoined = true;
                    dropdown.link(user.userId, user.userDisplayName, null);
                }
                // add halo link data
                var link = dropdown.$ul.find('a[data-name=' + quoteId(user.userId) + ']');
                link.addClass('halo-link').data({ internal_userid: user.id });

            }, this);

            if (!participantsJoined) {
                //#. text of an user list that shows the names of presenting user and participants.
                //#. the text to display as participants names if no users are listening yet.
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
            this.listenTo(this.presenterEvents, 'presenter:fullscreen:enter', this.render);
            this.listenTo(this.presenterEvents, 'presenter:fullscreen:exit', this.render);
        },

        /**
         * Renders this NavigationView.
         *
         * @returns {NavigationView}
         *  this view object itself.
         */
        render: function () {
            // draw navigation
            //#. aria label for the presenter navigation bar, for screen reader only.
            var navigation = this.$el.attr({ role: 'menu', 'aria-label': gt('Presenter navigation bar') }),
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
            return this;
        },

        /**
         * Renders the slide navigation controls.
         */
        renderSlideNavigation: function () {
            var // navigation buttons
                prev = createNavigationButton('prev'),
                next = createNavigationButton('next'),
                // slide input field
                slideInput = $('<input type="text" class="presenter-navigation-slide" tabindex="1" role="textbox">'),
                slideInputWrapper = $('<div class="presenter-navigation-slide-wrapper">').append(slideInput),
                // slide count display
                slideCountDisplay = $('<div class="presenter-navigation-slide-total">'),
                group = $('<li class="presenter-navigation-slide-group" role="presentation">'),
                // slide number and count
                slideNumber = this.app.mainView.getActiveSlideIndex() + 1,
                slideCount = this.app.mainView.getSlideCount(),
                safariFullscreen = this.app.mainView.fullscreen && _.device('safari'),
                self = this;

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
                var newValue = parseInt($(this).val());

                if (isNaN(newValue)) {
                    $(this).val(slideNumber);
                    return;

                } else if (newValue <= 0 ) {
                    $(this).val(1);
                    newValue = 1;

                } else if (newValue > slideCount) {
                    $(this).val(slideCount);
                    newValue = slideCount;
                }

                self.app.mainView.showSlide(newValue - 1);
            }

            // set slide number in the slide input control
            slideInput.val(slideNumber);
            // Safari blocks almost all key events to input controls in fullscreen mode. see: https://bugs.webkit.org/show_bug.cgi?id=121496
            if (safariFullscreen) {
                slideInput.attr({ readonly: true, disabled: true, 'aria-readonly': true });
            }
            //#. text of a presentation slide count display
            //#. Example result: "of 10"
            //#. %1$d is the total slide count
            slideCountDisplay.text(gt('of %1$d', slideCount));
            if (slideNumber === 1) {
                prev.addClass('disabled').attr('aria-disabled', true);
            }
            if (slideNumber === slideCount) {
                next.addClass('disabled').attr('aria-disabled', true);
            }

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
