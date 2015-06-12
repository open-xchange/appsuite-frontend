/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/views/mainview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/views/presentationview'
], function (DisposableView, PresentationView) {

    'use strict';

    /**
     * The main view is the base view for the OX Presenter.
     * This view imports, manages and  renders these children views:
     * - PresentationView
     */
    var MainView = DisposableView.extend({

        className: 'io-ox-presenter abs',

        attributes: { tabindex: -1 },

        events: {
            'keydown': 'onKeydown'
        },

        initialize: function (options) {
            _.extend(this, options);

            // create the event dispatcher
            this.presenterEvents = _.extend({}, Backbone.Events);
            // create child view(s)
            this.presentationView = new PresentationView({ model: this.model, presenterEvents: this.presenterEvents });

            // handle DOM events
            $(window).on('resize', this.onWindowResize.bind(this));

            // clean stuff on dispose event from core/commons.js
            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Renders the MainView.
         *
         * @returns {MainView}
         */
        render: function () {
            // append toolbar view
            this.$el.append(
                this.presentationView.render().el
            );
            return this;
        },

        // handler for keyboard events on the viewer
        onKeydown: function (event) {
            //event.stopPropagation();

            // TODO: check if we need to handle TAB traversal ourselves.
            // manual TAB traversal handler. 'Traps' TAB traversal inside the viewer root component.
            function tabHandler(event) {
                var tabableActions = this.$el.find('[tabindex]:not([tabindex^="-"]):visible'),
                    tabableActionsCount = tabableActions.length;
                // quit immediately if no tabable actions are found
                if (tabableActionsCount === 0) { return; }
                var focusedElementIndex = tabableActions.index(document.activeElement),
                    traversalStep = event.shiftKey ? -1 : 1,
                    nextElementIndex = focusedElementIndex + traversalStep;
                // prevent default TAB traversal
                event.preventDefault();
                // traverse to prev/next action
                if (nextElementIndex >= tabableActionsCount) {
                    nextElementIndex = 0;
                }
                // focus next action candidate
                tabableActions.eq(nextElementIndex).focus();
            }

            console.info('event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);

            switch (event.which || event.keyCode) {
                case 9: // TAB key
                    // TODO: check if we need to handle TAB traversal ourselves.
                    if (false /*activate for manual tab traversal*/) {
                        event.stopPropagation();
                        tabHandler(event);
                    }
                    break;
                case 37: // left arrow
                    event.stopPropagation();
                    this.presentationView.swiper.slidePrev();
                    //this.presentationView.focusActiveSlide();
                    break;
                case 39: // right arrow
                    event.stopPropagation();
                    this.presentationView.swiper.slideNext();
                    //this.presentationView.focusActiveSlide();
                    break;
                case 107: // plus key
                    event.stopPropagation();
                    this.presentationView.changeZoomLevel('increase');
                    break;
                case 109: // minus key
                    event.stopPropagation();
                    this.presentationView.changeZoomLevel('decrease');
                    break;
            }
        },

        // recalculate view dimensions after e.g. window resize events
        onWindowResize: function () {
            console.info('Presenter - mainview - onWindowResize()');
            /*
            var rightOffset = this.sidebarView.opened ? this.sidebarView.$el.outerWidth() : 0,
            this.presentationView.$el.css({ width: window.innerWidth - rightOffset });
            */
            this.presenterEvents.trigger('presenter:resize');
        },

        /**
         * Destructor function of the PresentationView.
         */
        disposeView: function () {
            console.log('Presenter - dispose MainView');

            $(window).off('resize', this.onWindowResize);
            this.presentationView.remove();
            this.model.off().stopListening();
            this.presentationView = null;
        }
    });
    return MainView;
});
