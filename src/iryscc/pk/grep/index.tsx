import { g, x, s } from "@xeserv/xeact"
import { jsx } from "@meow/lib/jsx-runtime"
import { MediaProxyAvatar } from '@meow/lib/utils/media_proxy'
import PluralKitAPI, { PKClient, PKError, MemoryCache, type PKMember, type IPluralKitAPICache } from '@meow/lib/pluralkit'
import Markdown from '@meow/lib/markdown'

export const mkdnInline = (new Markdown()).removeRule('paragraph')
export const mkdn = (new Markdown()).removeRule('linebreak')
export const defaultAvatar = "https://cdn.discordapp.com/embed/avatars/0.png"
export const usableFields: { [key:string]: string } = {
	"name": "Member name",
	"display_name": "Display name",
	"description": "Description",
	"pronouns": "Pronouns",
	"color": "Color (hex code)",
	"proxy_tags": "Proxy tags",
}

export class SearchClient {
	#pk?: PluralKitAPI
	#cache?: IPluralKitAPICache

	constructor() {
		this.#cache = new MemoryCache()
	}

	setToken(token: string) {
		this.#pk = (new PluralKitAPI(token)).withCache(this.#cache)
	}

	async searchMembers(terms: { [key:string]: Array<Regexp> }): Array<PKMember> {
		let members = await this.#pk.GetSystemMembers()
		return members.filter((member) => 
			Object.entries(terms)
				.map(([key, terms]) => 
					terms
						.map((r) => {
							if (member[key] === null) {
								return []
							} else if (key === "proxy_tags") {
								let tags = member[key].map(({ prefix, suffix }) => `${prefix || ''}text${suffix || ''}`).join("\n")
								return tags.match(r)
							}

							return member[key].toString().match(r)
						})
						.every((x) => x !== null && x.length !== 0))
				.every((x) => x === true));
	}
}

export const client = new SearchClient()

export const renderMember = (member) => (
	<div class="result-member" dataset={{uuid: member.id, hid: member.id}}>
		<img class="result-member-avatar" src={MediaProxyAvatar(member.webhook_avatar_url || member.avatar_url || defaultAvatar)} style={{borderColor: '#' + (member.color || '000')}}></img>
		<div class="result-member-inner">
			<div class="result-member-name">
				<strong>{member.name}</strong>
				<span class="result-member-dn">{member.display_name}</span>
				<code class="result-member-hid">{member.id}</code>
			</div>

			{member.description === null ? '' : (
				<details class="result-member-desc">
					<summary>Description</summary>
					<blockquote innerHTML={mkdn.render(member.description || '')}></blockquote>
				</details>
			)}
		</div>
	</div>
)

export const onSearchSubmit = async (ev: SubmitEvent) => {
	ev.preventDefault()
	client.setToken(ev.target.elements["token"].value)
	if (ev.target.elements["token-save"].checked)
		window.localStorage.setItem("pk-token", ev.target.elements["token"].value)

	let searchTerms = {}
	Array.from(ev.target.querySelectorAll('.search-term'))
		.forEach((a) => {
			let t = a.children[0].value
			let v = a.children[1].value

			var r
			if (t === "phrase") {
				r = new RegExp('(?:^|\\W)' + v.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&") + '(?:\\W|$)', 'mi')
			} else {
				r = new RegExp(v, 'm')
			}

			searchTerms[a.parentElement.dataset.fieldName] ||= []
			searchTerms[a.parentElement.dataset.fieldName].push(r)
		})

	let res = g("result")
	x(res)
	res.append(<div class="result-loading">Loading...</div>)

	try {
		console.log("searchTerms", searchTerms)
		let members = await client.searchMembers(searchTerms)
		x(res)
		res.append(<div class="result-count">{members.length} result{members.length !== 1 ? 's' : ''}.</div>)
		res.append(...members.map(member => renderMember(member)))
	} catch (e) {
		x(res)
		res.append(<div class="result-error">An error occurred: <code>{e.message}</code></div>)
	}
}

export const removeSearchTerm = (ev: ClickEvent) => {
	ev.preventDefault()
	ev.target.parentElement.parentElement.removeChild(ev.target.parentElement)
}

export const addSearchTerm = (ev: ClickEvent) => {
	ev.preventDefault()
	let fieldId = `field-${ev.target.parentElement.dataset.fieldName}-${Math.floor(Math.random() * 999999)}`
	ev.target.parentElement.insertBefore((
		<div class="search-term" id={fieldId}>
			<select class="labelElement">
				<option value="phrase" selected>Phrase</option>
				<option value="regexp">RegExp</option>
			</select>
			<input type="text" required></input>
			<button class="clearButton" onclick={removeSearchTerm}>&times;</button>
		</div>
	), ev.target)
}

export const onToggleSave = (ev: Event) => {
	ev.preventDefault()
	if (ev.target.checked) {
		window.localStorage.setItem("pk-token", g("query").elements["token"].value)
	} else {
		window.localStorage.removeItem("pk-token")
	}
}

export const init = () => {
	g("query-fields").append(...Object.entries(usableFields).map(([key, friendly]) => (
		<fieldset class="query-field" dataset={{fieldName: key}}>
			<legend>{friendly}</legend>
			<button class="query-field--addterm">Add search term</button>
		</fieldset>
	)))

	s(".query-field--addterm").forEach((el) => el.addEventListener('click', (ev) => addSearchTerm(ev), false))
	g("query").addEventListener('submit', (ev) => onSearchSubmit(ev), false)

	g("query-token-save").addEventListener("change", (ev) => onToggleSave(ev), false)
	if (!!window.localStorage.getItem("pk-token")) {
		g("query-token-save").checked = true
		g("query-token").value = window.localStorage.getItem("pk-token")
	}
}

if (typeof document.currentScript.dataset.noinit !== "string")
	init()
