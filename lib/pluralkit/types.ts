export class PKError {
	code: number
	message: string
	errors?: { [key:string]: string }

	constructor(code: number, message: string, errors: any) {
		this.code = code
		this.message = message
		this.errors = errors
	}
}

export type PKResponse<T, E = PKError> = {
	catch<TResult = never>(
		onrejected?: ((reason: E) => TResult | PromiseLike<TResult>) | undefined | null
	): Promise<T | TResult>
} & Promise<T>

export type PKSystem = {
	id: string
	uuid: string
	name?: string
	description?: string
	tag?: string
	pronouns?: string
	avatar_url?: string
	banner?: string
	color?: string
}

export type PKMember = {
	id: string
	uuid: string
	name?: string
	display_name?: string
	color?: string
	pronouns?: string
	avatar_url?: string
}
