if (!Object.prototype.forEach) {
	Object.defineProperty(Object.prototype, 'forEach', {
		value: function(callback, thisArg) {
			if (this == null) {
				throw new TypeError('Not an object');
			}
			thisArg = thisArg || window;
			for (var key in this) {
				if (this.hasOwnProperty(key)) {
					callback.call(thisArg, this[key], key, this);
				}
			}
		}
	});
}
chrome.permissions.contains({
	permissions: ['tabs'],
	origins: ['*://*.storia.ro/*']
}, function(result) {
	if (!result) {
		$('#Storia').css('display', 'inherit');
	}
});
$('#Storia').click(function() {
	chrome.permissions.request({
		permissions: ['tabs'],
		origins: ['*://*.storia.ro/*']
	}, function(granted) {
		// The callback argument will be true if the user granted the permissions.
		if (granted) {
			window.alert("Acum linkurile de pe Storia.ro se vor incarca.");
		} else {
			window.alert("Trebuie permisiunea de Storia pentru aceasta optiune");
		}
	});
})
chrome.runtime.sendMessage({
	do: 'getResults'
}, results => {
	const table = $('#table');
	for (let type in results) {
		if (type.indexOf('//') !== -1) continue;
		let unseenCount = 0;
		let div = $('<div />');
		div.append('<table class="tRows">');
		let tableRows = ``;
		let tableRowsVisited = ``;
		for (let result of results[type]) {
			if (!result.table) {
				result.table = ["", ""];
			}
			let ndiv = result.seen ? 'tvisited' : 'tnew';
			const string = `<tr class="${ndiv}">
                ${result.table[0]&&!result.seen ? `<td>${result.table[0]} mp</td>` : '<td class="empty"></td>'}
                ${result.table[0]&&!result.seen ? `<td>${result.table[1]} €</td>` : '<td class="empty"></td>'}
                <td>${result.price.replace(/(\d) (\d)/g,'$1,$2').replace(/ /g,'&nbsp;')}</td><td>
                <a href = "${result.href}" target = "_blank" class = "${result.seen ? 'seen' : ''}" data-type = "${type}" data-id = "${result.id}">
                    ` + (results[type][0]['table'] ? '' : `<strong>${result.price}</strong>`) + `
                    <span>${result.title}</span>
                </a>
                </td></tr>
                `;
			result.seen ? (tableRowsVisited += string) : (tableRows += string);
			result.seen || unseenCount++;
		}
		div.find('.tRows').append(tableRows + tableRowsVisited);
		//td.append(div);
		table.append(`<div class="column"><h2>${type} (${unseenCount}/${results[type].length})</h2>${div.html()}</div>`);
	}
	if (table.find('td a').length === 0 && table.find('h2').length) {
		table.html('<div class="column"><h2>Reloading...</h2></div>');
		setTimeout(() => location.reload(), 800);
	}

	let interval = localStorage.getItem('aux_intervalSearch') || 1;
	$('#intervalSearch').val(interval);
	chrome.runtime.sendMessage({
		do: 'getSearchData'
	}, result => {
		result.forEach((title, data) => {
			$('#items').append(`
                <div   class = "row">
                <input class = "titleFilter" name  = "title[]" value = "${data}">
                <input class = "searchFilter" name = "value[]" value = "${title}">
                </div>
            `)
		})

	})
});

