define("plugins/liberty/register", ["io.ox/core/extensions"], function (ext) {
    "use strict";
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
    
    
});