const REMEMBER_IDS_LIMIT = 3e3;
const LOCALSTORAGE_PREFIX = 'oleix_checkah';

class Background {
	constructor() {
		this.counter = 0;
		this.results = {};
		let auxThat = this;
		this.retrieve('seenIds', {}, data => auxThat.seenIds = data);
		this.interval = null;
		this.resultIds = {};
		this.interval = localStorage.getItem('aux_intervalSearch') || 1;
		this.searchData = {};
		this.OLXTabsResult = [];
	}

	init() {

		let auxThat = this;
		this.retrieve('searchData', "", (data) => {
			auxThat.searchData = data;
			if (data.length === 0) {
				let oldLocal = localStorage.getItem(LOCALSTORAGE_PREFIX + 'searchData') || "";
				if (oldLocal.length) {
					auxThat.searchData = JSON.parse(oldLocal);
				} else
					auxThat.searchData = {
						'Ap. de inchiriat': 'q=&search[city_id]=39939&search[category_id]=909&search[filter_float_price:from]=200&search[filter_float_price:to]=320&search[dist]=0&search[photos]=1',
						'Case de inchiriat': 'q=&search[city_id]=39939&search[category_id]=913&search[filter_float_price:from]=200&search[filter_float_price:to]=490&search[dist]=0&search[photos]=1',
						'Ap. de vanzare': 'q=&search[city_id]=39939&search[category_id]=907&search[filter_float_price:from]=30000&search[filter_float_price:to]=60000&search[dist]=0&search[photos]=1&exclude=Popas.*?|Bucium|Galata',
						'//Case de vanzare': 'q=&search[city_id]=39939&search[category_id]=911&search[filter_float_price:from]=30000&search[filter_float_price:to]=80000&search[dist]=15&search[photos]=1',
						'VW': 'q=&search[filter_enum_model][]=golf&search[filter_enum_model][]=golf-plus&search[filter_enum_model][]=polo&search[filter_float_price:to]=7000&search[filter_float_price:from]=5000&search[filter_float_year:from]=2010&search[filter_float_year:to]=2014&search[filter_float_rulaj_pana:to]=150000&search[category_id]=207'
					};
				auxThat.store('searchData', auxThat.searchData);
			}
			this.normalizeVariables();
			this.listenForMessages();
			this.parseResults();
			chrome.alarms.create("parseResults", {
				periodInMinutes: 1 * this.interval
			});
		});
	}

	normalizeVariables() {
		for (let key in this.searchData) {
			this.seenIds[key] = this.seenIds[key] || [];
			this.results[key] = this.results[key] || [];
			this.resultIds[key] = this.resultIds[key] || [];
		}
	}

