const Helper = require('@open-xchange/codecept-helper').helper,
    SOAP = require('soap'),
    codecept = require('codeceptjs');
class MyHelper extends Helper {

    executeSOAPRequest(type, action, data) {

        const config = codecept.config.get(),
            webDriver = config.helpers['WebDriverIO'];

        let url = webDriver.url;
        // remove /appsuite if appended to url
        if (url.search('appsuite\\/?$') >= 0) url = url.substring(0, url.search('appsuite\\/?$'));
        if (!/\/$/.test(url)) url += '/';

        url = `${url}webservices/${type}?wsdl`;

        return SOAP.createClientAsync(url).then(client => {
            return client[`${action}Async`](data);
        }).then(result => {
            return result;
        }, error => {
            console.error('Error', error.cause.root.Envelope.Body.Fault);
            throw error;
        });
    }
}

module.exports = MyHelper;
