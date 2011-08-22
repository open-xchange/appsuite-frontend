
How to get the UI running with eclipse
--------------------------------------

* Check out (you should have done that)

* Configure environment variable for ant build:

    - MacOS: /Library/WebServer/Documents/ox7
    - Linux: /var/www/ox7
    
    Usually you have to create the folder ox7 in the proper directory.
    
* Tell your Apache to eat .htaccess files and how to connect to backend:

    ProxyPass /ajax http://localhost/ajax retry=0 connectiontimeout=5 timeout=10

    <Directory /Library/WebServer/Documents/ox7>
      Options None +SymLinksIfOwnerMatch
      AllowOverride Indexes FileInfo
    </Directory>
    
    Use the proper path for your OS!

* If backend is not on localhost, adjust that.

* Restart Apache, e.g. "sudo apachectl restart"

* And please double check everything you're doing!