	listenForMessages() {
		chrome.runtime.onMessage.addListener((message, sender, respond) => {
			if (message.do === 'getResults') {
				respond(this.results);
			} else if (message.do === 'getSearchData') {
				respond(this.searchData);
			} else if (message.do === 'getOLXTabs') {
				this.getOLXTabs( (r) => respond(r));
			} else if (message.do === 'reloadResults') {
				this.parseResults(() => setTimeout(() => {
					respond("done")
				}, 500));
			} else if (message.do === 'citySerach') {
				this.searchCity(message.city, (results) => respond(results));
			} else if (message.do === 'markSeen') {
				this.markSeen(message.type, message.id, respond);
			} else if (message.do === 'markAllSeen') {
				this.markAllSeen(respond);
			} else if (message.do === 'clearCache') {
				localStorage.setItem('seenIds', '{}');
				// chrome.storage.sync.get(null, (e) => {
				// 	console.log(e);
				// 	chrome.storage.sync.set({
				// 		'seenIds': '{}'
				// 	});
				// });
				this.seenIds = {};
				this.normalizeVariables();
				respond("done");
			} else if (message.do === 'saveData') {
				let that = this;
				this.store('searchData', JSON.parse(message.data), (e) => {
					that.searchData = JSON.parse(message.data);
					that.results = {};
					//that.seenIds = that.retrieve('seenIds', {});
					that.resultIds = {};
					that.normalizeVariables();

					localStorage.setItem('aux_intervalSearch', +message.interval);
					that.interval = +message.interval;
					chrome.alarms.clear('parseResults', () => {
						chrome.alarms.create("parseResults", {
							periodInMinutes: 1 * message.interval
						});
						that.parseResults(() => respond("done"));
					});
				});

			}

			return true;
		});
		// let that = this;
		chrome.alarms.onAlarm.addListener((alarm) => {
			// that.parseResults();

		})
	}
	getOLXTabs( callback ) {
		let that = this;
		chrome.tabs.query({
			url: '*://*.olx.ro/*'
		}, (tabs) => {
            if(!tabs.length) callback(0);
			tabs.forEach((tab) => {
				// chrome.tabs.update(tab.id, {
				// 	active: true
				// });
				chrome.tabs.executeScript(tab.id, {
					"code": "new URLSearchParams(new FormData(mainTopSearch)).toString()"
				}, function (r) {
					callback(r[0]);
				});
			});
		})
	}
	addToOLXTabResults(result) {

	}
	markAllSeen(cb) {
		for (let type in this.results) {
			for (let id of this.resultIds[type]) {
				this.markSeen(type, id);
			}
		}

		this.parseResults(cb);
	}

	searchCity(cityName, cb = function() {}) {
		let data = {
			data: cityName,
			withRegions: 1,
			skipDistricts: 0
		};
		$.post('https://www.olx.ro/ajax/geo6/autosuggest/', data)
			.done(data => {
				cb(data)
			})
	}



	parseResults(cb = function() {}) {
		let toLoad = 0;
		this.counter = 0;

		for (let type in this.searchData) {
			if (type.indexOf('//') === 0) continue;
			let searchData = this.searchData[type];
			let exclude = "";
			let include = "";
			if (searchData.indexOf('exclude') > -1) {
				exclude = searchData.match(/\&exclude=(.*?)($|&)/gmis)[0].replace(/(&|exclude=)/g, '');
			}
			if (searchData.indexOf('include') > -1) {
				include = searchData.match(/\&include=(.*?)($|&)/gmis)[0].replace(/(&|include=)/g, '');
			}
			toLoad++;

			$.post('https://www.olx.ro/ajax/bucuresti/search/list/', searchData)
				.done(data => {
					const e = $(data.replace(/src=/gm, "mata="));
					const that = this;
					let results = e.find('.offer:not(.promoted) .marginright5.linkWithHash');
                    if(~data.indexOf('Nu am gasit anunturi care sa se potriveasca acestei cautari'))
                    {
                        that.results[type] = [{
                            id:0,
                            href:'#',
                            title:'Nu exista rezultate momentan.',
                            price:'-',
                            seen: 0
                        }];
                        //that.resultIds[type].push(id);
                        cb();
                        return 1;
                    }
					results.each(function() {
						const href = $(this).attr('href');
						var title = $(this).find('strong').text();
						const id = href.match(/-ID(.+?).html/i)[1];
						const price = $(this).closest('.offer').find('.price').text().trim();

						let skip = 0;
						if (exclude !== "") {
							let re = new RegExp(exclude, "gi");
							if (re.test(title)) skip = 1;
						}
						if (include !== "") {
							let re = new RegExp(include, "gi");
							//console.log(re);
							if (!re.test(title)) skip = 1;
						}
						if (skip == 0) {

							if (!that.isSeen(type, id) && searchData.indexOf('&notrack') < 0) {
								that.counter += 1;
							}
							if (that.resultIds[type].includes(id)) return;
							//if ((~searchData.indexOf('=907') || ~searchData.indexOf('=911') || ~searchData.indexOf('=909') || ~searchData.indexOf('=913')) && searchData.indexOf('&mp') < 0) {
							if ((~data.indexOf('data-type="galleryWide" href="https://www.olx.ro/imobiliare/')) && searchData.indexOf('&mp') < 0 && !that.isSeen(type, id)) {
								let forbidden = [
                                    'apartament',
                                    'chire',
									'casa',
									'proprietar',
									'mutare',
									'promo',
									'camere',
									'camera',
									'euro',
									'imediata',
									'valabil',
									'renovat',
									'mobilat',
									'utilat',
									'apart',
									'decomandat',
									'lux',
									'ratp',
									'central',
									'ultracentral',
									'valabil',
									'vila',
									'dou',
									'vand',
									'tip',
									'cod',
									'garsoniera',
									'oferta',
									'inchiriez',
									'bloc',
                                    'persoana',
                                    'dezvoltator',
                                    'oferta',
                                    'etaj'

								];
								title = title.replace(/(?!(.partament|Casa))[A-Z]\w{2,}( ([a-z0-9]+| ) [A-Z]\w+)?/g, (e) => {
									if (~forbidden.indexOf(e.toLowerCase()))
										return e;
									return `<span>${e}</span>`;
								});
								if (data.match(/imobiliare\/.*?vanzare/g)) {
									$.get(href)
										.done(xdata => {
											let match = xdata.match(/\d+.m²/gm);
											let mp = '--';
											let sqmt = '--';
											if (match) {
												mp = parseInt(match[0].replace('²', 'p'));
												let iPrice = parseInt(price.replace(' ', ''));
												sqmt = parseInt(iPrice / mp);
												//title = `<span>${mp} mp</span> - <span>${sqmt} €</span> ${title}`;
											}
											that.results[type].push({
												id,
												href,
												title,
												price,
												seen: that.isSeen(type, id),
												table: [mp, sqmt]
											});
											that.resultIds[type].push(id);

										});
								} else {
									that.results[type].push({
										id,
										href,
										title,
										price,
										seen: that.isSeen(type, id)
									});
									that.resultIds[type].push(id);
								}

							} else {
								that.results[type].push({
									id,
									href,
									title,
									price,
									seen: that.isSeen(type, id)
								});
								that.resultIds[type].push(id);
							}

						}
					});

					that.badge(that.counter);
					cb();
					// if (--toLoad >= 1) {
					//     this.badge(this.counter);
					//     cb();
					// }
				});
		}
	}

