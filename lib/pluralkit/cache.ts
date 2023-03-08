import type { PKResponse } from "./types"

interface IPluralKitAPICache {
	CacheResponse(fragment: string[], response: any): void
	GetCachedResponse(fragment: string[]): any
}

class MemoryCache implements IPluralKitAPICache {
	readonly _cache: { [key:string]: any }

	constructor() {
		this._cache = {};
	}

	CacheResponse(fragment: string[], response: any) {
		this._cache[fragment.join("/")] = response
	}

	GetCachedResponse(fragment: string[]): any {
		const key = fragment.join("/")
		if (key in this._cache)
			return this._cache[key]
		return null
	}
}

export { MemoryCache }
export type { IPluralKitAPICache }
