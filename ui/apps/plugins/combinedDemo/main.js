define('plugins/combinedDemo/main',
    ['io.ox/core/extensions',
     'io.ox/core/upsell',
     'io.ox/core/capabilities',
     'io.ox/wizards/upsell',
     'plugins/upsell/bubbles/main',
     'io.ox/core/extPatterns/stage'], function (ext, upsell, capabilities, upsellwiz, bubbles, Stage) {

    'use strict';
    var onUpgrade,
        onUpgradeAttempt;

    onUpgrade = function () {
        var target = window.location.href;
        target = target.replace(/[\?&]cap=.+?(&?)/, '$1').replace(/[\?&]lock=.+?(&?)/, '$1');
        window.location = target;
        location.reload();
    };

    onUpgradeAttempt = function () {
        require(['plugins/combinedDemo/upsellWizard/upsell'], function (wiz) {
            var def = $.Deferred();
            wiz.getInstance().start({cssClass: 'upsell-wizard-container'})
              .done(function () {})
              .fail(def.reject);
        });
    };

    new Stage('io.ox/core/stages', {
        id: 'demo-capabilities',
        index: 599,
        run: function (baton) {
            baton.upselldemo = { 'hidden': {}, 'locked': {}};
            if (_.url.hash('cap')) {
                _(_(_.url.hash('cap').replace('%2C', ',').split(/,/)).compact()).each(function (cap) {
                    if (cap.indexOf('-') === 0) {
                        baton.upselldemo.hidden[cap] = true;
                    }
                });
            }
            if (_.url.hash('lock')) {
                _(_(_.url.hash('lock').replace('%2C', ',').split(/,/)).compact()).each(function (cap) {
                    baton.upselldemo.locked[cap] = true;
                    upsell.setEnabled(cap);
                });
            }

            ox.on('upsell:requires-upgrade', onUpgradeAttempt);
            ox.on('upsell:upgrade', onUpgrade);
        }
    });
});