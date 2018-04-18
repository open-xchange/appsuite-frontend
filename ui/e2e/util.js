const codecept = require('codeceptjs'),
    axios = require('axios'),
    FormData = require('form-data');

let util = module.exports = {

    getURLRoot: function () {
        const config = codecept.config.get(),
            webDriver = config.helpers['WebDriverIO'],
            url = webDriver.url,
            pathArray = url.split('/'),
            protocol = pathArray[0],
            host = pathArray[2];
        return `${protocol}//${host}`;
    },

    getSessionForUser: (function () {
        var cache = {};

        function parseCookies(res) {
            return res.headers['set-cookie'].map(function (str) {
                var list = str.split(';');
                return list.filter(function (item) {
                    item = item.trim();
                    if (item.indexOf('Path') === 0) return false;
                    if (item.indexOf('HttpOnly') === 0) return false;
                    return true;
                }).join('; ');
            }).join('; ');
        }
        return function (options) {
            options = options || {};
            const user = options.user || require('./users')[0];

            if (cache[user.name]) return Promise.resolve(cache[user.name]);

            const httpClient = axios.create({
                baseURL: util.getURLRoot(),
                withCredentials: true
            });

            return httpClient.post('/appsuite/api/login', require('querystring').stringify({
                action: 'login',
                name: user.name,
                password: user.password,
                client: 'open-xchange-appsuite'
            })).then(function (res) {
                // store cookie manually as we are not inside a browser environment
                httpClient.defaults.headers.common.Cookie = parseCookies(res);
                cache[user.name] = { session: res.data.session, httpClient };
                return cache[user.name];
            });
        };
    }()),

    setDeepValue: function (key, value, target) {
        let keys = key.split('/');
        keys.forEach(function (key, index) {
            if (index === keys.length - 1) {
                target[key] = value;
            } else {
                target = target[key] = target[key] || {};
            }
        });
    },

    jsonToForm(json) {
        let form = new FormData();
        for (let key in json) {
            if (json[key] instanceof Object) form.append(key, JSON.stringify(json[key]));
            else form.append(key, json[key]);
        }
        return form;
    }

};