$(() => {
	$('body').on('change', '.searchFilter', function(e) {
		let text = decodeURIComponent($(this).val().replace(/["](.*?)['"]$/g, '$1').replace('Cauta+acum...', '').replace('view=&min_id=&', '').replace(/"g/, "%22").replace(/'g/, "%27"));
		$(this).val(text);

	})
	$('#addNew').on('click', function() {
		$('#items').append(`
        <div   class = "row">
        <input class = "titleFilter" name  = "title[]" value = "" placeholder = "Title">
        <input class = "searchFilter" name = "value[]" value = "" placeholder = "Search Data">
        </div>
    `)
	});
	$('#mark-all-seen').on('click', function() {
		chrome.runtime.sendMessage({
			do: 'markAllSeen'
		}, () => window.close());
	});
	$('#saveData').on('click', function() {
		$(this).text("...");
		let saveData = "{";
		$('.titleFilter').each((e, i) => {
			let title = $(i).val();
			let data = $('.searchFilter').eq(e).val();
			if (title.length && data.length) {
				saveData += `"${title}" : "${data}",`;
			}
		});
		saveData = saveData.substr(0, saveData.length - 1);
		saveData += "}";
		chrome.runtime.sendMessage({
				do: 'saveData',
				data: saveData,
				interval: $('#intervalSearch').val()
			}, () => setTimeout(function() {
				location.reload()
			}, 1000)

		);
	});
	$('#open-settings').on('click', function() {
		$('#settings').toggle()
	});
	$('#reload-results').on('click', function() {
		$(this).text("...");
		chrome.runtime.sendMessage({
			do: 'reloadResults'
		}, () => location.reload());
	});

	$('#open-all-unseen').on('click', function() {
		let r = confirm("Sure? If there are too many urls might broke Chrome");
		if (r !== true) return;
		chrome.runtime.sendMessage({
			do: 'getResults'
		}, results => {
			chrome.runtime.sendMessage({
				do: 'markAllSeen'
			}, () => {
				for (let type in results) {
					for (let result of results[type]) {
						result.seen || chrome.tabs.create({
							url: result.href
						});
						98
					}
				}
			});
		});
	});

	$('#getTabs').on('click', function() {
		chrome.permissions.contains({
			permissions: ['tabs'],
			origins: ['*://*.olx.ro/*']
		}, function(result) {
			if (result) {
				chrome.runtime.sendMessage({
					do: 'getOLXTabs'
				}, results => {
					if (results.length) {
						result = decodeURIComponent(results.replace(/["](.*?)['"]$/g, '$1').replace('Cauta+acum...', '').replace('view=&min_id=&', '').replace(/"g/, "%22").replace(/'g/, "%27"));
						$('#items').append(`
                        <div   class = "row">
                        <input class = "titleFilter" name  = "title[]" value = "" focus placeholder = "Title">
                        <input class = "searchFilter" name = "value[]" value = "${result}" placeholder = "Search Data">
                        </div>
                    `);
						$('#items').find('.row:last-child .titleFilter').focus();
					} else window.alert("Deschide un tab cu olx intai");
				});
			} else {
				chrome.permissions.request({
					permissions: ['tabs'],
					origins: ['*://*.olx.ro/*']
				}, function(granted) {
					// The callback argument will be true if the user granted the permissions.
					if (granted) {
						$('#getTabs').trigger('click');
					} else {
						window.alert("Trebuie permisiunea de TABS pentru aceasta optiune");
					}
				});
			}
		});

	});

	$('#toggleResponsive').on('change', function() {
		localStorage.setItem("aux_Responsive", ~~$(this).prop('checked'));
		if (~~$(this).prop('checked') === 0) {
			$('#customStyle').remove();
		} else
			setResponsive();
	});
	let setResponsive = () => {
		const toggleResponsive = localStorage.getItem('aux_Responsive') * 1;
		if (toggleResponsive == true)
			$('body').append(`<style id="customStyle">
                .column{
                    max-width: calc(100% * 0.33333) !important;
                    padding-left:0px !important;
                }
            </style>`);
		$('#toggleResponsive').prop('checked', toggleResponsive); //toggleResponsive == false ? '0' : 'checked');
	};
	setResponsive();
	$(document).on('mousedown', 'div a', function(e) {
		const a = $(this);

		if (a.hasClass('seen') || e.which == 3) return;

		const type = a.data('type');
		const id = a.data('id');
		a.css(`filter`, 'brightness(0.5)');
		a.css('font-style', 'italic;');
		chrome.runtime.sendMessage({
			do: 'markSeen',
			type,
			id
		}, () => {
			if (e.which !== 2)
				window.open(a.attr('href'));
		});

		e.preventDefault();
	});
});