---
layout: page.njk
title: Embedding PKfronters in your own site
---

<p class="banner">
<strong>A note for Carrd users:</strong>
Embedding PKfronters in a Carrd is done differently, and requires Carrd Pro to work.
<a href="carrd/">See the PKfronters Carrd embed page for more information!</a>
</p>

To embed PKfronters in your own site, granting you full control over the CSS, all you need is two lines of HTML!
Copy and paste the code below, and change `exmpl` to your PluralKit system ID.

```html
<div data-pkfronters-system="exmpl" data-pkfronters-type="card"></div>
<script src="https://irys.cc/fronters/pkfronters.js" async></script>
```

## Display types

PKfronters supports two display types: `card` and `list`. You can choose which one is used with the `data-pkfronters-type` attribute on the embed code.

The `card` display type is the one used on the main PKfronters site: it displays your current fronters' avatars, as well as their names and pronouns.

The `list` display type renders a simple list of your current fronters' names and pronouns, as an HTML `ul` element.

## Options

There are some options that can be enabled by adding their names, separated by commas, to the `data-pkfronters-options` attribute on the embed code.
Options can be explicitly disabled by prefixing their name with an exclamation point (`!`).

The available options are:

* `dn` or `displayname` _(default: off)_ — Use member display names, instead of their base member names
* `cbo` or `card_border_outer` _(default: off)_ — For the `card` display mode: apply the member color to the border of the whole card, rather than the avatar image
* `prns` or `pronouns` _(default: on)_ — Shows each member's pronouns (the `pk;m <name> pronouns` field) underneath their avatar

For example, to embed a list of the fronting members' display names, with their pronouns hidden, you could use:

```html
<div data-pkfronters-system="exmpl" data-pkfronters-type="list" data-pkfronters-options="dn,!prns"></div>
```

## Example CSS

Take a look at [pkfronters.css](../pkfronters.css) - this is the base CSS used in the main PKfronters site, and should give you a good starting point to work from :)

## Support

Feel free to ask any questions in the `#third-party-discussion` channel of the [PluralKit support Discord server](https://discord.gg/pluralkit)!
