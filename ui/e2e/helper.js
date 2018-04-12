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

}

module.exports = MyHelper;