	badge(text) {
		chrome.browserAction.setBadgeText({
			text: (text || '').toString()
		});
	}

	clearBadge() {
		this.badge('');
	}

	markSeen(type, id, cb = function() {}) {
		if (!this.seenIds[type].includes(id)) {
			this.seenIds[type].push(id);
			this.results[type].find(result => result.id === id).seen = true;
		}

		if (this.seenIds[type].length > REMEMBER_IDS_LIMIT) {
			this.seenIds[type].splice(0, this.seenIds[type].length - REMEMBER_IDS_LIMIT);
		}

		this.store('seenIds', this.seenIds);

		this.counter -= 1;
		this.badge(this.counter);

		cb();
	}

	isSeen(type, id) {
		return this.seenIds[type].includes(id.toString());
	}

	store(key, value, cb = function() {}) {
		localStorage.setItem(key, JSON.stringify(value));
		return cb();
		chrome.storage.sync.set({
			[key]: JSON.stringify(value)
		}, (e) => {
			cb(e)
		});
	}

	retrieve(key, def = null, cb = function() {}) {
		if (key !== 'searchData') {
			const value = localStorage.getItem(key) || 0;
			if (value)
				return cb(JSON.parse(value));
			else return cb(def);
		}
		if (localStorage.getItem('searchData') === null) {
			try {
				chrome.storage.sync.get(key, (v) => {
					cb(Object.keys(v).length === 0 ? def : JSON.parse(v[key]))
				})
			} catch (e) {
				cb(def);
			}
		} else {
			const value = localStorage.getItem(key) || 0;
			if (value)
				return cb(JSON.parse(value));
			else return cb(def);
		}
	}
}

new Background().init();