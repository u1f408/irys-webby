import { g, x, s } from "@xeserv/xeact"
import { jsx } from "@meow/lib/jsx-runtime"
import { MediaProxyAvatar } from '@meow/lib/utils/media_proxy'
import PluralKitAPI, { PKClient, PKError, type PKMember } from '@meow/lib/pluralkit'
import Markdown from '@meow/lib/markdown'

const mkdnInline = (new Markdown()).removeRule('paragraph')
const mkdn = new Markdown()

export enum DisplayType {
	LIST = 0,
	CARD,
}

export class Options {
	public pronouns: bool
	public displayNames: bool
	public cardBorder: "inner" | "outer"
	public useNewCard: bool
	public fallbackAvatarUrl?: string

	constructor() {
		this.pronouns = true
		this.displayNames = false
		this.cardBorder = "inner"
		this.useNewCard = false
		this.fallbackAvatarUrl = null
	}

	parseString(optstr: string): Options {
		for (const opt of optstr.matchAll(/(!?)([^\s,]+)/g)) {
			const value: bool = opt[1] !== "!"
			switch (opt[2]) {
				case "card_border_outer":
				case "cbo":
					this.cardBorder = value ? "outer" : "inner"
					break
				case "pronouns":
				case "prns":
					this.pronouns = value
					break
				case "displayname":
				case "dn":
					this.displayNames = value
					break
				case "newcard":
				case "nc":
					this.useNewCard = value
					break
			}
		}

		return this
	}

	toString(): string {
		const weh = (name: string, key: string, option: bool): string =>
			this[key] != (new Options())[key] ? (option ? name : '!' + name) : null

		let opts: string[] = [];
		opts.push(weh("prns", "pronouns", this.pronouns))
		opts.push(weh("dn", "displayNames", this.displayNames))
		opts.push(weh("cbo", "cardBorder", this.cardBorder === "outer"))
		opts.push(weh("nc", "useNewCard", this.useNewCard))

		return opts.filter(w => w !== null).join(',')
	}

	fallbackAvatar(id: string): string {
		if (this.fallbackAvatarUrl !== null)
			return this.fallbackAvatarUrl

		let hash = 0
		for (let i = 0; i < id.lengnth; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash &= hash
		}

		return `https://cdn.discordapp.com/embed/avatars/${(hash % 5).toString()}.png`
	}
}

const memberCardStyle = (member: PKMember, opts: Options): { [key:string]: string } => ({
	'borderColor': (opts.useNewCard || opts.cardBorder === "outer") ? "#" + (member.color || '000') : undefined,
})

const memberCardAvatarStyle = (member: PKMember, opts: Options): { [key:string]: string } => ({
	'borderColor': (!opts.useNewCard && opts.cardBorder === "inner") ? "#" + (member.color || '000') : undefined,
	'borderWidth': (opts.useNewCard || opts.cardBorder === "outer") ? "0px" : undefined,
	'backgroundImage': `url(${MediaProxyAvatar(member.webhook_avatar_url || member.avatar_url || opts.fallbackAvatar(member.uuid))})`,
	'backgroundRepeat': 'no-repeat',
	'backgroundPosition': 'center center',
	'backgroundSize': 'cover',
})

const renderMemberCard = (member: PKMember, opts: Options): DOMElement => (
	<div class={"pkfronters--member-card" + (opts.useNewCard ? " pkfronters--newcard" : "")} style={memberCardStyle(member, opts)}>
		<div class="pkfronters--member-card--avatar" style={memberCardAvatarStyle(member, opts)}></div>
		<strong class="pkfronters--member-card--name">
			{opts.displayNames ? member.display_name || member.name : member.name}
		</strong>
		{opts.pronouns && member.pronouns !== null ? (
			<span class="pkfronters--member-card--pronouns" innerHTML={mkdnInline.render(member.pronouns)}></span>
		) : ""}
	</div>
)

export const renderCards = (element: DOMElement, fronters: Array<PKMember>, opts: Options) => {
	x(element)
	element.classList = ("pkfronters--member-card-container" + (opts.useNewCard ? " pkfronters--newcard" : ""));
	element.append(...fronters.map(m => renderMemberCard(m, opts)));
}

const renderListItem = (member: PKMember, opts: Options): DOMElement => (
	<li>
		<strong class="pkfronters--member-list--name">
			{opts.displayNames ? member.display_name || member.name : member.name}
		</strong>
		{opts.pronouns && member.pronouns !== null ? (
			<span class="pkfronters--member-list--pronouns" innerHTML={mkdnInline.render(member.pronouns)}></span>
		) : ""}
	</li>
)

export const renderList = (element: DOMElement, fronters: Array<PKMember>, opts: Options) => {
	x(element)
	element.append(
		<ul class="pkfronters--member-list">
			{...fronters.map(m => renderListItem(m, opts))}
		</ul>
	)
}

export const render = async (system: string, element: DOMElement, type: DisplayType, opts: Options) => {
	x(element)
	element.append(
		<div class="pkfronters--loading">
			Loading fronters for PluralKit system <code>{system}</code>&#x2026;
		</div>
	)

	try {
		const fronters = await PKClient.GetSystemFronters(system)
		switch (type) {
			case DisplayType.CARD:
				renderCards(element, fronters, opts)
				break

			case DisplayType.LIST:
				renderList(element, fronters, opts)
				break
		}
	} catch (e) {
		console.log(e)

		var inner = (
			<span class="pkfronters--error-details">
				Exception: {e.message}
			</span>
		)

		if (e instanceof PKError) {
			inner = (
				<span class="pkfronters--error-details">
					PluralKit returned error code <code>{e.code}</code>:&nbsp;
					{e.message}
				</span>
			)
		}

		x(element)
		element.append(
			<div class="pkfronters--error">
				Failed to load fronters for system <code>{system}</code>:&nbsp;
				{inner}
			</div>
		)
	}
}

export const renderAll = async () => {
	await Promise.all(s("[data-pkfronters-system]").map(el => {
		let opts = (new Options()).parseString(el.dataset.pkfrontersOptions || '')
		let type = DisplayType[(el.dataset.pkfrontersType || 'LIST').toUpperCase()]
		return render(el.dataset.pkfrontersSystem, el, type, opts)
	}))
}

// render all available on script load, if we're not prohibited from doing so
if (typeof document.currentScript.dataset.pkfrontersNoauto !== "string") {
	setTimeout(0, renderAll())
}
