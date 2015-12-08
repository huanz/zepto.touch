# zepto.touch [![npm package](https://img.shields.io/npm/v/zepto.touch.svg?style=flat-square)](https://www.npmjs.com/package/zepto.touch)

a zepto/jquery touch events plugin, it provides touch events like `tap`,`doubleTap`,`longTap`,`swipe`,`swipeLeft`,`swipeRight`,`swipeUp`,`swipeDown`.

# installation

use npm:

	npm install zepto.touch

use bower:

	bower install zepto.touch

# usage

the api is the same as zepto/jquery events, but it also provides setting method, you must write the setting method `$.fn.touch` before the touch events, eg:

	$('ul').touch({
		swipeMove: function (e, direction, distance, duration) {
			console.log(e, direction, distance, duration);
		}
	}).on('swipe', 'li', function (e, direction) {
		console.log(e, direction);
	}).on('tap.test', function (e) {
		console.log('tap.test');
	}).on('tap', function (e) {
		console.log('tap');
		$(this).off('tap.test');
	});

# options

	$.fn.touch.defaults = {
        fingers: 1,
        threshold: 75,
        longTapThreshold: 500,
        doubleTapThreshold: 200,
        excludedElements: 'label, button, input, select, textarea, .noTouch',
        pageScroll: true,
        swipeMove: null
	};
