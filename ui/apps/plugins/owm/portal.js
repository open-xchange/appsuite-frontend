define("plugins/owm/portal", ["io.ox/core/extensions"], function (ext) {
	"use strict";

    console.log("LOAD!");

	ext.point("io.ox/portal/widget/owm1").extend({
        title: "Hello World",
        draw: function () {
            this.append("Hello World");
            return $.when();
        },
        preview: function () {
            this.append($('<div class="content pointer">').append('Hello World'));
        }
    });
    
    ext.point('io.ox/portal/widget/owm1/settings').extend({
        title: "Greetings from OWM",
        type: 'owm1',
        editable: false
    });
});