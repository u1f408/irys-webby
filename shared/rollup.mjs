import alias from '@rollup/plugin-alias'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import path from 'node:path'
import { ROOT_DIR } from './index.js'

export const customResolver = nodeResolve({
	extensions: ['.mjs', '.js', '.ts', '']
})

export function defaultConfig({ name, input, output }) {
	return {
		input,
		output: {
			name,
			file: output,
			format: 'umd',
			sourcemap: true,
		},
		plugins: [
			alias({
				entries: [
					{
						find: "@meow/lib",
						replacement: path.resolve(ROOT_DIR, 'lib'),
					}
				],
				customResolver,
			}),
			nodeResolve(),
			esbuild({
				sourceMap: true,
				minify: true,
			}),
		],
	}
}
