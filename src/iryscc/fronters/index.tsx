import { g, x, n } from "@xeserv/xeact"
import { jsx } from "@meow/lib/jsx-runtime"
import { PKClient, render, DisplayType, Options } from "./pkfronters.tsx"
export { PKClient }

export const OnHashChange = (hash: string): Promise<void> => {
	const optform = g("app-options")
	if (hash.startsWith('#!'))
	{
		const [system, optstr] = hash.substring(2).split("/", 2)
		const opts = (new Options()).parseString(optstr || '')
		optform.elements["system"].value = system
		optform.elements["pronouns"].checked = opts.pronouns
		optform.elements["displayNames"].checked = opts.displayNames
		optform.elements["cardBorder"].checked = opts.cardBorder === "outer"
		optform.elements["newCard"].checked = opts.useNewCard

		return UpdateView(system, opts)
	}

	const el = g("fronters")
	x(el)
	el.append(
		<div class="pkfronters--helptext">
			<p>
				To view the current fronters of a&nbsp;
				<a href="https://pluralkit.me" target="_blank" rel="nofollow">PluralKit</a>
				&nbsp;system, click the <strong>Options</strong> button above,
				and enter a system ID!
			</p>
			<p>
				Need help? Ask in the <code>#third-party-resources</code> channel in the&nbsp;
				<a href="https://discord.gg/pluralkit" target="_blank" rel="nofollow">
					PluralKit support server
				</a>!
			</p>
		</div>
	)
}

const UpdateHeaders = async (system: string): Promise<void> => {
	const sysInfo = await PKClient.GetSystem(system)
	const displayTitle = sysInfo.name || `System ID ${sysInfo.id}`
	document.title = `${displayTitle} - PKfronters`
	g("name").innerText = displayTitle
}

export const UpdateView = async (system: string, opts: Options): Promise<void> => {
	await Promise.all([
		UpdateHeaders(system),
		render(system, g("fronters"), DisplayType.CARD, opts),
	])
}

const toggleOptions = () => {
	const panel = g("app-options")
	const button = g("app-btnOptions")

	if (panel.classList.contains("hidden")) {
		button.innerText = 'Close'
		panel.classList.remove("hidden")
	} else {
		button.innerText = 'Options'
		panel.classList.add("hidden")
	}
}

const onOptionSubmit = (ev: SubmitEvent) => {
	ev.preventDefault()

	const system = ev.target.elements["system"].value

	let opts = new Options()
	opts.pronouns = ev.target.elements["pronouns"].checked
	opts.displayNames = ev.target.elements["displayNames"].checked
	opts.cardBorder = ev.target.elements["cardBorder"].checked ? "outer" : "inner"
	opts.useNewCard = ev.target.elements["newCard"].checked

	const optstr = opts.toString()
	window.location.hash = '#!' + system + (optstr.length === 0 ? "" : '/' + optstr)
}

const init = () => {
	window.addEventListener('DOMContentLoaded', () => OnHashChange(window.location.hash))
	window.addEventListener('hashchange', () => OnHashChange(window.location.hash))

	if (window.location.hash !== "")
		setTimeout(0, () => OnHashChange(window.location.hash))

	const params = (new URL(document.location)).searchParams
	if (params.get('noui') === null) {
		g("app-header").classList.remove("hidden")
		g("app-btnOptions").addEventListener('click', () => toggleOptions())
		g("app-options").addEventListener('submit', (ev) => onOptionSubmit(ev), false)
	}

	document.body.classList.add("pkfronters-loaded")
}

if (typeof document.currentScript.dataset.noinit !== "string")
	init()
