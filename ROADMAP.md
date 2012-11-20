# Roadmap

## 1.4.1

   * Ctreate a plugin system, letting plugins register themselves and
      be activated by a plugins: option in the sceditor() function
   * Add keyboard shortcut support for commands
   * Improve table editing support
      Make this a plugin?
   * Add ability to resize images in browsers that don't have native WYSIWYG resize.
      Make this a plugin?
   * Add button state support
   * Add helper functions. Blur, focus, keypress, keyup, keydown
   * Add helpers for adding commands/bbcodes.
   * Add BBCode parser helpers for BBCode-to-HTML and HTML-to-BBCode
   * Add disable emoticons option


## 1.4.2

   * Consider adding support for BBCodes with just their BBCode and HTML replacement.
   * Add flash embedding command + BBCode
   * Add option to disable pasting, maybe allow a callback or show a message
   * Add option to only paste plain text
   * Add build page to website so only the commands and BBCodes needed are included
   * Add wget (or similar) support for build page so updating can be automated
   * Add localstorage/cookie support to build page to remember last options


## 1.4.3

   * Spell checker plugin?
   * HTML5 drag-drop file upload options with callbacks to handle the upload


## Future
   * Possibly add XHTML output support
   * Possibly create a page which helps create custom commands and BBCodes


# Ideas for the future

## Spell checker plugin

It should:

   * Be generic so it can work with any contentEditable/designMode element and if possible any textarea too.
   * Have it's own repository instead of using the SCEditor one.
   * Allow multiple spell checker backends so PHP, Ruby, ASP.NET, Python, ect. can be used as well as web API's.
   * Get a list of unique words and check them and cache the result.
   * Have option for AYT spell checking with x seconds delay.
   * Grab previous words around range and also have manual spell check button.
   * Wrap the wrong words in a span with a class so it can have custom styling.
   * When the span is clicked/right clicked it should show a menu with suggestions, might want to preload them in case it's being done via AJAX.
   * Have an option to allow adding words so backends that support adding words can add them.
   * Have an ingore word option which adds the word to the cache.
   * Have options to ignore capitalised words, split words with hyphens.
   * Have an option to set a custom word handler which is passed a string to extract the words from.
   * Have an option to replace all words spelled a certain way with the suggested word.

**Possible check format:**

	{
		words: [
			"teh",
			"quick",
			"brown",
			"fox"
		]
	}

**Possible return format:**

	{
		 // Would be set to a string to show the user if an error occurs.
		errors: null

		// Assoc array with the key being the word and the value being an array of suggestions.
		// Suggestions array can be empty if there are none.
		corrections: [
			"teh": [
				"the",
				"ten"
			]
		]
	}