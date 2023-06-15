(function(DR, document) {
	"use strict";

	function prepareButtonMenu(target) {
		var menu = document.createElement("div"),
			router = document.createElement("input");

		menu.className = "rl-menu";

		router.type = "hidden";
		router.className = "rl-formfinder";
		menu.appendChild(router);
		router = null;

		target.insertBefore(menu, target.firstElementChild);
		target = null;

		menu = null;
	}

	function prepareModal() {
		var section,
			tag,
			modal = document.createElement("div");

		modal.className = "rl-modal";

		// TITLEBAR
		section = document.createElement("div");
		section.className = "title";
		modal.appendChild(section);

		tag = document.createElement("span");
		tag.className = "flair flair-usami flair-Usami";
		section.appendChild(tag);

		tag = document.createElement("span");
		tag.className = "self flair";
		section.appendChild(tag);

		tag = document.createElement("span");
		tag.className = "micro";
		tag.textContent = "DANGANREDDIT CLASS TRIAL HELPER";
		section.appendChild(tag);

		tag = document.createElement("span");
		tag.className = "mini";
		tag.textContent = "";
		section.appendChild(tag);

		
		tag = document.createElement("span");
		tag.className = "self character";
		section.appendChild(tag);
		
		tag = document.createElement("span");
		tag.className = "self username";
		section.appendChild(tag);

		tag = document.createElement("span");
		tag.className = "labeling";
		tag.textContent = "Toggle Fanmade Sprites OFF";
		section.appendChild(tag);

		tag = document.createElement("label");
		tag.textContent = "Toggle Original";
		tag.className = "toggle-label";
		
		let toggleCheckbox = document.createElement("input");
		toggleCheckbox.type = "checkbox";
		toggleCheckbox.className = "toggle-checkbox";
		
		tag.appendChild(toggleCheckbox); // Append input element to the label

		let toggleSlider = document.createElement("div");
		toggleSlider.className = "slider round";

		tag.appendChild(toggleSlider);
		
		section.appendChild(tag);

		/* const toggleCheckbox = document.createElement("input");
		toggleCheckbox.type = "checkbox";
		toggleCheckbox.className = "toggle-checkbox";
		toggleLabel.insertBefore(toggleCheckbox, toggleLabel.firstChild);

		const toggleSlider = document.createElement("div");
		toggleSlider.className = "slider round";
		toggleLabel.insertBefore(toggleSlider, toggleLabel.children[2]);*/

		// BODY
		section = document.createElement("div");
		section.className = "body";
		section.addEventListener(
			"click",
			function(evt) {
				if (modal.classList.contains("rl-spritemenu"))
					DR.triggerEvent("insertsprite", evt);
				else if (modal.classList.contains("rl-mentionmenu"))
					DR.triggerEvent("insertmention", evt);
				else if (modal.classList.contains("rl-bulletmenu"))
					DR.triggerEvent("insertbullet", evt);
			},
			true
		);
		modal.appendChild(section);

		// MENUBAR
		section = document.createElement("div");
		section.className = "menu";
		modal.appendChild(section);

		tag = document.createElement("span");
		tag.className = "button close";
		tag.textContent = "Close";
		tag.addEventListener("click", DR.hideHandbook, true);
		section.appendChild(tag);

		tag = document.createElement("span");
		tag.className = "button expand";
		tag.textContent = "Expand";
		tag.addEventListener(
			"click",
			function() {
				this.textContent = modal.classList.toggle("expanded")
					? "Contract"
					: "Expand";
			},
			true
		);
		section.appendChild(tag);

		document.querySelector("body").appendChild(modal);

		section = null;
		tag = null;
	}

	Object.defineProperties(DR, {
		currentUser: {
			get: function() {
				return document.querySelector("#header .user a").textContent;
			}
		},
		currentId: {
			get: function() {
				return this.roleList.get(this.currentUser);
			}
		},
		currentFlair: {
			get: function() {
				try {
					if (this.roleList && this.isParticipant)
						return this.FLAIRS[this.currentId].replace("flair-", "");
					else
						return document
							.querySelector(".side span.flair")
							.className.replace("flair flair-", "");
				} catch (e) {
					return undefined;
				}
			}
		},
		currentCharacter: {
			get: function() {
				return this.NAMES[this.currentId];
			}
		},
		isParticipant: {
			get: function() {
				try {
					return this.roleList.exists(this.currentUser);
				} catch (e) {
					console.log(e.stack);
					console.log(e.message);
				}
			}
		},
		fetch: {
			value: function(method, url) {
				if ("fetch" in window) {
					return window.fetch(url).then(function(res) {
						return res.json();
					});
				} else {
					return new Promise(function(resolve, reject) {
						var req = new XMLHttpRequest();
						req.open(method, url, true);

						req.responseType = "json";

						req.onload = function() {
							try {
								resolve(JSON.parse(this.response));
							} catch (e) {
								resolve(this.response);
							}
						};
						req.onerror = reject;
						req.send();
					});
				}
			}
		},
		events: {
			value: {},
			writable: false
		},
		addListener: {
			value: function(event, func) {
				event = event.toLowerCase();

				if (!(event in this.events)) this.events[event] = [];

				this.events[event].push(func);
			},
			writable: false
		},
		removeListener: {
			value: function(event, func) {
				event = event.toLowerCase();

				if (event in this.events)
					this.events[event].splice(this.events[event].indexOf(func), 1);
			},
			writable: false
		},
		triggerEvent: {
			value: function(event, detail) {
				event = event.toLowerCase();

				// console.log('Event triggered:', event);

				if (event in this.events) {
					var n = this.events[event].length;

					while (n--) this.events[event][n](detail);
				}
			},
			writable: false
		},
		handbook: {
			value: function(texttitle) {
				var modal = document.querySelector(".rl-modal"),
					inter;

				modal.className = "rl-modal";
				modal.querySelector(".title .mini").textContent = texttitle || "";

				modal.querySelector(".self.username").textContent =
					"u/" + document.querySelector("#header .user a").textContent;

				if (this.isParticipant) {
					modal
						.querySelector(".self.flair")
						.classList.add("flair-" + this.currentFlair);
					modal.querySelector(
						".self.character"
					).textContent = this.currentCharacter;
				} else {
					modal.querySelector(".self.character").textContent = "Spectator";
				}

				inter = modal.querySelector(".body");
				while (inter.firstChild) inter.removeChild(inter.firstChild);

				return modal;
			},
			writable: false
		},
		hideHandbook: {
			value: function() {
				document.querySelector(".rl-modal").classList.remove("expanded");
				document.querySelector(".rl-modal").classList.remove("visible");
				//document.querySelector(".toggle-label").classList.remove("rlvisible");
				const toggleLabel = document.querySelector(".toggle-label");
				toggleLabel.classList.remove("rlvisible");
				const labeling = document.querySelector(".labeling");
				labeling.classList.remove("rlvisible");
				const toggleCheckbox = document.querySelector(".toggle-checkbox");
				toggleCheckbox.checked = false;
				}
		},
		getThreadSource: {
			writable: false,
			value: function() {
				return Promise.resolve(this._threadSource);
			}
		}
	});

	document.querySelectorAll(".usertext .bottom-area").forEach(prepareButtonMenu);

	prepareModal();

	DR._threadSource = DR.fetch(
		"GET",
		location.origin + location.pathname + ".json"
	);

	if (window.location.href.endsWith('#ct')) {
        let elements = document.getElementsByClassName('linkflair-pbotc');
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = 'none';
        }
    }
})(window.DRreddit, document);

