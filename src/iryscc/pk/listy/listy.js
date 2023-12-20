;(function (document, window) {
	if (typeof window.listy !== "undefined") return;

	window.listy = {
		_api_base: "https://api.pluralkit.me/v2",

		queryApi: function queryApi(slug, token) {
			return fetch(window.listy._api_base + slug, {
				headers: {
					Accept: "application/json",
					Authorization: token === null ? null : token,
				},
			})
			.then(function(res) {
				if (!res.ok) {
					return Promise.reject("PluralKit API responded with a " + res.status + " for " + slug);
				}

				return res;
			})
			.then(function(res) { return res.json(); });
		},

		doList: function doList(el, opts) {
			opts = Object.assign({
				token: null,
				system: "@me",
				sortReverse: false,
				sort: "created",
				display: "proxy_tags",
				showPrivate: false,
				showAvatar: false,
			}, opts);

			el.innerHTML = '<em>Loading...</em>';

			Promise.all([
				window.listy.queryApi("/systems/" + opts.system, opts.token),
				window.listy.queryApi("/systems/" + opts.system + "/members", opts.token),
			])
			.catch(function(err) {
				el.innerHTML = "<em>" + err + "</em>";
			})
			.then(function(values) {
				var system = values[0];
				system.members = Array.from(values[1])
				.filter(function (m) {
					switch (opts.showPrivate) {
						case "only":
							return Object.assign({"visibility": "public"}, m.privacy || {}).visibility === "private";
						case false:
						case "no":
							return Object.assign({"visibility": "public"}, m.privacy || {}).visibility === "public";
						default: // true / "yes"
							return true;
					}
				});

				if (opts.sort !== "lmao") {
					system.members = system.members.sort(function (a, b) {
						var a_norm = a[opts.sort];
						var b_norm = b[opts.sort];

						if (opts.sort === "proxy_tags") {
							a_norm = Array.from(a_norm)[0] || null;
							a_norm = a_norm !== null ? (a_norm.prefix || '') + "text" + (a_norm.suffix || '') : null;
							b_norm = Array.from(b_norm)[0] || null;
							b_norm = b_norm !== null ? (b_norm.prefix || '') + "text" + (b_norm.suffix || '') : null;
						}

						a_norm = a_norm === null ? "" : ("" + a_norm).toUpperCase();
						b_norm = b_norm === null ? "" : ("" + b_norm).toUpperCase();

						if (a_norm > b_norm) return opts.sortReverse ? -1 : 1;
						if (a_norm < b_norm) return opts.sortReverse ? 1 : -1;
						return 0;
					});
				}

				return system;
			})
			.then(function(system) {
				el.style.borderColor = '#' + (system.color || '000000');
				el.innerHTML = "<strong>Members of " + (system.name ? system.name + " (<code>" + system.id + "</code>)" : "<code>" + system.id + "</code>") + "</strong>";

				let listElement = document.createElement("ul");
				listElement.classList.add("listy-card-list");
				system.members.forEach(function (member) {
					let memberElement = document.createElement("li");
					memberElement.innerHTML = "[<code>" + member.id + "</code>] <strong>" + member.name + "</strong>";

					let showElement = document.createElement("ul");
					showElement.classList.add("listy-showbrackets");
					showElement.classList.add("listy-inline-list")
					switch (opts.display) {
						case "created":
							let createdTs = new Date(Date.parse(member.created));
							showElement.innerHTML = "<li>created at <span class=listy-inline-code>" + window.listy.strftime("%B %e, %Y %l:%M %p", createdTs) + "</span></li>";
							break;

						case "display_name":
							if (member.display_name !== null) {
								showElement.innerHTML = "<li>" + member.display_name + "</li>"
							}
							break;

						case "pronouns":
							if (member.pronouns !== null) {
								showElement.innerHTML = "<li>" + member.pronouns + "</li>";
							}
							break;

						case "color":
							if (member.color !== null) {
								let colorContainer = document.createElement('li');
								colorContainer.classList.add('listy-details-color');
								showElement.appendChild(colorContainer);

								let colorBlock = document.createElement('div');
								colorBlock.classList.add('listy-details-color-block');
								colorBlock.style.backgroundColor = '#' + (member.color || '000');
								colorContainer.appendChild(colorBlock);

								let colorName = document.createElement('span');
								colorName.innerText = '#' + (member.color || '000');
								colorContainer.appendChild(colorName);
							}
							break;

            case "avatar_url":
              if (member.avatar_url !== null) {
                let avatarUrlEntry = document.createElement('a');
                avatarUrlEntry.href = member.avatar_url;
                avatarUrlEntry.innerText = 'avatar URL';
                let avatarUrlContainer = document.createElement('li');
                avatarUrlContainer.appendChild(avatarUrlEntry);
                showElement.appendChild(avatarUrlContainer);
              }

              if (member.webhook_avatar_url !== null) {
                let avatarUrlEntry = document.createElement('a');
                avatarUrlEntry.href = member.webhook_avatar_url;
                avatarUrlEntry.innerText = 'proxy avatar URL';
                let avatarUrlContainer = document.createElement('li');
                avatarUrlContainer.appendChild(avatarUrlEntry);
                showElement.appendChild(avatarUrlContainer);
              }
              break;

						default: // proxy_tags
							member.proxy_tags.forEach(function (tdesc) {
								let tag = document.createElement("li");
								tag.innerHTML = "<code>" + ((tdesc.prefix || "") + "text" + (tdesc.suffix || "")) + "</code>";
								showElement.appendChild(tag);
							});
							break;
					}

					memberElement.appendChild(showElement);

					if (opts.showAvatar) {
						let avatarContainer = document.createElement("details");
						avatarContainer.classList.add("listy-details-avatar");
						avatarContainer.innerHTML = "<summary>Show avatar</summary>";
						let avatarElement = document.createElement("img");
						avatarElement.setAttribute("src", member.avatar_url || "https://irys.cc/fronters/default.png");
						avatarContainer.appendChild(avatarElement);
						memberElement.appendChild(avatarContainer);
					}

					listElement.appendChild(memberElement);
				});
				el.appendChild(listElement);

				let countElement = document.createElement("span");
				countElement.innerHTML = system.members.length + " results.";
				el.appendChild(countElement);
			});
		},

		onSubmit: function onSubmit(ev) {
			ev.preventDefault();
			let formData = new FormData(ev.target);
			let formProps = Object.fromEntries(formData);

			if (formProps.localstorage === "on") {
				window.localStorage.setItem('listy-options', JSON.stringify(formProps));
			} else {
				window.localStorage.removeItem('listy-options');
			}

			// collect options
			var opts = {
				token: formProps.token,
				sort: formProps.sort,
				sortReverse: formProps.rev === "on",
				display: formProps.display,
				showPrivate: formProps.showpriv,
				showAvatar: formProps.avatar === "on",
			};

			window.listy.doList(document.getElementById("listy-list"), opts);
			return false;
		},

		/* Port of strftime() by T. H. Doan (https://thdoan.github.io/strftime/)
		 *
		 * Day of year (%j) code based on Joe Orost's answer:
		 * http://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
		 *
		 * Week number (%V) code based on Taco van den Broek's prototype:
		 * http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
		 */
		strftime: function strftime(sFormat, date) {
			if (!(date instanceof Date)) date = new Date();
			var nDay = date.getDay(),
				nDate = date.getDate(),
				nMonth = date.getMonth(),
				nYear = date.getFullYear(),
				nHour = date.getHours(),
				aDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				aDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
				isLeapYear = function() {
					return (nYear%4===0 && nYear%100!==0) || nYear%400===0;
				},
				getThursday = function() {
					var target = new Date(date);
					target.setDate(nDate - ((nDay+6)%7) + 3);
					return target;
				},
				zeroPad = function(nNum, nPad) {
					return ((Math.pow(10, nPad) + nNum) + '').slice(1);
				};

			return sFormat.replace(/%[a-z]/gi, function(sMatch) {
				return (({
					'%a': aDays[nDay].slice(0,3),
					'%A': aDays[nDay],
					'%b': aMonths[nMonth].slice(0,3),
					'%B': aMonths[nMonth],
					'%c': date.toUTCString(),
					'%C': Math.floor(nYear/100),
					'%d': zeroPad(nDate, 2),
					'%e': nDate,
					'%F': date.toISOString().slice(0,10),
					'%G': getThursday().getFullYear(),
					'%g': (getThursday().getFullYear() + '').slice(2),
					'%H': zeroPad(nHour, 2),
					'%I': zeroPad((nHour+11)%12 + 1, 2),
					'%j': zeroPad(aDayCount[nMonth] + nDate + ((nMonth>1 && isLeapYear()) ? 1 : 0), 3),
					'%k': nHour,
					'%l': (nHour+11)%12 + 1,
					'%m': zeroPad(nMonth + 1, 2),
					'%n': nMonth + 1,
					'%M': zeroPad(date.getMinutes(), 2),
					'%p': (nHour<12) ? 'AM' : 'PM',
					'%P': (nHour<12) ? 'am' : 'pm',
					'%s': Math.round(date.getTime()/1000),
					'%S': zeroPad(date.getSeconds(), 2),
					'%u': nDay || 7,
					'%V': (function() {
						var target = getThursday(), n1stThu = target.valueOf();
						target.setMonth(0, 1);
						var nJan1 = target.getDay();
						if (nJan1!==4) target.setMonth(0, 1 + ((4-nJan1)+7)%7);
						return zeroPad(1 + Math.ceil((n1stThu-target)/604800000), 2);
					})(),
					'%w': nDay,
					'%x': date.toLocaleDateString(),
					'%X': date.toLocaleTimeString(),
					'%y': (nYear + '').slice(2),
					'%Y': nYear,
					'%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
					'%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1'),
				}[sMatch] || '') + '') || sMatch;
			});
		},
	};

	window.addEventListener("load", function() {
		let optionForm = document.getElementById("options");
		optionForm.onsubmit = window.listy.onSubmit;

		var localOptions = window.localStorage.getItem('listy-options');
		if (typeof localOptions === "string") {
			localOptions = JSON.parse(localOptions);
			Object.entries(localOptions).forEach(function (x) {
				let optEl = optionForm.elements[x[0]];
				if (typeof optEl !== "undefined") {
					if (optEl.type === "checkbox") {
						optEl.checked = x[1] === "on";
					} else {
						optEl.value = x[1];
					}
				}
			});
		}
	});
})(document, window);
