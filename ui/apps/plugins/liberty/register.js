define("plugins/liberty/register", ["io.ox/core/extensions", "io.ox/core/http"], function (ext, http) {
    "use strict";
    
    require("themes").set("liberty");
    
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
        
        ext.point('io.ox/core/apps/manage').extend({
            id: 'liberty',
            index: 100,
            openStore: function () {
                require(["plugins/liberty/generic/main"], function (m) {
                    m.getApp().launch({
                        name: 'Fujitsu BSS',
                        url: libertyConfig.shopUrl
                    });
                });
            }
        });
    });
    
    ext.point("io.ox/core/apps/store").extend({
        id: 'liberty',
        index: 100,
        installed: function () {
            return http.GET({
                module: 'liberty/apps',
                params: {
                    action: 'list'
                }
            }).pipe(function (apps) {
                return _(apps).map(function (app) {
                    return {
                        id: app.serviceurl,
                        icon: app.imageurl || ox.base + "/apps/io.ox/core/images/default.png",
                        title: app.name,
                        description: app.name,
                        visible: true,
                        entryModule: 'plugins/liberty/generic/main',
                        launchArguments: [{
                            url: app.serviceurl,
                            name: app.name
                        }]
                    };
                });
            });
        }
    });
    
});