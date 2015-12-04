# zepto.touch

a zepto/jquery touch events plugin, it provides touch events like `tap`,`doubleTap`,`longTap`,`swipe`,`swipeLeft`,`swipeRight`,`swipeUp`,`swipeDown`.

# usage

the api is the same as zepto/jquery events, but it also provides setting method, you must write the setting method `$.fn.touch` before the touch events, eg:

	$('ul').touch({
		swipeMove: function (e, direction, distance, duration) {
			console.log(e, direction, distance, duration);
		}
	}).on('swipe', 'li', function (e, direction) {
		console.log(e, direction);	
	}).on('tap', function (e) {
		console.log(e);
	});
	
# options

	$.fn.touch.defaults = {
		fingers: 1,
        threshold: 75,
        longTapThreshold: 500,
        doubleTapThreshold: 200,
        excludedElements: 'label, button, input, select, textarea, .noTouch',
        preventDefaultEvents: true,
        swipeMove: null
	};