(function(DR, document) {
	"use strict";

	if (
		RegExp("/r/danganronpa/", "i").test(location.href) &&
		!RegExp("class trial", "i").test(document.title)
	)
		return;

	function createSpriteButton(target) {
		var button = document.createElement("a");

		button.href = "#";
		button.className = "rl-button rl-insertsprite";
		button.textContent = "Sprite";

		target.appendChild(button);

		target = null;
		button = null;
	}

	function spriteSelectionHandler(evt) {
		if (evt.target.nodeName != "IMG") return;

		var index = 0,
			parent = document.querySelector(".rl-targetmenu .rl-formfinder").form,
			textarea = parent.querySelector(".usertext-edit textarea");

		if (textarea.textLength > 0) textarea.value += "\n\n";

		index = textarea.textLength;

		textarea.value +=
			"[A few words of the](" + evt.target.dataset.src + "#sprite) comment";
		textarea.focus();
		textarea.setSelectionRange(index + 1, index + 19), DR.hideHandbook();

		parent = null;
		textarea = null;
	}

	function removeLoadingGif() {
		this.classList.remove("loading");
		this.onload = null;
	}

	function spriteListReceiver(sprites) {
		const container = DR.handbook("SPRITE SELECTOR");
		container.classList.add("rl-spritemenu");

		const fragment = document.createDocumentFragment();

		for (let src of sprites) {
			let img = new Image();
		  
			img.className = "loading rl-sprite";
			img.onload = removeLoadingGif;
			img.src = src.permalink;
			img.dataset.src = src.permalink;
			img.dataset.isOriginal = src.isOriginal;
		  
			fragment.appendChild(img);
		  }
		container.querySelector(".body").appendChild(fragment);
		container.classList.add("visible");

		const checking = document.querySelector(".toggle-label");
		checking.classList.add("rlvisible");

		const checkingtwo = document.querySelector (".labeling");
		checkingtwo.classList.add("rlvisible");

		// add checkbox
		/*
		const toggleLabel = document.createElement("label");
		toggleLabel.textContent = "Toggle Original";
		toggleLabel.className = "toggle-label";
		container.querySelector(".title").appendChild(toggleLabel);

		const toggleCheckbox = document.createElement("input");
		toggleCheckbox.type = "checkbox";
		toggleCheckbox.className = "toggle-checkbox";
		toggleLabel.insertBefore(toggleCheckbox, toggleLabel.firstChild);

		const toggleSlider = document.createElement("div");
		toggleSlider.className = "slider round";
		toggleLabel.insertBefore(toggleSlider, toggleLabel.children[2]);
*/

		const checkbox = document.querySelector(".toggle-checkbox"); // select checkbox element with class name .toggle-checkbox
		checkbox.addEventListener("change", function () {
		  const images = document.querySelectorAll(".rl-sprite");
		  if (this.checked) {
		    images.forEach(function (img) {
		      if (img.dataset.isOriginal === "false") {
		        img.classList.add("hide");
		      }
		    });
		  } else {
		    images.forEach(function (img) {
		      img.classList.remove("hide");
		    });
		  }
		});


	}

	document
		.querySelectorAll(".bottom-area .rl-menu")
		.forEach(createSpriteButton);

	DR.addListener("insertsprite", spriteSelectionHandler);

	document.querySelector("body").addEventListener(
		"click",
		function(evt) {
			if (!evt.target.classList.contains("rl-insertsprite")) return;

			evt.preventDefault();
			evt.stopPropagation();

			var span = document.querySelectorAll(".rl-targetmenu"),
				n = span.length;
			while (n--) {
				span[n].classList.remove("rl-targetmenu");
			}

			evt.target.parentNode.classList.add("rl-targetmenu");

			callBackground({
				type: "SPRITES_GETLIST",
				character: DR.currentFlair,
				custom_sprites: DR.SPRITES[DR.currentId]
			}).then(spriteListReceiver);
		},
		true
	);

	function callBackground(message) {
		return new Promise(function(resolve) {
			chrome.runtime.sendMessage(message, resolve);
		});
	}
})(window.DRreddit, document);
