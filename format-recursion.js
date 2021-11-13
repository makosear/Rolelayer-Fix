(function(DR, doc) {
	"use strict";

	document.addEventListener("click", requestChildrenThread, true);

	function requestChildrenThread(evt) {
		/** @type {HTMLElement} */
		var target = evt.target;

		if (target.matches(".thing.morerecursion *")) {
			evt.preventDefault();
			evt.stopPropagation();

			while (!target.matches(".thing.morerecursion")) {
				target = target.parentNode;
				if (target.isSameNode(doc.body)) return;
			}

			var link = target.querySelector(".deepthread > a");

			fetch(link.origin + link.pathname + ".json").then(function(res) {
				var listing = res[1];
				listing && listing.data.children.forEach(buildComment);
				listing = null;
			});
		}
	}

	function buildComment(t3) {}
})(window.DRreddit, document);
