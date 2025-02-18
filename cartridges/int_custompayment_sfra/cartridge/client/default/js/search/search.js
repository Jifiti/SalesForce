'use strict';

var base = require('base/search/search');
var messagingPLP = require('../messaging/messagingPLP');

messagingPLP.init();

/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');
        var activeDiv = $results.find(
            '.' + $(this)[0].className.replace(/ /g, '.')
        );
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });

    updateDom($results, '.refinements');
}

/**
* Parse Ajax results and updated select DOM elements
*
* @param {string} response - Ajax response HTML code
* @return {undefined}
*/
function parseResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom
        .find('.grid-footer')
        .data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}

base.sort = function () {
    // Handle sort order menu selection
    $('.container').on('change', '[name=sort-order]', function (e) {
        e.preventDefault();

        $.spinner().start();
        $(this).trigger('search:sort', this.value);
        $.ajax({
            url: this.value,
            data: { selectedUrl: this.value },
            method: 'GET',
            success: function (response) {
                messagingPLP.unmountJifiti();
                $('.product-grid').empty().html(response);
                messagingPLP.mountJifiti();

                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
};

base.applyFilter = function () {
    // Handle refinement value selection and reset click
    $('.container').on(
        'click',
        '.refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button',
        function (e) {
            e.preventDefault();
            e.stopPropagation();

            $.spinner().start();
            $(this).trigger('search:filter', e);
            $.ajax({
                url: $(this).data('href'),
                data: {
                    page: $('.grid-footer').data('page-number'),
                    selectedUrl: $(this).data('href')
                },
                method: 'GET',
                success: function (response) {
                    messagingPLP.unmountJifiti();
                    parseResults(response);
                    messagingPLP.mountJifiti();

                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    );
};


base.showMore = function () {
    // Show more products
    $('.container').on('click', '.show-more button', function (e) {
        e.stopPropagation();
        var showMoreUrl = $(this).data('url');
        e.preventDefault();

        $.spinner().start();
        $(this).trigger('search:showMore', e);
        $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',
            success: function (response) {
                messagingPLP.unmountJifiti();
                $('.grid-footer').replaceWith(response);
                updateSortOptions(response);
                messagingPLP.mountJifiti();
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
};

module.exports = base;
