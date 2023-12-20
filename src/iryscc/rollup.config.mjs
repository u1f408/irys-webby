import { defineConfig } from 'rollup'
import { ROOT_DIR } from '../../shared/index.js'
import { defaultConfig } from '../../shared/rollup.mjs'

export default defineConfig([
	defaultConfig({
		name: 'pkfrontersApp',
		input: 'fronters/index.tsx',
		output: ROOT_DIR + '/dist/iryscc/fronters/index.js',
	}),
	defaultConfig({
		name: 'pkfronters',
		input: 'fronters/pkfronters.tsx',
		output: ROOT_DIR + '/dist/iryscc/fronters/pkfronters.js',
	}),
	defaultConfig({
		name: 'pkgrep',
		input: 'pk/grep/index.tsx',
		output: ROOT_DIR + '/dist/iryscc/pk/grep/index.js',
	}),
    defaultConfig({
        name: 'listy',
        input: 'pk/listy/listy.js',
        output: ROOT_DIR + '/dist/iryscc/pk/listy/listy.js',
    }),
])
