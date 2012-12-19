#! /bin/env ruby 

require 'find'

dir = ARGV.shift
prefix = ARGV.shift

Find.find(dir).each do
  |f|
  next unless f =~ /\.js$/
  
  moduleName = f.gsub(/^\./, prefix).gsub(/\.js$/, '')

  content = File.read(f)
  
  File.open(f, "w") do
    |fh|
    fh.puts content.sub(/define\(/, "define('#{moduleName}', ")
  end
end