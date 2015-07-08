/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/views/toolbarview', [
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'gettext!io.ox/core'
], function (DisposableView, Ext, LinksPattern, ActionsPattern, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    // define constants
    var TOOLBAR_ID = 'io.ox/presenter/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        TOOLBAR_ACTION_ID = 'io.ox/presenter/actions/toolbar',
        TOOLBAR_ACTION_DROPDOWN_ID = TOOLBAR_ACTION_ID + '/dropdown';

    // define extension points for this ToolbarView
    var toolbarPoint = Ext.point(TOOLBAR_ID),
        // toolbar link meta object used to generate extension points later
        toolbarLinksMeta = {
            'start': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-play',
                label: gt('Start Presentation'),
                ref: TOOLBAR_ACTION_ID + '/start',
                customize: function () {
                    this.addClass('presenter-toolbar-start')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('Start Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'end': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-play',
                label: gt('End Presentation'),
                ref: TOOLBAR_ACTION_ID + '/end',
                customize: function () {
                    this.addClass('presenter-toolbar-end')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('End Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'pause': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-pause',
                label: gt('Pause presentation'),
                ref: TOOLBAR_ACTION_ID + '/pause',
                customize: function () {
                    this.addClass('presenter-toolbar-pause')
                        .attr({
                            tabindex: '1',
                            title: gt('Pause Presentation'),
                            'aria-label': gt('Pause Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'continue': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-pause',
                label: gt('Continue presentation'),
                ref: TOOLBAR_ACTION_ID + '/continue',
                customize: function () {
                    this.addClass('presenter-toolbar-continue')
                        .attr({
                            tabindex: '1',
                            title: gt('Continue Presentation'),
                            'aria-label': gt('Continue Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },

            'join': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-pause',
                label: gt('Join presentation'),
                ref: TOOLBAR_ACTION_ID + '/join',
                customize: function () {
                    this.addClass('presenter-toolbar-join')
                        .attr({
                            tabindex: '1',
                            title: gt('Join Presentation'),
                            'aria-label': gt('Join Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'leave': {
                prio: 'hi',
                mobile: 'hi',
                //icon: 'fa fa-pause',
                label: gt('Leave presentation'),
                ref: TOOLBAR_ACTION_ID + '/leave',
                customize: function () {
                    this.addClass('presenter-toolbar-leave')
                        .attr({
                            tabindex: '1',
                            title: gt('Leave Presentation'),
                            'aria-label': gt('Leave Presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },

            'zoomout': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-minus',
                ref: TOOLBAR_ACTION_ID + '/zoomout',
                label: gt('Zoom out'),
                customize: function () {
                    this.addClass('presenter-toolbar-zoomout').attr({
                        tabindex: '1',
                        'aria-label': gt('Zoom out')
                    });
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-plus',
                label: gt('Zoom in'),
                ref: TOOLBAR_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('presenter-toolbar-zoomin').attr({
                        tabindex: '1',
                        'aria-label': gt('Zoom in')
                    });
                }
            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-users',
                label: gt('View participants'),
                ref: TOOLBAR_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('presenter-toolbar-togglesidebar')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('View participants')
                        });
                }
            }
        };

    // iterate link meta and create link extensions
    var linkIndex = 0;
    _.each(toolbarLinksMeta, function (linkMeta, linkId) {
        linkMeta.id = linkId;
        linkMeta.index = (linkIndex += 100);
        Ext.point(TOOLBAR_LINKS_ID).extend(new LinksPattern.Link(linkMeta));
    });

    //extend toolbar extension point with the toolbar links
    toolbarPoint.extend(new LinksPattern.InlineLinks({
        id: 'presenter-toolbar-links',
        dropdown: true,
        compactDropdown: true,
        ref: TOOLBAR_LINKS_ID
    }));

    // define actions of this ToolbarView
    var Action = ActionsPattern.Action;
    new Action(TOOLBAR_ACTION_DROPDOWN_ID, {
        requires: function () { return true; },
        action: $.noop
    });

    new Action(TOOLBAR_ACTION_ID + '/start', {
        id: 'start',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canStart(userId));
        },
        action: function (baton) {
            var slideId = baton.context.app.mainView.presentationView.getActiveSlideIndex();
            console.info('start action:', baton, 'slide', slideId);
            baton.context.app.rtConnection.startPresentation({ activeSlide: slideId });
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/end', {
        id: 'end',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.isPresenter(userId));
        },
        action: function (baton) {
            console.info('end action:', baton);
            baton.context.app.rtConnection.endPresentation();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/pause', {
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

    new Action(TOOLBAR_ACTION_ID + '/continue', {
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

    new Action(TOOLBAR_ACTION_ID + '/join', {
        id: 'join',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canJoin(userId));
        },
        action: function (baton) {
            console.info('join action:', baton);
            baton.context.app.rtConnection.joinPresentation();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/leave', {
        id: 'leave',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canLeave(userId));
        },
        action: function (baton) {
            console.info('leave action:', baton);
            baton.context.app.rtConnection.leavePresentation();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        id: 'togglesidebar',
        action: function (baton) {
            console.info('togglesidebar action', baton);
            baton.context.onToggleSidebar();
        }
    });

    // define actions for the zoom function
    new Action(TOOLBAR_ACTION_ID + '/zoomin', {
        id: 'zoomin',
        action: function (baton) {
            baton.context.onZoomIn();
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/zoomout', {
        id: 'zoomout',
        action: function (baton) {
            baton.context.onZoomOut();
        }
    });

    // define the Backbone view
    var ToolbarView = DisposableView.extend({

        className: 'presenter-toolbar',

        tagName: 'ul',

        initialize: function (options) {
            _.extend(this, options);
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));

            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.render);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.render);
            this.listenTo(this.presenterEvents, 'presenter:participants:change', this.render);
        },

        /**
         * Toggles the visibility of the sidebar.
         */
        onToggleSidebar: function () {
            this.presenterEvents.trigger('presenter:toggle:sidebar');
        },

        /**
         * Publishes zoom-in event to the MainView event aggregator.
         */
        onZoomIn: function () {
            this.presenterEvents.trigger('presenter:zoomin');
        },

        /**
         * Publishes zoom-out event to the MainView event aggregator.
         */
        onZoomOut: function () {
            this.presenterEvents.trigger('presenter:zoomout');
        },

        /**
         * Renders this DisplayerView with the supplied model.
         *
         * @param {Object} model
         *  The file model object.
         *
         * @returns {ToolbarView} toolbarView
         *  this view object itself.
         */
        render: function () {
            //console.info('ToolbarView.render()');
            // draw toolbar
            var toolbar = this.$el.attr({ role: 'menu', 'aria-label': gt('Presenter Toolbar') }),
                baton = Ext.Baton({
                    context: this,
                    $el: toolbar,
                    model: this.model,
                    models: [this.model],
                    data: this.model.toJSON()
                });
            // render toolbar links
            toolbar.empty();
            toolbarPoint.invoke('draw', toolbar, baton);
            return this;
        },

        /**
         * Destructor of this view
         */
        disposeView: function () {
            this.model = null;
        }

    });

    return ToolbarView;

});
