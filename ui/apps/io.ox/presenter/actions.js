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
        //#. 'start presentation' dropdown menu entry to start a local only presentation where no remote participants would be able to join.
        label: gt('Start local presentation'),
        description: gt('View the presentation in fullscreen on your device.'),
        ref: PRESENTER_ACTION_ID + '/start/local'
    });

    new LinksPattern.ActionLink(TOOLBAR_LINKS_ID + '/dropdown/start-presentation', {
        index: 200,
        id: 'startremote',
        //#. 'start presentation' dropdown menu entry to start a remote presentation where remote participants would be able to join.
        label: gt('Start remote presentation'),
        description: gt('Broadcast your presentation over the Web.'),
        ref: PRESENTER_ACTION_ID + '/start/remote'
    });

    new Action(PRESENTER_ACTION_ID + '/start/local', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            //return (_.device('!iOS') && !rtModel.isPresenter(userId) && !rtModel.isJoined(userId));
            return (localModel.canStart(userId) && !rtModel.isPresenter(userId) && !rtModel.isJoined(userId));
        },
        action: function (baton) {
            var app = baton.context.app;
            var localModel = app.localModel;
            var userId = app.rtConnection.getRTUuid();
            var slideId = app.mainView.getActiveSlideIndex();

            console.info('start local action:', baton, 'slide', slideId);
            //app.mainView.toggleFullscreen(true);
            localModel.startPresentation(userId);
        }
    });

    new Action(PRESENTER_ACTION_ID + '/start/remote', {
        // starting a remote presentation requires the 'remote_presenter' capability
        capabilities: 'remote_presenter',
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (!localModel.isPresenter(userId) && rtModel.canStart(userId));
        },
        action: function (baton) {
            var app = baton.context.app;
            var slideId = app.mainView.getActiveSlideIndex();

            console.info('start remote action:', baton, 'slide', slideId);
            app.rtConnection.startPresentation({ activeSlide: slideId });
        }
    });

    new Action(PRESENTER_ACTION_ID + '/end', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (localModel.isPresenter(userId) || rtModel.isPresenter(userId));
        },
        action: function (baton) {
            var app = baton.context.app;
            var rtModel = app.rtModel;
            var localModel = app.localModel;
            var userId = app.rtConnection.getRTUuid();

            if (localModel.isPresenter(userId)) {
                console.info('end local action:', baton);
                localModel.endPresentation(userId);

            } else if (rtModel.isPresenter(userId)) {
                console.info('end remote action:', baton);
                app.rtConnection.endPresentation();
            }
        }
    });

    new Action(PRESENTER_ACTION_ID + '/pause', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (localModel.canPause(userId) || rtModel.canPause(userId));
        },
        action: function (baton) {
            var app = baton.context.app;
            var rtModel = app.rtModel;
            var localModel = app.localModel;
            var userId = app.rtConnection.getRTUuid();

            if (localModel.canPause(userId)) {
                console.info('pause local action:', baton);
                localModel.pausePresentation(userId);

            } else if (rtModel.canPause(userId)) {
                console.info('pause remote action:', baton);
                app.rtConnection.pausePresentation();
                app.mainView.toggleFullscreen(false);
            }

        }
    });

    new Action(PRESENTER_ACTION_ID + '/continue', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (localModel.canContinue(userId) || rtModel.canContinue(userId));
        },
        action: function (baton) {
            var app = baton.context.app;
            var rtModel = app.rtModel;
            var localModel = app.localModel;
            var userId = app.rtConnection.getRTUuid();

            if (localModel.canContinue(userId)) {
                console.info('continue local action:', baton);
                localModel.continuePresentation(userId);

            } else if (rtModel.canContinue(userId)) {
                console.info('continue remote action:', baton);
                baton.context.app.rtConnection.continuePresentation();
            }
        }
    });

    new Action(PRESENTER_ACTION_ID + '/join', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (!localModel.isPresenter(userId) && rtModel.canJoin(userId));
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

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (localModel.isPresenter(userId) || rtModel.isPresenter(userId) || rtModel.isJoined(userId));
        },
        action: function (baton) {
            console.info('fullscreen action:', baton);
            baton.context.app.mainView.toggleFullscreen();
        }
    });

    new Action(PRESENTER_ACTION_ID + '/togglesidebar', {
        requires: function (e) {
            if (!e.baton.context) { return false; }

            var rtModel = e.baton.context.app.rtModel;
            var localModel = e.baton.context.app.localModel;
            var userId = e.baton.context.app.rtConnection.getRTUuid();

            return (!localModel.isPresenter(userId) && (!rtModel.isPresenter(userId) || rtModel.isPaused()));
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
