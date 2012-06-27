#! /bin/bash

# To use this build file type
# $ ./build/build.sh
# in the terminal from the root directory.
#
# You must have uglifyjs, lessc, jsdoc, glue and yui-compressor
# in order to run this buil script.

USAGE="Usage: `basename $0` [--css|--js|--docs]"

DO_CSS=false
DO_JS=true
DO_DOCS=false

while true; do
	case "$1" in
		-c | --css )	DO_CSS=true; shift ;;
		-j | --js )	DO_JS=true; shift ;;
		-d | --docs )	DO_DOCS=true; shift ;;
		* ) break ;;
	esac
done


if $DO_CSS; then
	echo "Creating CSS sprites"

	glue themes/icons/src/famfamfam themes/icons --less --algorithm=vertical --optipng --namespace=sceditor-button
	sed -i 's/famfamfam\-//' themes/icons/famfamfam.less
	sed -i 's/url,/link,/' themes/icons/famfamfam.less
	sed -i 's/url{/link{/' themes/icons/famfamfam.less
	sed -i 's/{/ div {/' themes/icons/famfamfam.less
	sed -i 's/,/ div,/' themes/icons/famfamfam.less
	sed -i 's/grip div/grip/' themes/icons/famfamfam.less

	for f in themes/icons/*.png
	do
		echo "Processing $f file..";

		filename=$(basename "$f")
		filename="${filename%.*}"

		cp $f minified/themes/$filename.png
	done

	echo "Minimising CSS"
	for f in themes/*.less
	do
		echo "Processing $f file..";

		filename=$(basename "$f")
		filename="${filename%.*}"

		lessc --yui-compress $f > minified/themes/$filename.min.css
	done

	yui-compressor --type css -o minified/jquery.sceditor.default.min.css jquery.sceditor.default.css
fi

if $DO_JS; then
	echo "Minimising JavaScript"

	cat jquery.sceditor.js jquery.sceditor.bbcode.js > minified/jquery.sceditor.min.js

	uglifyjs -nc --overwrite minified/jquery.sceditor.min.js

	#java -jar build/compiler.jar --js=jquery.sceditor.js --js=jquery.sceditor.bbcode.js --js_output_file=minified/jquery.sceditor.min.js
fi

if $DO_DOCS; then
	echo "Creating Docs"

	jsdoc --exclude=jquery.sceditor.xhtml.js -D="title:SCEditor" -D="noGlobal:true" -t=./build/CodeView -d=./docs ./
fi

