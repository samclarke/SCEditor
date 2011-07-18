#! /bin/bash

# compress CSS
echo "Minimising CSS"
yui-compressor --type css -o minified/jquery.sceditor.min.css jquery.sceditor.css

# compres JS
echo "Minimising JavaScript"
cat jquery.sceditor.js jquery.sceditor.bbcode.js > minified/jquery.sceditor.min.js
yui-compressor --type js -o minified/jquery.sceditor.min.js minified/jquery.sceditor.min.js

