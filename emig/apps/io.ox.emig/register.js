define('io.ox.emig/register', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'settings!io.ox.emig',
    'gettext!io.ox.emig/i18n',
    'less!io.ox.emig/style.less',
    'io.ox/core/desktop' // for ox.ui.windowManager
], function (ext, http, settings, gt) {
    'use strict';

    void http;
    
    var href = settings.get('moreInfo');
    if (href && typeof href === 'object') {
        href = href[ox.language] || href.de_DE;
    }
    
    ext.point('io.ox/mail/write/contactItem').extend({
        id: 'emig',
        draw: function (baton) {
            var badge = $('<div class="io-ox-emig wait"></div>')
                .attr('data-address', baton.data.email);
            this.prepend(badge);
            setStatus(badge.get(0), baton.app);
        }
    });
    
    ox.ui.windowManager.on('window.open', function (e, win) {
        if (win.name !== 'io.ox/mail/write') return;
        var view = win.app.getView();
        
        view.leftside
            .on('click.emig.before', '.io-ox-emig', closePopups)
            .popover({
                trigger: 'click',
                title: getTitle,
                html: true,
                content: getPopup,
                placement: 'bottom',
                container: document.body,
                selector: '.io-ox-emig'
            })
            .on('click.emig.after', '.io-ox-emig', function (e) {
                e.stopPropagation();
            });
        
        $(document.body).on('click', closePopups);
        function closePopups(e) {
            view.leftside.find('.io-ox-emig').each(function () {
                if (this === e.currentTarget || !$(this).data('popover')) return;
                $(this).popover('hide');
            });
        }
        
        var state = win.app['io.ox.emig'] = { senderStatus: false };
        checkSender();
        view.leftside.find('.sender-dropdown').on('change', checkSender);
        
        function checkSender() {
            var address = win.app.getFrom()[1];
/*
            setTimeout(function () {
                resetStatus(/netline/.test(address) || !state.senderStatus);
            }, 500 + Math.random() * 1000);
*/
            http.PUT({
                module: 'emig',
                params: { action: 'sender' },
                data: { address: address }
            }).done(resetStatus);

        }
        
        function resetStatus(status) {
            if (status === state.senderStatus) return;
            state.senderStatus = status;
            view.leftside.find('.io-ox-emig').each(function (i, badge) {
                setStatus(badge, win.app);
            });
        }
    });
    
    function setStatus(badge, app) {
        if (app['io.ox.emig'] && app['io.ox.emig'].senderStatus) {
            var address = badge.getAttribute('data-address');
            check(address).done(function (status) {
                badge.className = 'io-ox-emig ' +
                    ['none', 'member', 'secure'][status];
            });
        } else {
            badge.className = 'io-ox-emig none';
        }
    }
    
    // Popups
    
    function getTitle() {
        if ($(this).hasClass('secure')) {
            return $('<div class="io-ox-emig-title secure">')
                .text(gt('Secure communication'));
        } else {
            return $('<div class="io-ox-emig-title member">')
                .text(_.noI18n('E‑Mail made in Germany'));
        }
    }
    
    function getPopup() {
        if ($(this).hasClass('secure')) {
            return $('<div class="io-ox-emig-popup secure">').append(
                $('<div>').text(_.noI18n('E‑Mail made in Germany')),
                $('<span>').text(gt('Guaranteed security in sending and storing your message. ')),
                href ? $('<a target="_blank"></a>').attr('href', href)
                            .text(gt('More information'))
                     : $());
        } else {
            return $('<div class="io-ox-emig-popup member">').append(
                formatNodes($('<span>'),
                    //#. %1$s is the name of the group (E‑Mail made in Germany).
                    gt('E-mails to this e-mail address are sent via the system group %1$s network. '),
                    [emigName]),
                href ? $('<a target="_blank"></a>').attr('href', href)
                            .text(gt('More information'))
                     : $());
        }
    }

    function emigName() {
        return $('<b>').text(_.noI18n('E‑Mail made in Germany'));
    }
    
    function formatNodes(node, string, params) {
        var index = 0, s = '';
        String(string).replace(/%(?:(([0-9]+)\$)?[A-Za-z]|(%))|([^%]+)/g,
            function (match, pos, n, percent, text) {
                if (percent) {
                    s += '%';
                } else if (text) {
                    s += text;
                } else {
                    if (s) {
                        node.append(document.createTextNode(s));
                        s = '';
                    }
                    if (pos) index = n - 1;
                    node.append(params[index++]());
                }
            });
        if (s) node.append(document.createTextNode(s));
        return node;
    }
    
    // Address cache

    var addressCache = {}, pending = null;

    function check(address) {
        var def = $.Deferred();
        if (address in addressCache) {
            def.resolve(addressCache[address]);
        } else {
            if (!pending) {
                setTimeout(request, 0);
                pending = [];
            }
            pending.push({
                address: address,
                callback: function (status) {
                    addressCache[address] = status;
                    def.resolve(status);
                }
            });
        }
        return def.promise();
    }

    function request() {
        var current = pending;
        pending = null;
        
        var data = [];
        for (var i = 0; i < current.length; i++) data.push(current[i].address);

        /*setTimeout(function () {
            var reply = [];
            for (var i = 0; i < current.length; i++) {
                reply.push(Math.floor(Math.random() * 3));
            }
            done({ data: reply });
        }, 500 + Math.random() * 1000); */
        http.PUT({
            module: 'emig',
            params: { action: 'recipients' },
            data: data
        }).done(done);
        function done(reply) {
            for (var i = 0; i < current.length; i++) {
                current[i].callback(reply[i] || 0);
            }
        }
    }

});
