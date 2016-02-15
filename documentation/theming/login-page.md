---
title: Theming the login page
description: How to create a customized theme for the default login page for your appsuite installation and also how to configure different ones for different hostnames.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Theming_the_login_page
---

It only explains where and how to configure and apply the modifications but not the basics of App Suite theming.

# style.less

To apply a theme to the login page you just add the relevant snippets to the ``style.less`` file like for a normal theme and include the logos and artifacts in the theme directory.

Here are some examples of CSS selectors which can be addressed on the login page:

```
#io-ox-login-username
#io-ox-login-screen .btn-primary
#io-ox-login-screen .btn-primary:hover
#io-ox-login-header-prefix
#io-ox-login-header-label
#io-ox-login-container
.wallpaper
body.down #io-ox-login-container .alert.alert-info
.language-delimiter
#io-ox-copyright
```

# as-config.yml

To actually apply the above definition the theme needs to be specified in the file ``/opt/open-xchange/etc/as-config.yml``:


```yaml
signinTheme: MYTHEME
```

As as-config.yml can have different configuration based on different hostnames a multi branded configuration can be applied as well.




