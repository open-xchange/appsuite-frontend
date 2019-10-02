define('io.ox/dynamic-theme/register', [
    'io.ox/core/extensions',
    'io.ox/dynamic-theme/less',
    'text!io.ox/dynamic-theme/apps/themes/style.less.dyn',
    'settings!io.ox/dynamic-theme'
], function (ext, less, theme, settings) {
    'use strict';

    var vars = settings.get(), logoURL = vars.logoURL;
    delete vars.logoURL;

    ext.point('io.ox/core/appcontrol').extend({
        id: 'dynamic-logo',
        after: 'logo',
        draw: function () {
            if (!logoURL) return;
            $('#io-ox-top-logo > img', this).attr('src', logoURL);
        }
    });

    // Legacy values from previous versions override new defaults
    var legacy = {
        topbarBackground: 'frameColor',
        listSelectedFocus: 'selectionColor',
        folderSelectedFocus: 'selectionColor'
    };
    for (var i in legacy) if (vars[legacy[i]]) vars[i] = vars[legacy[i]];

    if (typeof vars.logoHeight === 'number') vars.logoHeight += 'px';
    if (typeof vars.logoWidth === 'number') vars.logoWidth += 'px';
    less.setVars(vars);
    less.enable('themes/style', theme);
});
