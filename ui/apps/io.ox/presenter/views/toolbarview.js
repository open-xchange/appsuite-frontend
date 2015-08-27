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
    'gettext!io.ox/presenter',
    'io.ox/presenter/actions'
], function (DisposableView, Ext, LinksPattern, ActionsPattern, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    // define constants
    var TOOLBAR_ID = 'io.ox/presenter/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        TOOLBAR_ACTION_DROPDOWN_ID = 'io.ox/presenter/actions/toolbar/dropdown',
        PRESENTER_ACTION_ID = 'io.ox/presenter/actions';

    // define extension points for this ToolbarView
    var toolbarPoint = Ext.point(TOOLBAR_ID),
        // toolbar link meta object used to generate extension points later
        toolbarLinksMeta = {
            'start': {
                prio: 'hi',
                mobile: 'hi',
                //#. button label for the 'start presentation' dropdown
                label: gt('Presentation'),
                //#. button tooltip for 'start presentation' dropdown
                title: gt('Start presentation'),
                drawDisabled: true,
                ref: TOOLBAR_ID + '/dropdown/start-presentation',
                customize: function (baton) {
                    var self = this;
                    this.append('<i class="fa fa-caret-down">');

                    this.after(
                        LinksPattern.DropdownLinks({
                            ref: TOOLBAR_LINKS_ID + '/dropdown/start-presentation',
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.parent().hide();
                            }
                        }, baton)
                    );

                    this.addClass('dropdown-toggle').attr({
                        'aria-haspopup': 'true',
                        'data-toggle': 'dropdown',
                        'role': 'button'
                    }).dropdown();

                    this.parent().addClass('dropdown pull-left');
                }
            },
            'end': {
                prio: 'hi',
                mobile: 'hi',
                //#. button label for ending the presentation
                label: gt('End presentation'),
                ref: PRESENTER_ACTION_ID + '/end',
                customize: function () {
                    this.addClass('presenter-toolbar-end')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for ending the presentation
                            'aria-label': gt('End presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'pause': {
                prio: 'hi',
                mobile: 'hi',
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
                    this.parent().addClass('pull-left');
                }
            },
            'continue': {
                prio: 'hi',
                mobile: 'hi',
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
                    this.parent().addClass('pull-left');
                }
            },

            'join': {
                prio: 'hi',
                mobile: 'hi',
                //#. button label for joining the presentation
                label: gt('Join presentation'),
                ref: PRESENTER_ACTION_ID + '/join',
                customize: function () {
                    this.addClass('presenter-toolbar-join')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for joining the presentation
                            title: gt('Join presentation'),
                            'aria-label': gt('Join presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },
            'leave': {
                prio: 'hi',
                mobile: 'hi',
                //#. button label for leaving the presentation
                label: gt('Leave presentation'),
                ref: PRESENTER_ACTION_ID + '/leave',
                customize: function () {
                    this.addClass('presenter-toolbar-leave')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for leaving the presentation
                            title: gt('Leave presentation'),
                            'aria-label': gt('Leave presentation')
                        });
                    this.parent().addClass('pull-left');
                }
            },

            'zoomout': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-minus',
                ref: PRESENTER_ACTION_ID + '/zoomout',
                //#. button label for zooming out the presentation
                label: gt('Zoom out'),
                customize: function () {
                    this.addClass('presenter-toolbar-zoomout').attr({
                        tabindex: '1',
                        //#. button tooltip for zooming out the presentation
                        title: gt('Zoom out'),
                        'aria-label': gt('Zoom out')
                    });
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-plus',
                //#. button label for zooming in the presentation
                label: gt('Zoom in'),
                ref: PRESENTER_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('presenter-toolbar-zoomin').attr({
                        tabindex: '1',
                        //#. button tooltip for zooming in the presentation
                        title: gt('Zoom in'),
                        'aria-label': gt('Zoom in')
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
                        //#. button tooltip for toggling fullscreen mode
                        title: gt('Toggle fullscreen'),
                        'aria-label': gt('Toggle fullscreen')
                    });
                }
            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-users',
                //#. button label for toggling participants view
                label: gt('View participants'),
                ref: PRESENTER_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('presenter-toolbar-togglesidebar')
                        .attr({
                            tabindex: '1',
                            //#. button tooltip for toggling participants view
                            title: gt('View participants'),
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

    // define local dummy actions
    var Action = ActionsPattern.Action;
    new Action(TOOLBAR_ACTION_DROPDOWN_ID, {
        requires: function () { return true; },
        action: $.noop
    });

    new Action(TOOLBAR_ID + '/dropdown/start-presentation', {
        requires: function () { return true; },
        action: $.noop
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
            //#. aria label for the toolbar, for screen reader only.
            var toolbar = this.$el.attr({ role: 'menu', 'aria-label': gt('Presenter toolbar') }),
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
