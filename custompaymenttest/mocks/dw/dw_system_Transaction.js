'use strict';

function wrap(item) {
    return item();
}

module.exports = {
    wrap: wrap
};
