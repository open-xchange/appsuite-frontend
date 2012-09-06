
os=`uname`
if [[ "$os" == 'Darwin' ]]; then
   node lib/appsserver.js /Library/WebServer/Documents/ox7/apps
else
  node lib/appsserver.js 
fi
