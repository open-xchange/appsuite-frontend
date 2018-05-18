HOWTO quickly test:

1. Build the core UI in ../ui with npm install; grunt
2. Build the plugin with npm install; grunt
3. npm test
4. Test the core UI with grunt dev
5. Set some interesting colors in the browser console:
   require('io.ox/dynamic-theme/less').setVars({ mainColor: 'red' })
