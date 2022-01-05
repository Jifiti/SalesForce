'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    if (lineItemContainer) {
        this.grandTotalValue = lineItemContainer.totalGrossPrice.value;
    } else {
        this.grandTotalValue = 0;
    }
}

module.exports = totals;
