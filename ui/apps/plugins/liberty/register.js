define("plugins/liberty/register", ["io.ox/core/extensions"], function (ext) {
    "use strict";
    
    $.get('/ox7/api/noms/apps?action=clear', function (data) {
		console.log("Was successful refreshing the app cache");
	});
    
    ext.point("io.ox/core/apps/category").extend({
        id: 'noms',
        title: 'Fujitsu BSS',
        count: 2,
        group: 'Fujitsu',
        viewModule: 'plugins/liberty/view-bss'
    });
        
    ext.point("io.ox/core/apps/installed").extend({
        id: "plugins/liberty/photoshop",
        icon: ox.base + '/apps/plugins/liberty/images/PhotoshopIcon.png',
        title: "Adobe Photoshop",
        description: "Adobe Photoshop",
        visible: true
    });
    
    ext.point("io.ox/core/apps/installed").extend({
        id: "plugins/liberty/webOffice",
        icon: ox.base + '/apps/io.ox/core/images/default.png',
        title: "Trve Office",
        description: "Trve Office",
        visible: true
    });
    
    require([ox.base + '/liberty/config.js?time=' + new Date().getTime()]).done(function (libertyConfig) {
        _(libertyConfig.apps).each(function (entry, id) {
            ext.point("io.ox/core/apps/installed").extend({
                id: id,
                icon: entry.icon || ox.base + "/apps/io.ox/core/images/default.png",
                title: entry.name,
                description: entry.description || entry.name,
                visible: true,
                entryModule: "plugins/liberty/generic/main",
                launchArguments: [entry]
            });
        });
    });
    
});