---
title: Analytics framework 
---

## PIWIK

### high level view

PIWIK is a free and open source web analytics application written by a team of international developers that runs on a PHP/MySQL webserver. 

It’s self-hosted, so you own all of your data and can be sure that you’ve always got it in a format that isn’t restricted by another app’s export regulations. Also, due to the nature of open source projects (and the fact that PIWIK is pretty popular) it’s regularly updated by a core team of developers, so the latest stable version is always available to download and install onto as many servers as needed, absolutely free of charge.

GNU GPL

###Links

+ User Guides: [http://piwik.org/docs/](http://piwik.org/docs/)
+ PIWIK FAQ: [http://piwik.org/faq/](http://piwik.org/faq/)
+ PIWIK Forums: [http://forum.piwik.org/](http://forum.piwik.org/)

High level review: http://blog.crazyegg.com/2014/04/09/open-source-analytics/


### technical setup

While this article was written the current version of PIWIK was 2.14.0. Please follow the simple steps provided by the PIWIK docs.

http://piwik.org/docs/installation/

You don't need to add the provided snippet to your code. This is managed by the setup function within the PIWIK adapter. For more details have a look at the code.

Please be aware that as default the PIWIK tracker uses siteId = 1.


