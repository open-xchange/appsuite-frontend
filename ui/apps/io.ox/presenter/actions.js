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
    'io.ox/core/extPatterns/actions'
], function (ActionsPattern) {

    'use strict';

    var PRESENTER_ACTION_ID = 'io.ox/presenter/actions';

    var Action = ActionsPattern.Action;

    new Action(PRESENTER_ACTION_ID + '/start', {
        id: 'start',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canStart(userId));
        },
        action: function (baton) {
            var app = baton.context.app,
                slideId = app.mainView.getActiveSlideIndex();

            console.info('start action:', baton, 'slide', slideId);
            app.rtConnection.startPresentation({ activeSlide: slideId });
        }
    });

    new Action(PRESENTER_ACTION_ID + '/end', {
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

    new Action(PRESENTER_ACTION_ID + '/pause', {
        id: 'pause',
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

    new Action(PRESENTER_ACTION_ID + '/join', {
        id: 'join',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel,
                userId = e.baton.context.app.rtConnection.getRTUuid();

            return (rtModel.canJoin(userId));
        },
        action: function (baton) {
            console.info('join action:', baton);
            var app = baton.context.app;
            app.mainView.toggleFullscreen(true);
            app.rtConnection.joinPresentation();
        }
    });

    new Action(PRESENTER_ACTION_ID + '/leave', {
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

    new Action(PRESENTER_ACTION_ID + '/fullscreen', {
        id: 'fullscreen',
        requires: function (e) {
            if (!e.baton.context) { return false; }

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
        id: 'togglesidebar',
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
        id: 'zoomin',
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
        id: 'zoomout',
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
