import { u } from "@xeserv/xeact"

const discordMediaPattern = /^https:\/\/cdn\.discordapp\.com\/attachments\/([^?]+)/i

export const RewriteDiscordMediaProxy = (url: string, dimensions: number | number[] = 256, format: string = "webp"): string => {
	dimensions = (typeof dimensions === "number") ? [dimensions, dimensions] : dimensions

	let matches;
	if ((matches = discordMediaPattern.exec(url)) !== null) {
		url = u(`https://media.discordapp.net/attachments/${matches[1]}`, {
			width: dimensions[0],
			height: dimensions[1],
			format,
		})
	}

	return url;
}

export const MediaProxyAvatar = (url: string): string => RewriteDiscordMediaProxy(url, 256, "webp")

export default RewriteDiscordMediaProxy
