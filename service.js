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
/*
	async function sendSpritesBack(list) {
		const promises = list.map(async sprite => {
		  if (typeof sprite === 'string') {
			const src = await resolveSpriteUrl(sprite);
			return src ? { permalink: sprite, real: src } : null;
		  } else if (typeof sprite === 'object' && sprite.src && typeof sprite.src === 'string') {
			const src = await resolveSpriteUrl(sprite.src);
			return src ? { permalink: sprite.src, real: src } : null;
		  } else {
			return null;
		  }
		});
	  
		const sprites = await Promise.all(promises);
		return sprites.filter(Boolean);
	  }
*/
	  async function sendSpritesBack(list) {
		const promises = list.map(async sprite => {
		  if (typeof sprite === 'string') {
			const src = await resolveSpriteUrl(sprite);
			return src ? { permalink: sprite, real: src, isOriginal: true} : null;
		  } else if (typeof sprite === 'object' && sprite.src && typeof sprite.src === 'string') {
			const src = await resolveSpriteUrl(sprite.src);
			//return src ? { permalink: sprite.src, real: src, isOriginal: sprite['is-original'] || false } : null;
			return src ? { permalink: sprite.src, real: src, isOriginal: false } : null;
		  } else {
			return null;
		  }
		});
	  
		const sprites = await Promise.all(promises);
		return sprites.filter(Boolean);
	  }
	  

	  

	/*
	function resolveSpriteUrl(uri) {
		//const url = typeof uri === 'string' ? new URL(uri) : new URL(uri.src);
		const url = typeof uri === 'object' && uri.src ? new URL(uri.src) : new URL(uri);
		const key = url.pathname.replace("characters/", "");
	  
		return localStorageGet(key)
		  .catch(function(err) {
			return fetch(uri, {
			  mode: "cors"
			}).then(function(response) {
			  chrome.storage.local.set({ key: response.url });
			  return response.url;
			});
		  })
		  .then(uri => uri + url.hash, err => null);
	  }*/
	  
	  function resolveSpriteUrl(uri) {
		let url;
		if (typeof uri === 'string') {
		  url = new URL(uri);
		} else if (typeof uri === 'object' && uri.src && typeof uri.src === 'string') {
		  url = new URL(uri.src);
		} else {
		  return Promise.resolve(null);
		}
	  
		const key = url.pathname.replace("characters/", "");
	  
		return localStorageGet(key)
		  .catch(function(err) {
			return fetch(uri, {
			  mode: "cors"
			}).then(function(response) {
			  chrome.storage.local.set({ key: response.url });
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
	console.debug('key');

	const cache = await SettingStorage.get(key);
	if (cache && key in cache) return cache[key];

	const request = await fetch(
		`https://frbrz-kumo.appspot.com/postit/busts.json`
	);
	const profile = await request.json();

	await SettingStorage.set({ ['key']: profile });

	return profile;
};

function localStorageGet(key){
	const value = chrome.storage.local.get(['key']);

	return value !== null
		? Promise.resolve(value)
		: Promise.reject("Key doesn't exist in localStorage: " + key);
};

function localStorageSet(item){
	//chrome.storage.local.set({key: item.key, value: item.value});
	chrome.storage.local.set({item: item.value});
	return item.value;
};


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
/*
var SettingStorage = (function() {
	"use strict";

	function SettingStorage() {}

	function storageSyncGet(key) {
		return new Promise(function(resolve) {
			chrome.storage.sync.get(key, resolve);
		});
	}

	function storageSyncSet(object) {
		return new Promise(function(resolve) {
			chrome.storage.sync.set(object, resolve);
		});
	}

	function storageLocalGet(key) {
		return new Promise(function(resolve) {
			chrome.storage.local.get(key, resolve);
		});
	}

	function storageLocalSet(object) {
		return new Promise(function(resolve) {
			chrome.storage.local.set(object, resolve);
		});
	}

	function localStorageGet(key) {
		return new Promise(function(resolve) {
			var i,
				output = {};

			// If key is a valid string, prepare it as array
			if (typeof key == "string" && key != "") key = [key];
			else if (typeof key == "object") {
				// If key is an object,
				// If it isn't an array, retrieve its keys
				if (!Array.isArray(key)) key = Object.keys(key);

				// else, leave it as is
			} else if (key == null || key == undefined) {
				// If key isn't set, retrieve everything
				key = [];
				//for (i = 0; i < localStorage.length; i++) 
				key.push(localStorage.key(0));
			} else throw new Error("Referenced key is not valid.");

			for (i = 0; i < key.length; i++)
				//output[key[i]] = localStorage.getItem(key[i]);
				output[key[i]] = chrome.storage.local.get([key[i]]);

			resolve(output);
		});
	}

	function localStorageSet(object) {
		return new Promise(function(resolve) {
			var i, value;

			if (typeof object == "string" && object.trim() != "")
				//localStorage.setItem(object, JSON.stringify(value));
				chrome.storage.local.set({object: JSON.stringify(value)});
			else if (!Array.isArray(object) && typeof object == "object") {
				value = object;
				object = Object.keys(object);

				for (i = 0; i < object.length; i++)
					//localStorage.setItem(object[i], value[object[i]]);
					chrome.storage.local.set({'object[i]': value[object[i]]});
			}

			resolve();
		});
	}

	if ("storage" in chrome) {
		if ("sync" in chrome.storage) {
			console.debug("Using chrome.storage.sync");

			Object.defineProperties(SettingStorage, {
				get: {
					writable: false,
					value: storageSyncGet
				},
				set: {
					writable: false,
					value: storageSyncSet
				}
			});
		} else {
			console.debug("Using chrome.storage.local");

			Object.defineProperties(SettingStorage, {
				get: {
					writable: false,
					value: storageLocalGet
				},
				set: {
					writable: false,
					value: storageLocalSet
				}
			});
		}
	} else {
		console.debug("Using localStorage");

		Object.defineProperties(SettingStorage, {
			get: {
				writable: false,
				value: localStorageGet
			},
			set: {
				writable: false,
				value: localStorageSet
			}
		});
	}

	return SettingStorage;

	
})();*/
