const shared = require('./index.js')

module.exports = function(input) {
	return function(eleventyConfig) {
		eleventyConfig.addGlobalData('meow', {
			rootDir: shared.ROOT_DIR,
			assetBase: process.env.ASSET_BASE || '//assets.irys.cc',
		})

		return input(eleventyConfig)
	}
}
