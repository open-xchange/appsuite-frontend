define("plugins/liberty/view-bss", ["io.ox/core/extensions"], function (ext) {
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
            // We use the AJAX method to not send the loading icon into nervous blinking
            $.ajax("/ui/api/noms/apps?action=list&session=" + ox.session, {
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
                title: entry.name,
                description: entry.name,
                visible: true,
                entryModule: "plugins/liberty/generic/main",
                launchArguments: [entry]
            });
        };

    }

    var refresher = new PeriodicRefresher();

    return {
        draw: function () {
            refresher.run();
            return $("<iframe>", {
                src: "http://marketplace.kumoki.info/fujitsu-bss-portal/marketplace/logindirect.jsf?mId=FUJITSU&u=oxdemo&p=secret",
                width: "100%",
                height: "100%",
                frameBorder: 0
            }).css({
                marginLeft: "-40px",
                marginTop: "-33px"
            });
        },
        refresher: refresher
    };

});
