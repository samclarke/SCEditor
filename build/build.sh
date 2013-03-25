#! /bin/bash

# To use this build file type
# $ ./build/build.sh
# in the terminal from the root directory.
#
# In order to run this build script, following must be installed:
#
#   * UglifyJS
#   * Lessc
#   * JSDoc
#   * YUI compresser (for compressing the CSS)
#
# To install in Ubuntu type:
# $ sudo apt-get install node-uglify node-less jsdoc-toolkit yui-compressor

USAGE="Usage: `basename $0` [--css|--js|--docs]"

DO_CSS=false
DO_JS=false
DO_DOCS=false

while true; do
	case "$1" in
		-c | --css )	DO_CSS=true; shift ;;
		-j | --js )	DO_JS=true; shift ;;
		-d | --docs )	DO_DOCS=true; shift ;;
		* ) break ;;
	esac
done

if ! $DO_CSS ! $DO_JS ! $DO_DOCS; then
	echo $USAGE;
fi

if $DO_CSS; then
	echo "Creating CSS sprites"

	for f in src/themes/icons/*.png
	do
		echo "Processing $f file..";

		filename=$(basename "$f")
		filename="${filename%.*}"

		cp $f minified/themes/$filename.png
	done

	echo "Minimising CSS"
	for f in src/themes/*.less
	do
		echo "Processing $f file..";

		filename=$(basename "$f")
		filename="${filename%.*}"

		lessc --yui-compress $f > minified/themes/$filename.min.css
	done

	yui-compressor --type css -o minified/jquery.sceditor.default.min.css src/jquery.sceditor.default.css
fi

if $DO_JS; then
	echo "Minifying JavaScript"

	cat src/jquery.sceditor.js src/plugins/bbcode.js > minified/jquery.sceditor.bbcode.min.js
	cat src/jquery.sceditor.js src/plugins/xhtml.js > minified/jquery.sceditor.xhtml.min.js

	echo "Minifying SCEditor"
	uglifyjs --comments '/^!/' -c -m -o minified/jquery.sceditor.min.js src/jquery.sceditor.js
	uglifyjs --comments '/^!/' -c -m -o minified/jquery.sceditor.xhtml.min.js minified/jquery.sceditor.xhtml.min.js
	uglifyjs --comments '/^!/' -c -m -o minified/jquery.sceditor.bbcode.min.js minified/jquery.sceditor.bbcode.min.js

	echo "Minifying plugins"
	for f in src/plugins/*.js
	do
		echo "Minifying file $f..";

		filename=$(basename "$f")
		filename="${filename%.*}"

		cp $f minified/plugins/$filename.js
		uglifyjs --comments '/^!p/' -c -m -o minified/plugins/$filename.js minified/plugins/$filename.js
	done
fi

if $DO_DOCS; then
	echo "Creating Docs"

	jsdoc -D="title:SCEditor" -D="noGlobal:true" -t=./build/CodeView -d=./docs ./src ./src/plugins/bbcode.js ./src/plugins/xhtml.js
fi

