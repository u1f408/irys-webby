;(function(document, window) {
	/**
	 * this is hand-written code, and we've tried to make it easy enough to
	 * understand what's going on (even though there's a decent amount of…
	 * strange goings-on in here)!
	 * 
	 * if you have any questions, DM iris!#1312 on Discord :)
	 */

	window.pkswitcher = window.pkswitcher || {};
	const app = window.pkswitcher;
	app.themes = {
		"base.css": "Default",
		"blue.css": "Dark Blue",
		"fairyfloss.css": "Fairyfloss",
	};

	const curry = function(fn, ...a) {
		return function(...b) {
			return fn.call(this, a, ...b);
		};
	};

	const html = {
		escapeEntities: function htmlEscapeEntities(text) {
			// Letting the DOM engine do the dirty work for us :)
			let el = document.createElement('span');
			el.innerText = text;
			return el.innerHTML;
		},

		tagClose: function htmlTagClose(tag) {
			return "</" + tag + ">";
		},

		tagOpen: function htmlTagOpen(tag, attributes) {
			// pull out element ID in case we need to override
			var id = attributes["id"];

			// set up auto event hooking
			var events = Object.entries(attributes["_ev"] || {});
			if (events.length > 0) {
				if (!id) id = "evobj-" + Math.random().toString(36).substring(2, 15);

				const setEvents = function() {
					let el = document.getElementById(id);
					if (!el) return setTimeout(setEvents, 100);

					for (var i = events.length - 1; i >= 0; i--) {
						if (events[i][0] == "create") {
							events[i][1](el);
						} else {
							el.addEventListener(events[i][0], events[i][1]);
						}
					}
				};

				setTimeout(setEvents, 100);
			}

			// store element ID back in case we changed it
			attributes["id"] = id;

			// get all attributes that aren't special
			let attribPairs = Object.entries(attributes).filter(function(x) {
				return !x[0].startsWith("_");
			});

			// generate the attribute string
			var attribstr = "";
			if (attribPairs.length > 0) {
				for (var i = attribPairs.length - 1; i >= 0; i--) {
					var value = attribPairs[i][1];
					if (!value) continue;

					attribstr = attribstr 
						+ " " 
						+ attribPairs[i][0] 
						+ "=\"" 
						+ html.escapeEntities(value) 
						+ "\"";
				}
			}

			return "<" + tag + attribstr + ">";
		},

		t: function htmlT(tag, attributes, ...children) {
			return html.tagOpen(tag, attributes)
				+ Array.prototype.join.call(children, '')
				+ html.tagClose(tag);
		},
	};

	const alphaWarning = html.t("div", {class: "flash flash-danger"}, ...[
		html.t("i", {class: "fa fa-warning"}),
		" This section of the site is incomplete!",
		" If you have any issues, please report them to the ",
		html.t("code", {}, "#community-resources-help"),
		" channel in the PluralKit support Discord server.",
	]);

	const prettyTimestamp = function prettyTimestamp(ts) {
	    let now = new Date();
	    var seconds = (now.getTime() - ts.getTime()) / 1000;
	    if (seconds < 60) return "less than a minute";

	    var elements = [];
	    if (seconds > 86400) {
	    	elements.push(parseInt(seconds / 86400) + "d");
	    	seconds = seconds % 86400;
	    }
	    if (seconds > 3600) {
	    	elements.push(parseInt(seconds / 3600) + "h");
	    	seconds = seconds % 3600;
	    }
	    elements.push(parseInt(seconds / 60) + "m");
	    return elements.join(" ");
	};

	app.querySelector = function querySelector(selector) {
		return document.querySelector(selector, app._rtdata.appElement);
	};

	app.querySelectorAll = function querySelectorAll(selector) {
		return document.querySelectorAll(selector, app._rtdata.appElement);
	}

	app.setLoading = function setLoading(i) {
		app.loadingCount = app.loadingCount || 0;
		app.loadingCount += i;
		if (app.loadingCount < 0) app.loadingCount = 0;

		let el = app.querySelector("#pkswitcher-loading");
		el.style.display = (app.loadingCount === 0) ? 'none' : null;
	};

	app.setMessage = function setMessage(t) {
		let el = app.querySelector("#pkswitcher-message");
		let msgEl = document.querySelector("#pkswitcher-message-inner", el);

		msgEl.innerHTML = t;
		el.style.display = null;
	};

	app.isLoggedIn = function isLoggedIn() {
		return window.localStorage.getItem('pkToken') !== null;
	};

	const defaultCatch = function defaultCatch(msg) {
		app.setMessage(msg);
		console.log(msg);
	};

	const resolveAfter = function resolveAfter(ms) {
		return new Promise(function(ok) {
			setTimeout(ok, ms);
		});
	};

	const promiseRateLimit = function promiseRateLimit(fn, msPerOp) {
		let wait = Promise.resolve();
		return function(...a) {
			const res = wait.then(function() { return fn(...a); });
			wait = wait.then(function() { return resolveAfter(msPerOp); });
			return res;
		};
	};

	app.queryApi = function queryApi(slug, options) {
		const apiBase = "https://api.pluralkit.me/v2";
		const slowFetch = promiseRateLimit(fetch, 1000);

		options = Object.assign({ headers: {}, }, options || {});
		options.headers['Accept'] = "application/json";
		options.headers['Authorization'] = window.localStorage.getItem('pkToken');

		app.setLoading(1);
		return slowFetch(apiBase + slug, options)
		.then(function(res) {
			app.setLoading(-1);

			if (!res.ok) {
				if (res.status === 429) {
					return resolveAfter(res.json()["retry_after"] + 100)
					.then(function() {
						return app.queryApi(slug, options);
					});
				}

				return Promise.reject("PluralKit API responded with a " + res.status + " for " + slug);
			}

			return res.json();
		});
	};

	app.queryPK = {
		initial: function queryInitial() {
			return Promise.all([
				app.queryPK.system(),
				app.queryPK.members(),
				app.queryPK.sortedSwitches(),
			]);
		},

		system: function querySystem() {
			if (app._rtdata.pksystem !== null) {
				return new Promise(function(ok) {
					ok(app._rtdata.pksystem);
				});
			}

			return app.queryApi('/systems/@me')
			.then(function(res) {
				app._rtdata.pksystem = res;
				return res;
			})
			.catch(defaultCatch);
		},

		members: function queryMembers() {
			if (app._rtdata.pkmembers !== null) {
				return new Promise(function(ok) {
					ok(app._rtdata.pkmembers);
				});
			}

			return app.queryApi('/systems/@me/members')
			.then(function(res) {
				app._rtdata.pkmembers = {};
				for (var i = res.length - 1; i >= 0; i--) {
					app._rtdata.pkmembers[res[i].id] = res[i];
				}

				return app._rtdata.pkmembers;
			})
			.catch(defaultCatch);
		},

		switches: function querySwitches(before) {
			if (before !== undefined) {
				before = new Date(0 + (before || 0));
				let allKnown = Object.entries(app._rtdata.pkswitches).map(function(r) { return r[1]; });
				if (allKnown.length > 0) {
					for (var i = 0; i < allKnown.length; i++) {
						if (allKnown[i].timestamp > before) {
							return new Promise(function(ok) {
								ok(app._rtdata.pkswitches);
							})
						}
					}
				}
			}

			return app.queryApi('/systems/@me/switches' + (before !== undefined ? '?before=' + before.toISOString() : ''))
			.then(function(res) {
				for (var i = res.length - 1; i >= 0; i--) {
					app._rtdata.pkswitches[res[i].id] = app.parseSwitch(res[i]);
				}

				return app._rtdata.pkswitches;
			})
			.catch(defaultCatch);
		},

		switch: function querySwitch(swid) {
			if (swid in app._rtdata.pkswitches) {
				return new Promise(function(ok) {
					ok(app._rtdata.pkswitches[swid]);
				});
			}

			return app.queryApi('/systems/@me/switches/' + swid)
			.then(function(res) {
				app._rtdata.pkswitches[res.id] = app.parseSwitch(res);
	
				return app._rtdata.pkswitches[res.id];
			})
			.catch(defaultCatch);
		},

		latestSwitchMembers: function queryLatestSwitchMembers() {
			return Promise.all([
				app.queryPK.switches(),
				app.queryPK.members(),
			])
			.then(function(res) {
				let allKnown = Object.entries(res[0]).map(function(r) { return r[1]; });
				allKnown.sort(function(a, b) { return b.unixTimestamp - a.unixTimestamp; });
				allKnown = allKnown.filter(function(x) { return !!x; });
				return Array.from(allKnown[0].members).map(function(mid) {
					return app._rtdata.pkmembers[mid];
				});
			})
			.catch(defaultCatch);
		},

		sortedSwitches: function querySortedSwitches() {
			return app.queryPK.switches()
			.then(function(res) {
				let allKnown = Object.entries(res).map(function(r) { return r[1]; });
				allKnown.sort(function(a, b) { return b.unixTimestamp - a.unixTimestamp; });
				allKnown = allKnown.filter(function(x) { return !!x; });
				return allKnown;
			})
			.catch(defaultCatch);
		},
	};

	app.parseSwitch = function ParseSwitch(sw) {
		var members = sw.members;
		if (members.length > 0 && typeof members[0] === "object") {
			members = members.map(function(m) { return m.id; });
		}

		return Object.assign(sw, {
			unixTimestamp: new Date(sw.timestamp).getTime(),
			members: members,
		});
	};

	const MemberSearcher = function MemberSearcher(cb) {
		this._cb = cb;
	};

	MemberSearcher.prototype.render = function MemberSearcherRender() {
		return html.t("div", {class: "pkswitcher-MemberSearcher", _ev: {create: this._onCreate.bind(this)}}, ...[
			html.t("input", {class: "pkswitcher-MemberSearcher-input", placeholder: "Search for a member…", _ev: {input: this._onUpdate.bind(this)}}),
			html.t("ul", {class: "pkswitcher-MemberSearcher-results"}),
		]);
	};

	MemberSearcher.prototype._onCreate = function MemberSearcherOnCreate(el) {
		this._el = el;
	};

	MemberSearcher.prototype._onUpdate = function MemberSearcherOnUpdate(ev) {
		ev.preventDefault();

		if (ev.target.value.length < 1) {
			this.updateList([]);
			return false;
		}

		let query = new RegExp(ev.target.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
		let members = Object.entries(app._rtdata.pkmembers).map(function(r) { return r[1]; });

		var results = [];
		for (var i = 0; i < members.length; i++) {
			if (query.exec([members[i].id, members[i].name, members[i].display_name].join(" "))) {
				results.unshift(members[i]);
			}
		}

		this.updateList(results);

		return false;
	};

	MemberSearcher.prototype._onSelect = function MemberSearcherOnSelect(data, ev) {
		ev.preventDefault();
		this._cb(data[0]);
		return false;
	};

	MemberSearcher.prototype.updateList = function MemberSearcherUpdateList(members) {
		let listEl = document.querySelector('.pkswitcher-MemberSearcher-results', this._el);
		listEl.innerHTML = members.map((function(member) {
			return html.t("li", {_ev: {click: curry(this._onSelect, member.id).bind(this)}}, ...[
				html.t("div", {class: 'pkswitcher-MemberSearcher-results-member', 'data-member-id': member.id}, ...[
					html.t("img", {src: member.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png", style: "border-color:#" + (member.color || "000")}),
					html.t("strong", {}, member.name),
				]),
			]);
		}).bind(this)).join('');
	};

	const MemberTimeHeatmap = function MemberTimeHeatmap(memberid) {
		let member = app._rtdata.pkmembers[memberid];
		let switches = Object.entries(app._rtdata.pkswitches)
			.map(function(x) { return x[1]; })
			.filter(function(sw) {
				return !!sw && sw.members.includes(memberid);
			});
		switches.sort(function(a, b) { return b.unixTimestamp - a.unixTimestamp; });

		let timeCount = {};
		for (var i = switches.length - 1; i >= 0; i--) {
			let start = new Date(switches[i].unixTimestamp);
			let end = new Date(i == 0 ? (new Date()).getTime() : switches[i - 1].unixTimestamp);
			let diffHours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;

			let endHour = start.getHours() + diffHours;
			for (var hr = start.getHours(); hr <= endHour; hr++) {
				timeCount[hr % 24] = timeCount[hr % 24] || 0;
				timeCount[hr % 24] += 1;
			}
		}

		var timeCountAverage = Object.entries(timeCount)
			.map(function(x) { return x[1]; })
			.reduce(function(a, b) { return a + b; }, 0);
		timeCountAverage /= 24;

		return html.t("ul", {}, ...Object.entries(timeCount).map(function(x) {
			var t = ((x[1] / timeCountAverage) - 1).toFixed(3);
			let hr = (x[0] < 10 ? "0" : "") + x[0];
			return html.t("li", {}, ...[
				html.t("span", {}, hr + ":00 - " + hr + ":59"),
				" - ",
				html.t("code", {}, t),
			]);
		}));
	};

	app.components = {};

	const Component = function Component(name, ...merge) {
		this._name = name;
		this._mainel = null;

		/* the below allows for component inheritance, kinda!? */

		this._unboundFuncs = Array.from(merge).map((function(m) {
			if (typeof m === "function")
				return m.bind(this)();
			if (typeof m === "object" && "_unboundFuncs" in m)
				return Object.assign({}, ...m._unboundFuncs);
			return m;
		}).bind(this));

		Object.assign(this, Object.fromEntries([].concat(...this._unboundFuncs.map((function(m) {
			return Object.entries(m).map((function(x) {
				return [
					x[0],
					((typeof x[1] === "function") ? x[1].bind(this) : x[1]),
				];
			}).bind(this));
		}).bind(this)))));
	};

	Component.prototype.attach = function ComponentAttach(mainEl) {
		this._mainel = mainEl;

		let match = /^\#\!([^\/]+)(?:\/(.*))?$/.exec(window.location.hash);
		this._hash = match[2];
	};

	Component.prototype.detach = function ComponentDetach() {
		this._mainel = undefined;
	}

	Component.prototype.hashChange = function ComponentOnHashChange() {
		let match = /^\#\!([^\/]+)(?:\/(.*))?$/.exec(window.location.hash);
		if (this._hash == match[2]) return;
		this._hash = match[2];

		if (this._mainel) {
			if ("onHashChange" in this) {
				this.onHashChange();
			}
		}
	};

	Component.prototype.render = function ComponentRender() {
		if (!this._mainel) return;
		if ("beforeRender" in this) {
			if (this.beforeRender() === false) {
				return;
			}
		}

		this.onRender();
	};

	Component.prototype.innerHTML = function ComponentInnerHTML(...e) {
		if (this._mainel) {
			this._mainel.innerHTML = e.flat().join('');
		}
	};

	app.components.home = new Component("home", function() {
		return {
			beforeRender: function componentHomeBeforeRender() {
				if (!app.isLoggedIn()) {
					window.location.hash = "#!options";
					return false;
				}
			},

			onRender: function componentHomeRender() {
				this.innerHTML(html.t("h1", {}, "PKswitcher"));

				Promise.all([
					app.queryPK.system(),
					app.queryPK.members(),
					app.queryPK.latestSwitchMembers(),
				])
				.then((function(res) {
					var switchMembers = res[2].map(function (member, i, a) {
						return (a.length > 1 && a.length - 1 == i ? "and " : "")
							+ html.t("a", {href: "#!memberHistory/" + member.id}, ...[
								html.t("strong", {}, member.name),
							]);
					}).join(", ");

					this.innerHTML(...[
						html.t("h1", {}, "PKswitcher"),
						html.t("p", {}, ...[
							"Hello, ",
							html.t("strong", {}, app._rtdata.pksystem.name),
							"!",
						]),
						html.t("p", {}, ...(res[2].length > 0 ? [
							switchMembers,
							" ",
							(res[2].length >= 2 ? "are" : "is"),
							" currently fronting."
						] : [
							"No one is currently fronting."
						])),
					]);
				}).bind(this))
				.catch(defaultCatch);
			},
		};
	});

	app.components.history = new Component("history", function() {
		return {
			onHashChange: function componentHistoryOnHashChange() {
				let match = /^(out|[a-z]{5,})$/.exec(this._hash);
				this.member = undefined;
				if (match) {
					if (match[1] == "out") {
						this.member = null;
					} else {
						this.member = app._rtdata.pkmembers[match[1]];
					}
				}

				if (arguments.length == 0 || arguments[1] == true)
					this.render();
			},

			beforeRender: function componentHistoryBeforeRender() {
				if (!app.isLoggedIn()) {
					window.location.hash = "#!options";
					return false;
				}

				this.onHashChange(false);
			},

			onRender: function componentHistoryRender() {
				let searcher = new MemberSearcher(this.setFilter);
				var filterForm = html.t("details", {class: "pkswitcher-expand pkswitcher-history-filter"}, ...[
					html.t("summary", {}, ...[
						"Filter by member",
						(this.member !== undefined ? ": " + html.t("strong", {}, this.member ? this.member.name : "[switch out]") : ""),
					]),
					html.t("div", {class: 'inner'}, ...(this.member === undefined ? [
						html.t("div", {class: 'form'}, searcher.render()),
						html.t("button", {class: 'button', _ev: {click: this.setFilterSwitchOut}}, ...[
							html.t("i", {class: 'fa fa-circle-o'}),
							" Filter by switch out"
						]),
					] : [,
						html.t("button", {class: 'button', _ev: {click: this.clearFilter}}, ...[
							html.t("i", {class: 'fa fa-eye-slash'}),
							" Clear filter",
						]),
					])),
				]);

				var switches = Object.entries(app._rtdata.pkswitches).map(function(r) { return r[1]; });
				switches.sort(function(a, b) { return b.unixTimestamp - a.unixTimestamp; });
				if (this.member !== undefined) {
					switches = switches.filter((function(sw) {
						if (this.member !== null)
							return sw.members.includes(this.member.id);

						return sw.members.length === 0;
					}).bind(this));
				}

				var switchData = switches.map(function(sw) {
					let time = new Date(sw.unixTimestamp);
					var switchMembers = sw.members.map(function (memberid, i, a) {
						if (memberid in app._rtdata.pkmembers) {
							let member = app._rtdata.pkmembers[memberid];
							return (a.length > 1 && a.length - 1 == i ? "and " : "")
								+ html.t("a", {href: "#!memberHistory/" + member.id}, ...[
									html.t("strong", {}, member.name),
								]);
						}

						return (a.length > 1 && a.length - 1 == i ? "and " : "") + "[deleted member]";
					}).join(", ");
					if (sw.members.length < 1) switchMembers = "[switch out]";

					return html.t("li", {}, ...[
						html.t("a", {class: "button button-small", href: "#!switchEdit/" + sw.id}, ...[
							html.t("i", {class: "fa fa-pencil"}),
						]),
						" ",
						html.t("time", {datetime: time.toISOString()}, ...[
						  prettyTimestamp(time) + " ago",
						  (window.localStorage.getItem('switch-showts') === 'true' ? html.t("span", {}, ' (' + time.toLocaleString() + ')') : ''),
						]),
						" &middot; ",
						switchMembers,
					]);
				});

				if (this.member !== undefined && switches.length === 0) {
					switchData = html.t("div", {class: 'flash flash-warning'}, ...[
						"I currently know about ",
						("" + Object.entries(app._rtdata.pkswitches).length),
						" switches, but none of those include the member ",
						html.t("strong", {}, this.member.name),
						" :(",
					]);
				}

				this.innerHTML(...[
					html.t("div", {class: "flash flash-danger"}, ...[
						html.t("i", {class: "fa fa-warning"}),
						" This section of the site is not yet complete -",
						" notably, you can't move switches yet.",
						" If you have any issues, please report them to the ",
						html.t("code", {}, "#community-resources-help"),
						" channel in the PluralKit support Discord server.",
					]),

					html.t("h1", {}, "Switch history"),
					filterForm,
					html.t("ul", {class: "pkswitcher-history-switches"}, ...switchData),
					html.t("button", {class: "button button-primary", _ev: {click: this.loadMore}}, ...[
						html.t("i", {class: "fa fa-history"}),
						" Load more",
					]),
				]);
			},

			loadMore: function componentHistoryLoadMore() {
				app.queryPK.sortedSwitches()
				.then((function(res) {
					let lastSwitch = res[res.length - 1];
					return app.queryPK.switches(lastSwitch.unixTimestamp);
				}).bind(this))
				.then((function(res) {
					this.render();
				}).bind(this))
				.catch(defaultCatch);
			},

			setFilter: function componentHistorySetFilter(memberid) {
				window.location.hash = "#!" + this._name + "/" + memberid;
				this.render();
			},

			setFilterSwitchOut: function componentHistorySetFilterSwitchOut(ev) {
				ev.preventDefault();
				window.location.hash = "#!" + this._name + "/out";
				this.render();
				return false;
			},

			clearFilter: function componentHistoryClearFilter(ev) {
				ev.preventDefault();
				window.location.hash = "#!" + this._name;
				this.render();
				return false;
			},
		};
	});

	app.components.memberHistory = new Component("memberHistory", function() {
		return {
			beforeRender: function componentMemberHistoryBeforeRender() {
				if (!app.isLoggedIn()) {
					window.location.hash = "#!options";
					return false;
				}

				let match = /^([a-z]{5,})$/.exec(this._hash)
				if (!match) return false;
				this.member = app._rtdata.pkmembers[match[1]];
				if (!this.member) return false;
			},

			onRender: function componentMemberHistoryRender() {
				this.innerHTML(...[
					alphaWarning,
					html.t("h1", {}, ...[
						"History for ",
						this.member.name,
						" (",
						html.t("code", {}, this.member.id),
						")",
					]),

					MemberTimeHeatmap(this.member.id),
				]);
			},
		};
	});

	app.components.switchBase = new Component("switchBase", {
		switchClear: function componentSwitchClear(ev) {
			ev.preventDefault();

			this.switchMembers = [];
			this.hasChanged = true;
			this.updateList();

			return false;
		},

		switchMemberAdd: function componentSwitchMemberAdd(memberid) {
			this.switchMembers.push(memberid);
			this.hasChanged = true;
			this.updateList();
		},

		switchMoveMemberUp: function componentSwitchMoveMemberUp(data, ev) {
			let index = this.switchMembers.indexOf(data[0]);
			this.switchMembers.splice(index, 1);
			this.switchMembers.splice(index > 1 ? index - 1 : 0, 0, data[0]);
			this.hasChanged = true;
			this.updateList();

			return false;
		},

		switchMoveMemberDown: function componentSwitchMoveMemberDown(data, ev) {
			let index = this.switchMembers.indexOf(data[0]);
			this.switchMembers.splice(index, 1);
			this.switchMembers.splice(index <= this.switchMembers.length ? index + 1 : this.switchMembers.length - 1, 0, data[0]);
			this.hasChanged = true;
			this.updateList();

			return false;
		},

		switchRemoveMember: function componentSwitchRemoveMember(data, ev) {
			let index = this.switchMembers.indexOf(data[0]);
			this.switchMembers.splice(index, 1);
			this.hasChanged = true;
			this.updateList();

			return false;
		},

		renderMember: function componentSwitchRenderMember(member) {
			if (!member) return;
			return html.t("div", {class: "pkswitcher-switch-member", "data-member-id": member.id}, ...[
				html.t("div", {class: "pkswitcher-switch-member-actions"}, ...[
					html.t("button", {class: "button button-small pkswitcher-action", _ev: {click: curry(this.switchMoveMemberUp, member.id).bind(this)}}, ...[
						html.t("i", {class: "fa fa-chevron-up fa-fw"})
					]),
					html.t("button", {class: "button button-small button-danger pkswitcher-action", _ev: {click: curry(this.switchRemoveMember, member.id).bind(this)}}, ...[
						html.t("i", {class: "fa fa-times fa-fw"})
					]),
					html.t("button", {class: "button button-small pkswitcher-action", _ev: {click: curry(this.switchMoveMemberDown, member.id).bind(this)}}, ...[
						html.t("i", {class: "fa fa-chevron-down fa-fw"})
					]),
				]),
				html.t("img", {src: member.avatar_url || "default.png", style: "border-color:#" + (member.color || "000")}),
				html.t("strong", {}, member.name),
			]);
		},
	});

	app.components.switch = new Component("switch", app.components.switchBase, {
		beforeRender: function componentSwitchBeforeRender() {
			if (!app.isLoggedIn()) {
				window.location.hash = "#!options";
				return false;
			}
		},

		render: function componentSwitchRender() {
			this.innerHTML(html.t("h1", {}, "Log a switch"));

			app.queryPK.latestSwitchMembers()
			.then((function(res) {
				this.switchMembers = Array.from(res).map(function(m) { return m.id; });
				this.hasChanged = false;
				this.updateList();
			}).bind(this))
			.catch(defaultCatch);
		},

		updateList: function componentSwitchUpdateList() {
			var allMembers = Object.entries(app._rtdata.pkmembers).map(function(x) { return x[1]; });
			allMembers.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});

			this.switchMembers = Array.from(new Set(this.switchMembers));
			var switchMembers = [];
			for (var i = this.switchMembers.length - 1; i >= 0; i--) {
				switchMembers.unshift(app._rtdata.pkmembers[this.switchMembers[i]]);
			}

			let searcher = new MemberSearcher(this.switchMemberAdd);

			this.innerHTML(...[
				html.t("h1", {}, "Log a switch"),
				html.t("div", {class: 'pkswitcher-switch-members'}, ...[
					...Array.from(switchMembers).map(this.renderMember),
					(switchMembers.length == 0 ? html.t("span", {}, "No members added to switch.") : ""),
				]),
				html.t("div", {id: 'pkswitcher-switch-memberadd', class: 'form'}, searcher.render()),
				html.t("div", {class: 'pkswitcher-switch-buttons'}, ...[
					html.t("button", {id: "pkswitcher-switch-clear", class: "button button-danger pkswitcher-action", _ev: {click: this.switchClear}}, ...[
						html.t("i", {class: "fa fa-trash-o"}),
						" Clear all members",
					]),
					html.t("button", {id: "pkswitcher-switch-addcurrent", class: "button pkswitcher-action", _ev: {click: this.switchAddCurrent}}, ...[
						html.t("i", {class: "fa fa-plus-square"}),
						" Add current fronters",
					]),
				]),
				html.t("div", {class: "pkswitcher-switch-buttons"}, ...[
					html.t("button", {id: "pkswitcher-switch-log", class: "button button-primary pkswitcher-action", _ev: {click: this.logSwitch}}, ...[
						html.t("i", {class: "fa fa-upload"}),
						" Log switch",
					]),
				]),
			]);
		},

		switchAddCurrent: function componentSwitchAddCurrent(ev) {
			ev.preventDefault();

			app.queryPK.latestSwitchMembers()
			.then((function(res) {
				this.switchMembers = this.switchMembers.concat(Array.from(res).map(function(m) { return m.id; }));
				this.hasChanged = true;
				this.updateList();
			}).bind(this))
			.catch(defaultCatch);

			return false;
		},

		logSwitch: function componentSwitchLogSwitch(ev) {
			ev.preventDefault();

			if (!this.hasChanged) {
				app.setMessage("You haven't changed anything, so I can't log a switch!");
				return false;
			}

			app.queryApi("/systems/@me/switches", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					members: this.switchMembers,
				}),
			})
			.then((function(res) {
				app._rtdata.pkswitches[res.id] = app.parseSwitch(res);

				let successEl = document.createElement('span');
				successEl.classList.add('badge');
				successEl.innerHTML = [
					html.t("i", {class: 'fa fa-check'}),
					" Success!",
				].join('');
				ev.target.appendChild(successEl);

				this.hasChanged = false;
				setTimeout(function() { ev.target.removeChild(successEl); }, 5000);
			}).bind(this))
			.catch(defaultCatch);

			return false;
		},
	});

	app.components.switchEdit = new Component("switchEdit", app.components.switchBase, {
		onHashChange: function componentSwitchEditOnHashChange() {
			let match = /^([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/.exec(this._hash);
			if (!match) return false;

			this.switchId = match[1];
			app.queryPK.switch(this.switchId)
			.then((function(res) {
				this.switchObject = res;
				this.switchMembers = Array.from(res.members);
				this.hasChanged = false;
				this.updateList();
			}).bind(this))
			.catch(defaultCatch);
		},

		beforeRender: function componentSwitchEditBeforeRender() {
			if (!app.isLoggedIn()) {
				window.location.hash = "#!options";
				return false;
			}
		},

		render: function componentSwitchEditRender() {
			this.onHashChange();
		},

		updateList: function componentSwitchEditUpdateList() {
			let time = new Date(this.switchObject.unixTimestamp);

			var allMembers = Object.entries(app._rtdata.pkmembers).map(function(x) { return x[1]; });
			allMembers.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});

			this.switchMembers = Array.from(new Set(this.switchMembers));
			var switchMembers = [];
			for (var i = this.switchMembers.length - 1; i >= 0; i--) {
				switchMembers.unshift(app._rtdata.pkmembers[this.switchMembers[i]]);
			}

			let searcher = new MemberSearcher(this.switchMemberAdd);

			this.innerHTML(...[
				alphaWarning,
				html.t("h1", {}, ...[
					"Editing switch (",
					prettyTimestamp(time) + " ago, ",
					html.t("code", {}, this.switchObject.id),
					")",
				]),
				html.t("div", {class: 'pkswitcher-switch-members'}, ...[
					...Array.from(switchMembers).map(this.renderMember),
					(switchMembers.length == 0 ? html.t("span", {}, "No members added to switch.") : ""),
				]),
				html.t("div", {id: 'pkswitcher-switch-memberadd', class: 'form'}, searcher.render()),
				html.t("div", {class: 'pkswitcher-switch-buttons'}, ...[
					html.t("button", {id: "pkswitcher-switch-clear", class: "button button-danger pkswitcher-action", _ev: {click: this.switchClear}}, ...[
						html.t("i", {class: "fa fa-trash-o"}),
						" Clear all members",
					]),
				]),
				html.t("div", {class: "pkswitcher-switch-buttons"}, ...[
					html.t("button", {id: "pkswitcher-switch-edit", class: "button button-primary pkswitcher-action", _ev: {click: this.logSwitchEdit}}, ...[
						html.t("i", {class: "fa fa-pencil"}),
						" Edit switch",
					]),
				]),
			]);
		},

		logSwitchEdit: function componentSwitchEditLogSwitchEdit(ev) {
			ev.preventDefault();

			if (!this.hasChanged) {
				app.setMessage("You haven't changed anything, so I can't log a switch!");
				return false;
			}

			app.queryApi("/systems/@me/switches/" + this.switchId + "/members", {
				method: "PATCH",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(this.switchMembers),
			})
			.then((function(res) {
				app._rtdata.pkswitches[res.id] = app.parseSwitch(res);

				let successEl = document.createElement('span');
				successEl.classList.add('badge');
				successEl.innerHTML = [
					html.t("i", {class: 'fa fa-check'}),
					" Success!",
				].join('');
				ev.target.appendChild(successEl);

				this.hasChanged = false;
				setTimeout(function() { ev.target.removeChild(successEl); }, 5000);
			}).bind(this))
			.catch(defaultCatch);

			return false;
		},
	});

	app.components.options = new Component("options", {
		render: function componentOptionsRender() {
			this.innerHTML(...[
				html.t("section", {id: "pkswitcher-options-pkauth"}),
				html.t("section", {}, ...[
					html.t("h1", {id: "!options/theme"}, "Theme"),
					html.t("form", {id: "pkswitcher-options-theme", class: 'form', _ev: {submit: this.setTheme}}, ...[
						html.t("select", {name: "theme"}, ...Object.entries(app.themes).map(function(theme) {
							let selected = theme[0] == window.localStorage.getItem('theme');
							return html.t("option", {value: theme[0], selected: selected}, theme[1]);
						})),
						html.t("button", {type: "submit", class: 'button'}, ...[
							html.t("i", {class: 'fa fa-check'}),
							" Apply",
						]),
					]),
				]),
				html.t("section", {}, ...[
				  html.t("h1", {}, "Miscellaneous options"),
				  html.t("form", {id: "pkswitcher-options-misc", class: 'form', _ev: {submit: this.setMisc}}, ...[
				    html.t("label", {for: "pkswitcher-options-misc-showts"}, ...[
				      html.t("input", {type: "checkbox", id: "pkswitcher-options-misc-showts", name: "showts", checked: (window.localStorage.getItem('switch-showts') === 'true')}),
				      "Show full timestamps in switch history?",
		        ]),
		        html.t("button", {type: "submit", class: 'button'}, ...[
							html.t("i", {class: 'fa fa-check'}),
							" Save",
						]),
				  ]),
				]),
			]);

			// Populate auth element
			let authEl = app.querySelector("#pkswitcher-options-pkauth");
			(app.isLoggedIn() ? this.renderAuthed : this.renderUnauthed)(authEl);
		},

		renderUnauthed: function componentOptionsRenderUnauthed(authEl) {
			authEl.innerHTML = [
				html.t("h1", {id: "!options/pluralkit"}, "PluralKit authentication"),
				html.t("p", {}, ...[
					"To log in, copy-and-paste your PluralKit token (from ",
					html.t("code", {}, "pk;token"),
					") into the field below.",
				]),
				html.t("form", {id: "pkswitcher-auth-login", class: 'form', _ev: {submit: this.doLogin}}, ...[
					html.t("label", {for: "pkswitcher-auth-login-token"}, "Token"),
					html.t("input", {id: "pkswitcher-auth-login-token", name: "token", type: "text", placeholder: "PluralKit token"}),
					html.t("button", {type: "submit", class: 'button'}, ...[
						html.t("i", {class: 'fa fa-sign-in'}),
						" Log in",
					]),
				]),
			].join('');
		},

		renderAuthed: function componentOptionsRenderAuthed(authEl) {
			authEl.innerHTML = [
				html.t("h1", {id: "!options/pluralkit"}, "PluralKit authentication"),
				html.t("p", {}, "To log out, click the button below."),
				html.t("button", {id: "pkswitcher-auth-logout", class: 'button', _ev: {click: this.doLogout}}, ...[
					html.t("i", {class: "fa fa-sign-out"}),
					" Log out",
				]),
			].join('');
		},

		setTheme: function componentOptionsSetTheme(ev) {
			ev.preventDefault();

			let theme = ev.target.elements["theme"].value;
			window.localStorage.setItem("theme", theme);
			app.onThemeChange(theme);

			return false;
		},
		
    setMisc: function componentOptionsSetMisc(ev) {
			ev.preventDefault();
			window.localStorage.setItem("switch-showts", ev.target.elements["showts"].checked ? 'true' : '');

			return false;
		},

		doLogin: function componentOptionsDoLogin(ev) {
			ev.preventDefault();

			let token = ev.target.elements["token"].value;
			window.localStorage.setItem("pkToken", token);
			app.resetSession();

			app.queryPK.system()
			.then((function(res) {
				if (!res.id) {
					return Promise.reject("system has no ID");
				}

				app.populateNav();
				window.location.hash = "#!home";
			}).bind(this))
			.catch(function(msg) {
				app.setMessage("The provided PluralKit token was not valid!");
			});

			return false;
		},

		doLogout: function componentOptionsDoLogout(ev) {
			ev.preventDefault();

			window.localStorage.removeItem("pkToken");
			app.resetSession();

			app.populateNav();
			window.location.hash = "#!home";

			return false;
		},
	});

	app.components.debug = new Component("debug", {
		beforeRender: function componentSwitchBeforeRender() {
			if (!app.isLoggedIn()) {
				window.location.hash = "#!options";
				return false;
			}
		},

		render: function componentDebugRender() {
			this.debugMessage = this.debugMessage || "";
			this.innerHTML(...[
				html.t("h1", {}, "PKswitcher debug panel"),
				html.t("form", {class: 'form', _ev: {submit: function(ev){ev.preventDefault();return false}}}, ...[
					html.t("textarea", {id: "pkswitcher-debug-res"}, this.debugMessage),
					html.t("button", {class: 'button', _ev: {click: this.debugLoadAll}}, "Load all data"),
					html.t("button", {class: 'button', _ev: {click: this.debugLatestSwitch}}, "Latest switch info"),
				]),
			]);
		},

		appendMessage: function componentDebugAppendMessage(msg) {
			this.debugMessage = this.debugMessage + msg;
			return this.render();
		},

		debugLoadAll: function componentDebugLoadAll(ev) {
			ev.preventDefault();

			Promise.all([
				app.queryPK.system(),
				app.queryPK.members(),
				app.queryPK.sortedSwitches(),
			])
			.then((function(val) {
				this.appendMessage("\n\n==> Queried PluralKit API for all system information.");
			}).bind(this))
			.catch(defaultCatch)

			return false;
		},

		debugLatestSwitch: function componentDebugLatestSwitch(ev) {
			ev.preventDefault();

			app.queryPK.sortedSwitches()
			.then((function(sws) {
				var s = sws[0];
				s.members = s.members.map(function(m) {
					return [m, app._rtdata.pkmembers[m]];
				})

				this.appendMessage("\n\n==> Latest switch info\n\n" + JSON.stringify(s));
			}).bind(this))
			.catch(defaultCatch);

			return false;
		},
	});

	app.onHashChange = function onHashChange() {
		let match = /^\#\!([^\/]+)/.exec(window.location.hash);
		if (match !== null) {
			let component = app.components[match[1]];
			if (!component) return;
			if (app._rtdata.component == component) {
				component.hashChange();
			} else {
				let mainEl = app.querySelector("#pkswitcher-main");
				mainEl.setAttribute('data-component', match[1]);
				mainEl.innerHTML = '';

				// detach old component
				if (app._rtdata.component) {
					app._rtdata.component.detach();
				}
			
				// attach new component
				app._rtdata.component = component;
				component.attach(mainEl);
				component.render();
			}
		}
	};

	app.populateNav = function populateNav() {
		let el = app.querySelector("#pkswitcher-nav");
		el.innerHTML = [
			html.t("a", {href: "#!home"}, ...[
				html.t("strong", {}, "PKswitcher"),
				html.t("span", {class: "badge badge-danger"}, "alpha"),
			]),

			(app.isLoggedIn() ? [
				html.t("a", {href: "#!history"}, html.t("i", {class: "fa fa-history"})),
				html.t("a", {href: "#!switch"}, html.t("i", {class: "fa fa-user-plus"})),
			] : []).join(''),

			html.t("a", {href: "#!options"}, html.t("i", {class: "fa fa-gears"})),
		].join('');
	};

	app.onThemeChange = function onThemeChange(theme) {
		var themeEl = document.querySelector("#pkswitcher-themecss");
		if (!themeEl) {
			themeEl = document.createElement("link");
			themeEl.id = "pkswitcher-themecss";
			themeEl.setAttribute('rel', "stylesheet");
			document.querySelector("head").appendChild(themeEl);
		}

		themeEl.href = "themes/" + theme;
	};

	app.resetSession = function resetSession() {
		console.log("resetting app._rtdata");
		Object.assign(app._rtdata, {
			pksystem: null,
			pkmembers: null,
			pkswitches: {},
		});
	};

	app.initApp = function initApp(element) {
		app._rtdata = { appElement: element };
		app.resetSession();

		element.innerHTML = [
			html.t("div", {id: "pkswitcher-loading"}, ...[
				html.t("i", {class: "fa fa-spinner fa-pulse"}),
				html.t("span", {}, "Loading…"),
			]),

			html.t("nav", {id: "pkswitcher-nav"}),
			html.t("main", {id: "pkswitcher-main"}),

			html.t("div", {id: "pkswitcher-message", style: 'display:none'}, ...[
				html.t("span", {id: "pkswitcher-message-inner"}),
				html.t("button", {id: "pkswitcher-message-close", class: "button button-small button-danger"}, ...[
					"Close ",
					html.t("i", {class: "fa fa-times"}),
				]),
			]),
		].join('');

		app.querySelector("#pkswitcher-message-close").addEventListener('click', function(ev) {
			ev.preventDefault();
			ev.target.parentElement.style.display = 'none';
			return false;
		});

		app.populateNav();
		app.onThemeChange(window.localStorage.getItem("theme") || "base.css");

		window.addEventListener("hashchange", app.onHashChange, false);
		window.location.hash = window.location.hash || "#!home";

		var promise = new Promise(function(ok) { ok(); });
		if (app.isLoggedIn()) {
			promise = app.queryPK.initial();
		}
		promise.then(function() {
			app.setLoading(-999);
			app.onHashChange();
		})
		.catch(defaultCatch);
	};

	let appSelector = document.currentScript.getAttribute('data-appselector');
	if (appSelector !== null) {
		app.initApp(document.querySelector(appSelector));
	}

})(document, window);
