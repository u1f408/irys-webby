---
layout: page.njk
title: Embedding PKfronters in your Carrd
---

<p class="banner">
If you want to embed PKfronters in a Neocities site (or any other website!),
<a href="../">have a look at the regular embedding page.</a>
</p>

**NOTE:** To embed PKfronters in Carrd, a Carrd Pro account is _required_!

## Getting started

First, go to [the main PKfronters site](/fronters), enter your system ID and select which options you want to use to display your currently fronting members.
Once you're happy with how it looks, copy the page URL to your clipboard.

You will now need to create a new "iframe" widget in your Carrd, and paste the URL you just copied into the URL field for that Carrd widget.
Before saving, you need to make one small adjustment to the URL: just before the `#!` in the URL, you need to add `?noui` - this is the flag that tells PKfronters that you're embedding in a Carrd.

Your final iframe URL in the Carrd settings should look like this: `https://irys.cc/fronters/?noui#!exmpl/...`
(with your system ID after the `#!`, and the codes for any settings you've set after that).

Save your Carrd, and you're done!

## Support

Feel free to ask any questions in the `#third-party-discussion` channel of the [PluralKit support Discord server](https://discord.gg/pluralkit)!
