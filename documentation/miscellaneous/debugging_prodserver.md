---
title: Debugging production servers
description: A how-to for debugging your local UI plugin in combination with production and staging servers, which use redirects, HTTPS, and other things which break with the auto-generated Grunt configuration.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Debugging_production_servers
---

# Introduction

Not everybody has access to a dedicated test server. 
Sometimes, a plugin requires a backend system which is hard to access outside of existing infrastructure. 
And sometimes, a bug appears only on a production server. 
There are many reasons why a server which is used by grunt dev can not be reconfigured and has to be used as-is.

The most frequent reason, why debugging with a remote server fails, is a redirect to an external login page. 
After the login, the browser is usually redirected to the original domain, and all the cookies used for authentication are also set for that domain, not [localhost:8337](http://localhost:8337), where Grunt listens.

The solution is to use grunt as an HTTP proxy server, which intercepts all requests to the server's domain.

In this article, example.com is user for the server domain, which you should replace by the real domain of the OX server.

# Configuring Grunt

Following is an example ``grunt/local.conf.json`` file:


```json
{
    "proxy": true,
    "appserver": {
        "protocol": "https",
        "livereload": false,
        "server": "https://example.com/custom-path/",
        "path": "/custom-path/",
        "rejectUnauthorized": false,
        "verbose": [],
        "prefixes": [
            "build/",
            "../../web/ui/build"
        ],
        "manifests": [
            "build/manifests/",
            "../../web/ui/build/manifests"
        ]
    },
    "debug": true,
    "coreDir": "../../web/ui/build"
}
```

_The relevant settings are_

__"proxy": true__

instructs Grunt to start an HTTP proxy on port 8080. 
Note that the value is outside the "appserver" section.

__"protocol": "https"__

to use HTTPS on port 8337.

__"livereload": false__

because LiveReload can't be proxied.

__"path": "/custom-path/"__

must correspond to the path in the "server" entry and will in most cases be "/appsuite/".

__"rejectUnauthorized": false__

is helpful with certificate problems, especially for integration tests of the login mechanism on a POC system with self-signed certificates.

__"index": "/"__

If the main path uses an HTTP redirect for a custom login page, then the initial request should not be intercepted by Grunt. 
Adding this entry in the "appserver" section disables the interception. 
This has two side-effects:

- The main HTML file is always served by the original server, and therefore
- The timestamps used for cache-busting are not updated by Grunt.

Unfortunately, this means clearing the cache will be required more often. 
If that becomes too much overhead, you can log in, then remove the option and restart Grunt.

# Generating certificates

To avoid unnecessary warnings in the browser, Grunt can use a set of certificates which are trusted by the browser. 
For local use, a self-created CA should be enough. 
By default, Grunt looks for the certificates in the subdirectory ssl, so you can create them there with the following commands:


```bash
mkdir ssl
cd ssl
openssl req -x509 -newkey rsa:4096 -keyout rootCA.key -days 3650 -out rootCA.crt
openssl req -newkey rsa:4096 -nodes -keyout host.key -out host.csr
```

While most data entered for the certificates doesn't matter, the Common Name for the certificate signing request in the second openssl command must match the domain of the "server" setting in local.conf.json. 
Alternatively, it can be a higher domain with a wildcard, e.g. *.example.com for "server": "https://my.example.com/appsuite/".


```javascript
openssl x509 -req -in host.csr -CA rootCA.crt -CAkey rootCA.key \
        -CAcreateserial -out host.crt -days 365
```

``host.csr`` is only temporary and can be deleted now. 
Only the files ``rootCA.crt``, ``host.key`` and ``host.crt`` are used by Grunt. 
The ``rootCA.*`` files can be reused to create multiple host certificates. 
The first openssl command then only needs to be executed once. 
The ``host.*`` files can also be reused as long as the domain(-wildcard) matches.

The file ``rootCA.crt`` needs to be imported into your browser as a trusted certificate authority (only once, if you are going to reuse the ``rootCA.*`` files). 
For Firefox, look in _Preferences → Advanced → Certificates → View Certificates → Authorities → Import..._ 
For Chrome, look in _Settings → Show advanced settings... → HTTPS/SSL → Manage certificates... → Authorities → Import..._ 
Since the authority can sign certificates for any domain, and its key is not protected much, it's better to not use the browser(-profile) which trusts this authority for normal Internet browsing.

# Launching the browser

After starting the proxy with grunt dev, you just need to use it when debugging your code in the browser. 
Most browsers have their own proxy settings, which override system-wide settings. 
They also respect environment variables like http_proxy.

```
http_proxy=http://localhost:8080 firefox
```

Chrome does not have its own settings (it starts the global settings dialog) and it ignores http_proxy. 
Instead, you have to use a command line parameter:

```bash
chromium --proxy-server=http://localhost:8080
```

