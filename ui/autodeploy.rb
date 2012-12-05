# gem install watchr
# gem install ruby-fsevent (On Mac OS X)
# or
# gem install rev (on Linux)
# watchr autodeploy.rb

#https://github.com/mynyml/watchr

def build 
  retval = system("./build.sh debug=true")
  if(retval)
    success
  else
    failure
  end
  true
end

def failure
  system("growlnotify -n \"OX 7 UI Build\" -m \"Build failed!\" -p 1")
end

def success
  system("growlnotify -n \"OX 7 UI Build\" -m \"Build succeeded!!\" -p -1")
end

watch("\.js$") { build }
watch("\.css$") { build }
watch("\.less$") { build }
watch("\.html$") { build }
watch("^docs") { build }
