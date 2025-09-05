const path = require('node:path')
const fs = require('node:fs')

const shared = require('./index.js')

function getGitRev() {
    const rev = fs.readFileSync(path.resolve(shared.ROOT_DIR, '.git/HEAD')).toString().trim().split(/.*[: ]/).slice(-1)[0]
    if (rev.indexOf('/') === -1) {
        return rev
    } else {
        return fs.readFileSync(path.resolve(shared.ROOT_DIR, '.git/' + rev)).toString().trim()
    }
}

module.exports = function(input) {
    return function(eleventyConfig) {
        eleventyConfig.addGlobalData('meow', {
            rootDir: shared.ROOT_DIR,
            assetBase: process.env.ASSET_BASE || '//assets.irys.cc',
            gitRev: process.env.GIT_REVISION || getGitRev(),
            isDeploymentBuild: (process.env.IS_DEPLOYMENT_BUILD || '') === '1',
        })

        return input(eleventyConfig)
    }
}
