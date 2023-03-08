import { h } from "@xeserv/xeact"

/**
 * Create a DOM element, assign the properties of `data` to it, and append all `data.children`.
 *
 * @type{function(string, Object=): HTMLElement}
 */
export const jsx = (tag, data, ...children) => {
	data = data !== null ? data : {}

	let classList = data.class || undefined
	delete data.class
	let style = data.style || {}
	delete data.style
	let dataset = data.dataset || {}
	delete data.dataset

	const result = h(tag, data, children)
	if (classList !== undefined) result.classList.value = classList
	Object.assign(result.style, style)
	Object.assign(result.dataset, dataset)
	return result
};
