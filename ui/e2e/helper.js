const Helper = require('@open-xchange/codecept-helper').helper,
    SOAP = require('soap'),
    util = require('./util');
class MyHelper extends Helper {

    executeSoapRequest(type, action, data) {

        let baseURL = util.getURLRoot(),
            url = `${baseURL}/webservices/${type}?wsdl`;

        data.auth = { login: 'oxadmin', password: 'secret' };

        return SOAP.createClientAsync(url).then(client => {
            return client[`${action}Async`](data);
        }).catch(error => {
            if (error &&
                error.cause &&
                error.cause.root &&
                error.cause.root.Envelope &&
                error.cause.root.Envelope.Body &&
                error.cause.root.Envelope.Body.Fault) {
                console.error('Error', error.cause.root.Envelope.Body.Fault);
            }

            throw error;
        });
    }

    haveSetting(key, value, options) {
        options = options || {};
        const input = key.split('//'),
            moduleName = input[0];

        key = input[1];

        return util.getSessionForUser(options).then((data) => {
            return data.httpClient.put('/appsuite/api/jslob', [moduleName], {
                params: {
                    action: 'list',
                    session: data.session
                }
            }).then(response => [response, data]);
        }).then(([response, sessionData]) => {
            const data = response.data.data[0],
                tree = data.tree;

            util.setDeepValue(key, value, tree);

            return sessionData.httpClient.put('/appsuite/api/jslob', tree, {
                params: {
                    action: 'set',
                    id: moduleName,
                    session: sessionData.session
                }
            });
        }, err => {
            console.error(err);
            throw err;
        });
    }

    haveSnippet(snippet, options) {
        return util.getSessionForUser(options).then((data) => {
            return data.httpClient.put('/appsuite/api/snippet', snippet, {
                params: {
                    action: 'new',
                    session: data.session
                }
            });
        }).then(response => {
            return response.data;
        }, err => {
            console.error(err);
            throw err;
        });
    }

    haveMail(mail, options) {
        return util.getSessionForUser(options).then(data => {
            let form = util.jsonToForm({ json_0: mail });
            return data.httpClient.post('/appsuite/api/mail', form, {
                params: {
                    action: 'new',
                    force_json_response: true,
                    lineWrapAfter: 0,
                    session: data.session
                },
                headers: form.getHeaders()
            });
        }).catch(err => {
            console.error('error', err);
        });
    }

}

module.exports = MyHelper;
