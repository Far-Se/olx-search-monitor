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
chrome.runtime.sendMessage({
	do: 'getResults'
}, results => {
	const head = $('thead tr#columns');
	const body = $('tbody');
	if (true) {
		for (let type in results) {

			if (type.indexOf('//') !== -1) continue;
			let unseenCount = 0;
			let td = $('<td />');
			let div = $('<div />');
			if (results[type][0]['table']) div.append('<table>');
			for (let result of results[type]) {
				if (results[type][0]['table']) {
					div.find('table').append(`<tr style="${result.seen ? 'display:table-footer-group':''}">
                <td>${result.table[0]}&nbsp;mp</td>
                <td>${result.table[1]}&nbsp;€</td>
                <td>${result.price.replace(/ /g,'&nbsp;').replace(' ',',')}</td><td>
                <a href = "${result.href}" target = "_blank" class = "${result.seen ? 'seen' : ''}" data-type = "${type}" data-id = "${result.id}">
                    ` + (results[type][0]['table'] ? '' : `<strong>${result.price}</strong>`) + `
                    <span>${result.seen ? '' : '&bull;'} ${result.title}</span>
                </a>
                </td></tr>
                `);
				} else
					div.append(`
                <a href = "${result.href}" target = "_blank" class = "${result.seen ? 'seen' : ''}" data-type = "${type}" data-id = "${result.id}">
                    ` + (results[type][0]['table'] ? '' : `<strong>${result.price}</strong>`) + `
                    <span>${result.seen ? '' : '&bull;'} ${result.title}</span>
                </a>
            `);
				result.seen || unseenCount++;
			}

			td.append(div);
			head.append(`<th>${type} (${unseenCount}/${results[type].length})</th>`);
			body.append(td);
		}
	} else {
		for (let type in results) {

			if (type.indexOf('//') !== -1) continue;
			let unseenCount = 0;
			let td = $('<td />');
			let div = $('<div />');

			for (let result of results[type]) {

				div.append(`
                <a href = "${result.href}" target = "_blank" class = "${result.seen ? 'seen' : ''}" data-type = "${type}" data-id = "${result.id}">
                    <strong>${result.price}</strong>
                    <span>${result.seen ? '' : '&bull;'} ${result.title}</span>
                </a>
            `);

				result.seen || unseenCount++;
			}

			td.append(div);
			head.append(`<th>${type} (${unseenCount}/${results[type].length})</th>`);
			body.append(td);
		}
	}
	if (body.find('td a').length === 0) setTimeout(() => location.reload(), 500);

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
	$('#citySearch').keypress(
		function(e) {
			if (e.which == 10 || e.which == 13)
				$('#searchCity').trigger('click');
		}
	);
	$('#searchCity').on('click', function() {
		chrome.runtime.sendMessage({
			do: 'citySerach',
			city: $('#citySearch').val(),
		}, (result) => {
			$('#cityResults').html('');
			if (result.status !== 'error') {
				result.data.forEach((e) => {
					let id = (e.region ? "region_id: " : "") + e.id;
					$('#cityResults').append(`<option>${id} - ${e.text}</option>`);
				})
			} else $('#cityResults').append(`<option>No results</option>`);
		});
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
					}
				}
			});
		});
	});
	$('#clear-cache').on('click', function() {
		chrome.runtime.sendMessage({
			do: 'clearCache'
		}, results => {
			$("#clear-cache").text("Done");
			setTimeout(() => {
				$("#clear-cache").text("Clear Cache");
			}, 1500);
		});
	});

	$(document).on('mousedown', 'div a', function(e) {
		const a = $(this);

		if (a.hasClass('seen') || e.which == 3) return;

		const type = a.data('type');
		const id = a.data('id');

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