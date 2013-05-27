define('io.ox/preview/officePreview', ['io.ox/preview/officePreview/main'], function (officePreviewApp) {

    'use strict';

    function draw(file) {
        require(['io.ox/preview/officePreview/main'], function (officePreview) {
            officePreview.getApp(file).launch();
        });
    }

    return {
        draw: draw
    };
});