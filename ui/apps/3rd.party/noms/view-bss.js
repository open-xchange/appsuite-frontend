define("3rd.party/noms/view-bss", ["io.ox/core/extensions"], function (ext) {
    "use strict";
    
    function PeriodicRefresher() {
        var knownURLs = {};
        var token = null;
        
        this.run = function () {
            if (token) {
                return;
            }
            var self = this;
            token = setInterval(function () {
                self.tick();
            }, 1000);
        };
        
        this.stop = function () {
            if (!token) {
                return;
            }
            clearInterval(token);
            token = null;
        };
        
        this.tick = function () {
            var self = this;
            console.log("tick");
            // We use the AJAX method to not send the loading icon into nervous blinking
            $.ajax("/ox7/api/noms/apps?action=list&session=" + ox.session, {
                dataType: 'json'
            }).done(function (response) {
                _(response.data).each(function (entry) {
                    if (!knownURLs[entry.url]) {
                        self.addApp(entry);
                    }
                });
            });
        };
        
        this.addApp = function (entry) {
            knownURLs[entry.url] = true;
            console.log("New app was purchased: " + entry.url);
            ext.point("io.ox/core/apps/installed").extend({
                id: entry.url,
                icon: entry.img,
                title: entry.url,
                description: entry.url,
                visible: true,
                entryModule: "3rd.party/noms/generic/main",
                launchArguments: [entry]
            });
        };
        
    }
    
    var refresher = new PeriodicRefresher();
    
    return {
        draw: function () {
            refresher.run();
            return $("<iframe>", {
                src: "http://marketplace.kumoki.info/fujitsu-bss-portal/marketplace/?mId=FUJITSU",
                width: 1100,
                height: "100%",
                frameBorder: 0
            });
        },
        refresher: refresher
    };
    
});