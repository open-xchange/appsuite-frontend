define("3rd.party/noms/register", ["io.ox/core/extensions"], function (ext) {
    "use strict";
    ext.point("io.ox/core/apps/category").extend({
        id: 'noms',
        title: 'Fujitsu BSS',
        count: 2,
        group: 'Fujitsu',
        viewModule: '3rd.party/noms/view-bss'
    });
        
    ext.point("io.ox/core/apps/installed").extend({
        id: "3rd.party/noms/photoshop",
        icon: ox.base + '/apps/io.ox/core/images/default.png',
        title: "Adobe Photoshop",
        description: "Adobe Photoshop",
        visible: true
    });
    
    ext.point("io.ox/core/apps/installed").extend({
        id: "3rd.party/noms/webOffice",
        icon: ox.base + '/apps/io.ox/core/images/default.png',
        title: "Trve Office",
        description: "Trve Office",
        visible: true
    });
    
    
});