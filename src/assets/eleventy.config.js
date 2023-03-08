const shared = require('../../shared/index.js')
const eleventyWrapper = require('../../shared/eleventy.js')

module.exports = eleventyWrapper(function() {
	return {
		dir: {
			input: ".",
			output: shared.ROOT_DIR + "/dist/assets",
			includes: "_includes",
			layouts: "_includes",
			data: "_data",
		},
	}
})
