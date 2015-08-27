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
define('io.ox/presenter/actions', [
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'gettext!io.ox/presenter'
], function (ActionsPattern, LinksPattern, gt) {

    'use strict';

    var TOOLBAR_ID = 'io.ox/presenter/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        PRESENTER_ACTION_ID = 'io.ox/presenter/actions';

    var Action = ActionsPattern.Action;

    // start presentation drop-down
    new LinksPattern.ActionLink(TOOLBAR_LINKS_ID + '/dropdown/start-presentation', {
        index: 100,
        id: 'startlocal',
        label: gt('Start local presentation'),
        //#. presentation start: Starts the presentation to a local audience, no remote participants would be able to join.
        description: gt('Present to a local audience.'),
        ref: PRESENTER_ACTION_ID + '/start/local'
    });

    new LinksPattern.ActionLink(TOOLBAR_LINKS_ID + '/dropdown/start-presentation', {
        index: 200,
        id: 'startremote',
        label: gt('Start remote presentation'),
        //#. presentation start: Starts the presentation and additional remote participants would be able to join the presentation.
        description: gt('Present to additional remote participants.'),
        ref: PRESENTER_ACTION_ID + '/start/remote'
    });

    new Action(PRESENTER_ACTION_ID + '/start/local', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (!rtModel.isPresenter(userId) && !rtModel.isJoined(userId));
        },
        action: function (baton) {
            var app = baton.context.app,
                slideId = app.mainView.getActiveSlideIndex();

            console.info('start local action:', baton, 'slide', slideId);
            app.mainView.toggleFullscreen(true);
        }
    });

    new Action(PRESENTER_ACTION_ID + '/start/remote', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canStart(userId));
        },
        action: function (baton) {
            var app = baton.context.app,
                slideId = app.mainView.getActiveSlideIndex();

            console.info('start remote action:', baton, 'slide', slideId);
            app.rtConnection.startPresentation({ activeSlide: slideId });
        }
    });

    new Action(PRESENTER_ACTION_ID + '/end', {
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

    new Action(PRESENTER_ACTION_ID + '/pause', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canPause(userId));
        },
        action: function (baton) {
            console.info('pause action:', baton);
            var app = baton.context.app;
            app.rtConnection.pausePresentation();
            app.mainView.toggleFullscreen(false);
        }
    });

    new Action(PRESENTER_ACTION_ID + '/continue', {
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

    new Action(PRESENTER_ACTION_ID + '/join', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canJoin(userId));
        },
        action: function (baton) {
            console.info('join action:', baton);
            var app = baton.context.app;
            app.mainView.joinPresentation();
        }
    });

    new Action(PRESENTER_ACTION_ID + '/leave', {
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

    new Action(PRESENTER_ACTION_ID + '/fullscreen', {
        requires: function (e) {
            // iOS doesn't support full-screen
            if (!e.baton.context || _.device('iOS')) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.isPresenter(userId) || rtModel.isJoined(userId));
        },
        action: function (baton) {
            console.info('fullscreen action:', baton);
            baton.context.app.mainView.toggleFullscreen();
        }
    });

    new Action(PRESENTER_ACTION_ID + '/togglesidebar', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return !rtModel.isPresenter(userId) || rtModel.isPaused();
        },
        action: function (baton) {
            console.info('togglesidebar action', baton);
            baton.context.app.mainView.onToggleSidebar();
        }
    });

    new Action(PRESENTER_ACTION_ID + '/zoomin', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return !rtModel.isPresenter(userId);
        },
        action: function (baton) {
            baton.context.app.mainView.presenterEvents.trigger('presenter:zoomin');
        }
    });

    new Action(PRESENTER_ACTION_ID + '/zoomout', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return !rtModel.isPresenter(userId);
        },
        action: function (baton) {
            baton.context.app.mainView.presenterEvents.trigger('presenter:zoomout');
        }
    });
});
