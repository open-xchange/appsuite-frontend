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
After the login, the browser is usually redirected to the original domain, and all the cookies used for authentication are also set for that domain, not `localhost:8337`, where Grunt listens.

The solution is to use grunt as an HTTP proxy server, which intercepts all requests to the server's domain.

In this article, _`example.com`_ is used for the server domain, which you should replace by the real domain of the OX server.

# Configuring Grunt

Following is an example `grunt/local.conf.json` file:

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

The relevant settings are:

**`"proxy": true`**

instructs Grunt to start an HTTP proxy on port 8080.
Note that the value is outside the "appserver" section.

**`"protocol": "https"`**

to use HTTPS on port 8337.

**`"livereload": false`**

because LiveReload can't be proxied.

**`"path": "/custom-path/"`**

must correspond to the path in the "server" entry and will in most cases be "/appsuite/".

**`"rejectUnauthorized": false`**

is helpful with certificate problems, especially for integration tests of the login mechanism on a POC system with self-signed certificates.

**`"index": "/"`**

If the main path uses an HTTP redirect for a custom login page, then the initial request should not be intercepted by Grunt.
Adding this entry in the "appserver" section disables the interception.
This has two side-effects:

1. The main HTML file is always served by the original server, and therefore
2. The timestamps used for cache-busting are not updated by Grunt.

Unfortunately, this means clearing the cache will be required more often.
If that becomes too much overhead, you can log in, then remove the option and restart Grunt.

# Generating certificates

To avoid unnecessary warnings in the browser, Grunt can use a set of certificates which are trusted by the browser.
For local use, there is a tool called [mkcert](https://github.com/FiloSottile/mkcert) to greatly simplify the setup.
Once installed, it can be used to easily generate new certificates on demand.

By default, Grunt looks for the certificates in the subdirectory `ssl`, so you can copy the CA certificate there with the following commands:

```bash
mkdir ssl
# on MacOS, this file is generated at ~/Library/Application\ Support/mkcert/rootCA.pem
cp ~/.local/share/mkcert/rootCA.pem ssl/rootCA.crt
```

To create a certificate for one or more domains, run `mkcert` according to its documentation:

```bash
mkcert -cert-file=ssl/host.crt -key-file=ssl/host.key example.com "*.example.com" "*.subdomain.example.com" completely.different.domain.com localhost 127.0.0.1
```

The file `ssl/rootCA.crt` needs to be imported into your browser as a trusted certificate authority (`mkcert -install` should have taken care of that).
For Firefox, look in _Preferences → Advanced → Certificates → View Certificates → Authorities → Import..._
For Chrome, look in _Settings → Show advanced settings... → HTTPS/SSL → Manage certificates... → Authorities → Import..._
Since the authority can sign certificates for any domain, and its key is not protected much, it's better to not use the browser(-profile) which trusts this authority for normal Internet browsing.

# Launching the browser

After starting the proxy with `grunt dev`, you just need to use it when debugging your code in the browser.
Most browsers have their own proxy settings, which override system-wide settings.
They also respect environment variables like `http_proxy`.

```bash
http_proxy=http://localhost:8080 firefox
```

Chrome/Chromium does not have its own settings (it starts the global settings dialog) and it ignores `http_proxy`.
Instead, you have to use a command line parameter:

```bash
chromium --proxy-server=http://localhost:8080
```
