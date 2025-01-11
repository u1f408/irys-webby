import type { PKResponse, PKSystem, PKMember } from "./types"
export type { PKResponse, PKSystem, PKMember }
import type { IPluralKitAPICache } from "./cache"
export type { IPluralKitAPICache }
import { MemoryCache } from "./cache"
export { MemoryCache }
import { PKError } from "./types"
export { PKError }

export const PK_API_BASE_URL: string = "https://api.pluralkit.me/v2";
export const PK_BETA_API_BASE_URL: string = "https://api.beta.pluralkit.me/v2";

export default class PluralKitAPI {
	readonly #token?: string
	#cache?: IPluralKitAPICache
	apiBase: string

	constructor(token: string | null = null, apiBase: string = PK_API_BASE_URL) {
		this.#token = token
		this.apiBase = apiBase
	}

	setCache(cache: IPluralKitAPICache) {
		this.#cache = cache
	}

	withCache(cache: IPluralKitAPICache): PluralKitAPI {
		this.setCache(cache)
		return this
	}

	private finalUrl(fragment: Array<string>): string {
		return this.apiBase + "/" + fragment.join("/")
	}

	private deriveHeaders(): { [key:string]: string } {
		var headers = {
			'Accept': 'application/json'
		}

		if (this.#token !== null) {
			if (this.#token.startsWith("pkapi:"))
				headers['Authorization'] = `Bearer ${this.#token}`;
			else
				headers['Authorization'] = this.#token;
		}

		return headers
	}

	private async get(fragment: string[]): PKResponse<any> {
		const cachedResponse = this.#cache.GetCachedResponse(fragment)
		if (cachedResponse !== null) {
			console.log(`returning cached response for ${'/' + fragment.join('/')}`)
			return cachedResponse
		}

		const url: string = this.finalUrl(fragment)
		const response = await window.fetch(url, {
			method: 'GET',
			headers: this.deriveHeaders(),
		})

		const data = await response.json()

		if (!response.ok)
			throw new PKError(data.code, data.message, data.errors)

		this.#cache.CacheResponse(fragment, data)
		return data
	}

	public async GetSystem(id: string = "@me"): PKResponse<PKSystem> {
		return await this.get(["systems", id])
	}

	public async GetSystemMembers(id: string = "@me"): PKResponse<Array<PKMember>> {
		const response = await this.get(["systems", id, "members"]);
		return response
	}

	public async GetSystemFronters(id: string = "@me"): PKResponse<Array<PKMember>> {
		const response = await this.get(["systems", id, "fronters"])
		return response['members']
	}
}

const memoryCache = new MemoryCache()
export const PKClient = (new PluralKitAPI()).withCache(memoryCache)
