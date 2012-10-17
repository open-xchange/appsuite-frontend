define("plugins/liberty/login/register", function () {
    "use strict";
    
    $('#io-ox-login-header-prefix').replaceWith($('<img>', {
        id: 'io-ox-login-header-prefix',
        src: ox.base + "/apps/plugins/liberty/login/logo.png"
    }));
    
    $("head").append($("<link>", {
        rel: 'stylesheet',
        type: 'text/css',
        href: ox.base + '/apps/plugins/liberty/login/style.css'
    }));
});