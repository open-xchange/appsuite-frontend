define("3rd.party/noms/view-bss", function () {
    "use strict";
    return {
        draw: function () {
            return $("<iframe>", {
                src: "http://marketplace.kumoki.info/fujitsu-bss-portal/marketplace/?mId=FUJITSU",
                width: 1100,
                height: "100%",
                frameBorder: 0
            });
        }
    };
    
});