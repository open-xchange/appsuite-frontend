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
    function createNavigationButton(type) {
        var button = $('<a href="#" class="presenter-navigation-slide-button" tabindex="1" role="menuitem" aria-disabled="false">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.attr({ 'aria-label': (type === 'next') ? gt('Next slide') : gt('Previous slide') });
        button.tooltip({
            placement: 'top',
            title: (type === 'next') ?
                //#. button tooltip for 'go to next presentation slide' action
                gt('Next slide') :
                //#. button tooltip for 'go to previous presentation slide' action
                gt('Previous slide')
        });

        icon.addClass((type === 'next') ? 'fa-chevron-right' : 'fa-chevron-left');
        return button.append(icon);
    }

    // define extension points for this NavigationView
    var navigationPoint = Ext.point(NAVIGATION_ID);

    // navigation link meta object used to generate extension points later
    var navigationLinksMeta = {
        'pause': {
            prio: 'hi',
            mobile: 'lo',
            //#. button label for pausing the presentation
            label: gt('Pause presentation'),
            //#. button tooltip for pausing the presentation
            title: gt('Pause the presentation'),
            ref: PRESENTER_ACTION_ID + '/pause',
            customize: function () {
                var data = this.data('bs.tooltip');
                this.attr({ 'aria-label': gt('Pause presentation') });
                if (data && data.options) {
                    data.options.placement = 'top';
                }
            }
        },
        'continue': {
            prio: 'hi',
            mobile: 'lo',
            //#. button label for continuing the presentation
            label: gt('Continue presentation'),
            //#. button tooltip for continuing the presentation
            title: gt('Continue the presentation'),
            ref: PRESENTER_ACTION_ID + '/continue',
            customize: function () {
                var data = this.data('bs.tooltip');
                this.attr({ 'aria-label': gt('Continue presentation') });
                if (data && data.options) {
                    data.options.placement = 'top';
                }
            }
        },
        'fullscreen': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-arrows-alt',
            //#. button label for toggling fullscreen mode
            label: gt('Toggle fullscreen'),
            //#. button label for toggling fullscreen mode
            title: gt('Toggle fullscreen'),
            ref: PRESENTER_ACTION_ID + '/fullscreen',
            customize: function () {
                var data = this.data('bs.tooltip');
                this.attr({ 'aria-label': gt('Toggle fullscreen') });
                if (data && data.options) {
                    data.options.placement = 'top';
                }
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

            var rtModel = baton.context.app.rtModel;
            var localModel = baton.context.app.localModel;
            var userId = baton.context.app.rtConnection.getRTUuid();

            // no participants list for local presenter
            if (localModel.isPresenter(userId)) { return; }

            function quoteId(id) {
                return id.replace(/(:|@|\/|\.|\[|\]|,)/g, '\\$1');
            }

            var participantsJoined = false;
            var participants = rtModel.get('participants');
            var presenterId = rtModel.get('presenterId') || 'none';
            var presenterName = rtModel.get('presenterName') ||
                    //#. text of a user list that shows the names of presenting user and participants.
                    //#. the text to display as presenter name if no user is presenting yet.
                    gt('none');

            var dropdown = new Dropdown({
                model: baton.context.app.rtModel,
                //#. text of a user list that shows the names of presenting user and participants.
                //#. the dropdown button label for the participants dropdown.
                label: gt('Participants'),
                tagName: 'li',
                caret: true
            })
                //#. text of a user list that shows the names of presenting user and participants.
                //#. the presenter section label.
                .header(gt('Presenter'))
                .link(presenterId, presenterName, null)
                .divider()
                //#. text of a user list that shows the names of presenting user and participants.
                //#. the participants section label.
                .header(gt('Participants'));

            dropdown.$el.tooltip({
                //#. the dropdown button tooltip for the participants dropdown.
                title: gt('View participants'),
                placement: 'left'
            });

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
                //#. text of a user list that shows the names of presenting user and participants.
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
            var navigation = this.$el.attr({ role: 'menu', 'aria-label': gt('Presenter navigation bar') });
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();
            var baton = Ext.Baton({
                context: this,
                $el: navigation,
                model: this.model,
                models: [this.model],
                data: this.model.toJSON()
            });
            // render navigation links
            navigation.empty();
            // the navigation panel is displayed for the presenter only and if the presentation is not paused.
            if (localModel.isPresenting(userId) || rtModel.isPresenting(userId)) {
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

            function onPrevSlide(event) {
                event.preventDefault();
                self.app.mainView.showPreviousSlide();
            }
            function onNextSlide(event) {
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
                var newValue = parseInt($(this).val(), 10);

                if (isNaN(newValue)) {
                    $(this).val(slideNumber);
                    return;

                } else if (newValue <= 0) {
                    $(this).val(1);
                    newValue = 1;

                } else if (newValue > slideCount) {
                    $(this).val(slideCount);
                    newValue = slideCount;
                }

                self.app.mainView.showSlide(newValue - 1);
            }
            function onClick() {
                $(this).select();
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

            slideInput.on('keydown', onInputKeydown).on('change', onInputChange).on('click', onClick);
            prev.on('click', onPrevSlide);
            next.on('click', onNextSlide);

            slideInputWrapper.tooltip({
                //#. button tooltip for 'jump to presentation slide' action
                title: gt('Jump to slide'),
                placement: 'top'
            });

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
