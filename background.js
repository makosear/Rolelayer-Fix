function normalizeCharacterName(name) {
	name = name.toLowerCase();
	name = name.split("-")[0];

	if (name in character_map) name = character_map[name];

	return Promise.resolve(name);
}

var character_map = {
	celestia: "celes",
	fujisaki: "chihiro",
	hagakure: "yasuhiro",
	ishimaru: "kiyotaka",
	kyoko: "kyouko",
	maizono: "sayaka",
	monokuma2: "monokuma",
	ikusaba: "mukuro",
	naegi: "makoto",
	toko: "touko",
	gundam: "gundham",
	hanamura: "teruteru",
	hinata: "hajime",
	koizumi: "mahiru",
	kuzuryuu: "fuyuhiko",
	nanami: "chiaki",
	nidaii: "nekomaru",
	pekoyama: "peko",
	saionji: "hiyoko",
	souda: "kazuichi",
	togami: "imposter",
	tsumiki: "mikan"
};

function localStorageGet(key) {
	const value = localStorage.getItem(key);
	return value !== null
		? Promise.resolve(value)
		: Promise.reject("Key doesn't exists in localStorage: " + key);
}
function localStorageSet(item) {
	localStorage.setItem(item.key, item.value);
	return item.value;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.type) {
		case "SETTINGS_OPEN":
			if ("runtime" in chrome && "openOptionsPage" in chrome.runtime)
				chrome.runtime.openOptionsPage();
			else chrome.tabs.create({ url: chrome.extension.getURL("options.html") });

			return false;

		case "PROFILE_RETRIEVE":
			getCharacterProfile(request.character).then(sendResponse);
			return true;

		case "SPRITES_RESOLVE":
			resolveSpriteUrl(request.uri).then(sendResponse);
			return true;

		case "SPRITES_GETLIST":
			if (Array.isArray(request.custom_sprites)) {
				Promise.resolve(request.custom_sprites)
					.then(sendSpritesBack)
					.then(sendResponse);
			} else {
				normalizeCharacterName(request.character)
					.then(async name => {
						let request = await fetch("busts.json");
						const busts = await request.json();

						if (name in busts) return busts[name];

						const profile = await getCharacterProfile(name);
						return profile.sprites;
					})
					.then(sendSpritesBack)
					.then(sendResponse);
			}

			return true;

		default:
			return false;
	}

	async function sendSpritesBack(list) {
		const promises = []
			.concat(list)
			.filter(Boolean)
			.map(async sprite => {
				const src = await resolveSpriteUrl(sprite);
				return src ? { permalink: sprite, real: src } : null;
			});

		const sprites = await Promise.all(promises);
		return sprites.filter(Boolean);
	}

	function resolveSpriteUrl(uri) {
		const url = new URL(uri);
		const key = url.pathname.replace("characters/", "");

		return localStorageGet(key)
			.catch(function(err) {
				return fetch(uri, {
					mode: "cors"
				}).then(function(response) {
					localStorage.setItem(key, response.url);
					return response.url;
				});
			})
			.then(uri => uri + url.hash, err => null);
	}

	return true;
});

async function getCharacterProfile(character) {
	character = await normalizeCharacterName(character);
	const key = `profile_${character}`;

	const cache = await SettingStorage.get(key);
	if (cache && key in cache) return cache[key];

	const request = await fetch(
		`https://r-drrp.appspot.com/characters/${character}/profile.json`
	);
	const profile = await request.json();

	await SettingStorage.set({ [key]: profile });

	return profile;
}

function install() {
	const getOption = (first, defecto) => (first != null ? first : defecto);

	SettingStorage.get()
		.then(function(settings) {
			return {
				theme: getOption(settings.theme, "default"),
				bullets_bgred: getOption(settings.bullets_bgred, false),
				banner_paused: getOption(settings.banner_paused, true),
				sprites_sourcelist: getOption(
					settings.sprites_sourcelist,
					"https://frbrz-kumo.appspot.com/postit/busts.json"
				)
			};
		})
		.then(SettingStorage.set);
}

function installIfFirefoxStillDoesntImplementTheOnInstalledEvent() {
	var installed = localStorage.getItem("installed");

	if (installed != "true") {
		install();
		localStorage.setItem("installed", "true");
	}
}

if ("onInstalled" in chrome.runtime)
	chrome.runtime.onInstalled.addListener(install);
else installIfFirefoxStillDoesntImplementTheOnInstalledEvent();
