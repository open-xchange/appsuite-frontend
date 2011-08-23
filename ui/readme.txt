
How to get the UI running
-------------------------

1.  Figure out Apache's document root. Common places are:

    - MacOS: /Library/WebServer/Documents
    - Linux: /var/www
    
2.  Create a new folder ox7 in Apache's document root

3.  Build the UI and the documentation with ant:

    ant -Dbuild=/Library/WebServer/Documents/ox7 all doc

4.  If everything works fine, the documentation should be at
    http://localhost/ox7/doc/apache.html. Continue reading there!

