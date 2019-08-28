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
	for (let type in results) {

		if (type.indexOf('//') !== -1) continue;
		let unseenCount = 0;
		let td          = $('<td />');
        let div         = $('<div />');
        let divC = '';
        if(results[type][0]['table']) divC +='<table>';
		for (let result of results[type]) {
            if(results[type][0]['table'])
            {
                divC +=(`<tr><td>${result.table[0]} mp</td><td>${result.table[1]} €</td><td>`);
            }
            
			divC +=(`
                <a href = "${result.href}" target = "_blank" class = "${result.seen ? 'seen' : ''}" data-type = "${type}" data-id = "${result.id}">
                    <strong>${result.price}</strong>
                    <span>${result.seen ? '' : '&bull;'} ${result.title}</span>
                </a>
            `);
            if(results[type][0]['table']) divC +=('</td></tr>');
            div.append(divC);
			result.seen || unseenCount++;
		}

		td.append(div);
		head.append(`<th>${type} (${unseenCount}/${results[type].length})</th>`);
		body.append(td);
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

		// $('#items').
		//#region Highlight
		/* 
		        $("#searchData").text(JSON.stringify(result).replace(/\":\"/gm, '": "').replace(/\",\"/gm, '",\r\n"').replace(/[\{\}]/gm, "\r\n$&\r\n").substr(2));
				//#region Highlight
				{
					var $backdrop   = $('#sContainer .backdrop');
					var $highlights = $('#sContainer .highlights');
					var $textarea   = $('#sContainer #searchData');

					function applyHighlights(text) {
						text = text
							.replace(/\n$/g, '\n\n')
							.replace(/[0-9]+\b/g, '<mark>$&</mark>')
							.replace(/\[.*?\]/g, '<mark class="m2">$&</mark>')
							.replace(/",/g, '<mark class="m3">$&</mark>')
							.replace(/"\/\/.*?[\r\n]/g, '<mark class="m4">$&</mark>');

						return text;
					}

					function handleInput() {
						var text            = $textarea.val();
						var highlightedText = applyHighlights(text);
						$highlights.html(highlightedText);
					}

					function handleScroll() {
						var scrollTop = $textarea.scrollTop();
						$backdrop.scrollTop(scrollTop);

						var scrollLeft = $textarea.scrollLeft();
						$backdrop.scrollLeft(scrollLeft);
					}

					function bindEvents() {
						$textarea.on({
							'input' : handleInput,
							'scroll': handleScroll
						});

					}


					bindEvents();
					handleInput();
				}
				//#endregion
		 */
		//#endregion

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
			let data  = $('.searchFilter').eq(e).val();
			if (title.length && data.length) {
				saveData += `"${title}" : "${data}",`;
			}
		});
		saveData  = saveData.substr(0, saveData.length - 1);
		saveData += "}";
		chrome.runtime.sendMessage({
			do      : 'saveData',
			data    : saveData,
			interval: $('#intervalSearch').val()
        }, () => setTimeout( function() {location.reload() }, 1000)

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
			do  : 'citySerach',
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
        if(r !== true) return;
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
            setTimeout( () => {$("#clear-cache").text("Clear Cache");}, 1500);
         });
    });
    
	$(document).on('mousedown', 'div a', function(e) {
		const a = $(this);

		if (a.hasClass('seen') || e.which == 3) return;

		const type = a.data('type');
		const id   = a.data('id');

		chrome.runtime.sendMessage({
			do: 'markSeen',
			type,
			id
		}, () => {
            if(e.which !== 2)
			window.open(a.attr('href'));
		});

		e.preventDefault();
	});
});