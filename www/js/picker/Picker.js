var PICKER = 'picker';
// define module
(function() {
	'use strict';
	angular.module(PICKER, ['hmTouchEvents']);
})();

var stamps = (function(stampit) {
	var availabilty = {
		props: {
			isOpen: false
		},
		methods: {
			open: function open() {
				this.isOpen = true;
				return this;
			},
			close: function close() {
				this.isOpen = false;
				return this;
			},
			toggle: function toggle() {
				this.isOpen = !this.isOpen;
				return this;
			}
		}
	};
	var raf = {
		props: {
			then: Date.now(),
			elapsed: null,
			fps: 60
		},
		init: function(opt) {
			this.fps = opt.fps || this.fps;
		},
		methods: {
			requestAnimationFrame: function raf(fn) {
				var requestAnimationFrameFn = ionic.DomUtil.requestAnimationFrame ||
					window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
	 				window.msRequestAnimationFrame;
				return requestAnimationFrameFn(fn);
			},
			cancelAnimationFrame: function(frameId) {
				ionic.DomUtil.cancelAnimationFrame &&
					ionic.DomUtil.cancelAnimationFrame(frameId);
			},
			doAnimate: function doAnimate(breakCondition, draw, lastFrameId) {
				if(breakCondition()) {
					this.cancelAnimationFrame(lastFrameId);
					return;
				}

				var fpsInterval = 1000 / this.fps;
				var frameId = this.requestAnimationFrame(_doAnimate.bind(this));
				var now = Date.now();
				this.elapsed = now - this.then;
				if(this.elapsed > fpsInterval) {
					this.then = now - (this.elapsed % fpsInterval);
					draw.call(this);
				}

				function _doAnimate() {
					this.doAnimate.call(this, breakCondition, draw, frameId);
				}
			},
			drawOnce: function drawOnce(draw) {
				var hadRun = false;
				var breakAfterRunning = function(){
						var _hadRun = hadRun;
						hadRun = true;
						return _hadRun
					};
				this.doAnimate(breakAfterRunning, draw);
			}
		}
	};
	var makeCollectionStamp = function(name) {
		var props = {};
		props[name] = [];
		var methods = {
			size: function size() {
				return this[name].length;
			},
			getItem: function getByIndex(index) {
				return this.size() > index ? this[name][index] : null;
			},
			isSingle: function isSingle() {
				return this[name].length === 1;
			},
			addItem: function addItem(item) {
				this[name].push(item);
			},
			clear: function() {
				this[name].length = 0;
			}
		};
		var setter = 'get' + name.charAt(0).toUpperCase() + name.slice(1);
		methods[setter] = function(collection) {
			return this[name];
		};
		return stampit.props(props)
			.methods(methods);
	};

	var slotConfig = {
		props: {
			y: null,
			lastDeltaY: 0,
			defaultOption: 0,
			index: 0,
			itemIndex: 0,
			onChange: angular.noop,
		},
		init: function(opt, args) {
			// private variables
			var constants = {
				height: 40,
				boundary: 0,
				speedFactor: 5,
				paddingOpts: 2,
				velocityMin: 0.5,
				totalIteration: 60,
			};
			var addToProto = addProto(Object.getPrototypeOf(this));
			var getters = makeGetters(['speedFactor', 'totalIteration', 'velocityMin'])(constants);
			var methods = angular.extend(getters, {
				getSlotInfo: function getItemInformation() {
					var size = this.size();
					return {
						height: constants.height,
						paddingOpts: constants.paddingOpts,
						boundary: constants.boundary,
						// size: this.size(),
						size: size,
						startPosition: constants.paddingOpts * constants.height,
						endPosition: -((size - 1) - constants.paddingOpts) * constants.height
					};
				}
			});

			addToProto(methods);

			var setProps = setPropsIfExists(this, opt);
			setProps(['onChange', 'index', 'selector', 'defaultOption', 'items']);
			this.toDefaultPosition();
		},
		methods: {
			toDefaultPosition: function (opt) {
				this.defaultOption = (opt && opt.defaultOption) || this.defaultOption;
				this.itemIndex = this.defaultOption;
				this.setY(this.getYByIndex(this.defaultOption), this.elem);
			},
			getY: function getYPositionInBounds(targetY) {
				var info = this.getSlotInfo();
				if(targetY > info.startPosition + info.boundary) {
					return info.startPosition + info.boundary;
				}else if(targetY < info.endPosition - info.boundary) {
					return info.endPosition - info.boundary;
				}
				return targetY;
			},
			getYByIndex: function getYPositionByItemIndex(itemIndex) {
				var info = this.getSlotInfo();
				return (info.paddingOpts - itemIndex) * info.height;
			},
			setY: function(targetY) {
				if(targetY === this.y) return;
				this.y = targetY;
				this.transform(targetY);
			},
			correctY: function() {
				var info = this.getSlotInfo();
				this.itemIndex = -(Math.round(this.y / info.height) - info.paddingOpts);
				var endY = Math.round(this.y / info.height) * info.height;
				this.transform(endY);
				this.onChange.call(this, this.itemIndex, this.getItem(this.itemIndex));
			},
			transform: function(targetY) {
				var domElem = this.elem;

				if(domElem){
					var style = getTransform(targetY);
					domElem.css('transform', style);
					domElem.css('webkitTransform', style);
					domElem.css('mozTransform', style);
				}

				function getTransform(y) {
					return 'translate3d(0px, '+y+'px, 0px)';
				}
			}
		}
	};

	var YesOrNo = {
		props: {
			onSubmit: angular.noop,
			onCancel: angular.noop,
			selector: null,
		},
		init: function(opt) {
			var setProps = setPropsIfExists(this, opt);
			setProps(['onSubmit', 'onCancel', 'selector']);
		},
		methods: {
			choose: function() {
				this.selector ? this.onSubmit.call(this, this.selector(this)) : this.onSubmit.call(this);
			},
			cancel: function() {
				this.onCancel.call(this);
			}
		}
	};

	var PickerData = {
		props: {
			title: '',
			showDefault: false,
			onSelected: angular.noop,
		},
		init: function(opt) {
			var notModified = function(prop) {
				return function(slots, indcies) {
					if(!slots.length) return '';
					if(slots.length === 1) {
						return slots[0][prop];
					}
					return slots.reduce(function(acc, slot) {
						return acc + slot[prop]
					}, '');
				}
			};
			var labelNotModified = notModified('label'),
				valueNotModified = notModified('value');
			this.rootScope = opt.rootScope;
			this.onSelected = opt.onSelected || this.onSelected;
			this.mapping = {
				label: (opt.mapping && opt.mapping.label) || labelNotModified,
				value: (opt.mapping && opt.mapping.value) || valueNotModified,
			}
			this.clear();
		},
		methods: {
			getSlot: function getSlotByIndexOrName(indexOrName) {
				if(angular.isNumber(indexOrName)) {
					return this.getItem(indexOrName);
				}else if(angular.isString(indexOrName)) {
					return this.getSlots().find(function(slot) {
						return slot.name === indexOrName;
					});
				}
			},
			addSlot: function addSlot(slotInfo) {
				if(this.size() >= 1 && !slotInfo.name) {
					throw new Error('\'name\' would be requried when you have multiple slots');
				}
				var slot = {
					name: slotInfo.name || 'slot',
					items: (slotInfo.items || []).map(normalize),
					onChange: slotInfo.onChange || angular.noop,
					defaultOption: slotInfo.defaultOption || 0,
				};
				this.addItem(slot);
				return this;
			},
			updateSlotAt: function updateSlotAt(slotInfo) {
				if(this.size() === 0){
					this.addSlot(slotInfo);
					return this;
				};
				var udpateInfo = angular.extend(slotInfo, {
					items: (slotInfo.items || []).map(normalize)
				});
				var eventName = 'picker.update_slot_' + (slotInfo.index || 0);
				this.rootScope && this.rootScope.$broadcast(eventName, udpateInfo);
			}
		}
	};

	var UUID = {
		init: function(opt) {
			this.uuid = generateUUID();
			function generateUUID() {
			    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
					    return v.toString(16);
					});
			}
		}
	};

	return {
		Availabilty: availabilty,
		RAF: raf,
		SlotConfig: slotConfig,
		PickerData: PickerData,
		YesOrNo: YesOrNo,
		UUID: UUID,
		// functions
		makeCollectionStamp: makeCollectionStamp
	};

	// helpers
	function setPropsIfExists(obj, opt) {
		return function setProps(name) {
			if(angular.isArray(name)) {
				angular.forEach(name, setProps);
				return;
			}
			obj[name] = opt[name] || obj[name];
		};
	}
	function makeGetters(keys) {
		keys = keys || [];
		function getGetterName(key) {
			return 'get' + key.charAt(0).toUpperCase() + key.slice(1);
		}
		return function(obj) {
			// return { getter, ... }
			return keys.reduce(function(acc, key){
				acc[getGetterName(key)] = function() {
					return obj[key];
				};
				return acc;
			}, {});
		}
	}
	function addProto(proto) {
		return function(methods) {
			angular.forEach(methods, function(value, key) {
				proto[key] ? null : proto[key] = value;
			});
		};
	}
	function normalize(item) {
		return angular.isObject(item) ? {
			label: angular.isUndefined(item.label) ? '' : item.label,
			value: angular.isUndefined(item.value) ? '' : item.value
		} : {
			label: item,
			value: item
		};
	}
})(stampit);

// define picker/slot factory
(function(stampit, stampts) {
	angular.module(PICKER)
		.factory('PickerFactory', PickerFactory);

	PickerFactory.$inject = [];
	function PickerFactory() {
		var Picker = stampts.makeCollectionStamp('slots');
		var Slot = stampts.makeCollectionStamp('items');
		var PickerData = stampts.makeCollectionStamp('slots');

		return {
			picker: Picker.compose(stamps.Availabilty, stampts.YesOrNo, stampts.UUID),
			slot: Slot.compose(stamps.SlotConfig, stampts.RAF),
			pickerData: PickerData.compose(stampts.PickerData),
		};
	}
})(stampit, stamps);

// define directives
// Slots
(function() {
	angular.module(PICKER)
		.directive('pickerSlot', Slot);

	// deps stampts: RAF, SlotConfig
	var dragHandler = {
		onDrag: function onDrag($event){
			if(!this.lastDeltaY) {
				this.lastDeltaY = $event.gesture.deltaY;
				return;
			}
			var newY = this.y + Math.round($event.gesture.deltaY - this.lastDeltaY),
				nextY = this.getY(newY);
			this.lastDeltaY = $event.gesture.deltaY;
			this.drawOnce(function updateY() {
				this.setY(nextY);
			});
		},
		onDragEnd: function onDragEnd($event){
			var event = $event.gesture,
					v = event.velocityY;
			this.lastDeltaY = 0;
			if(Math.abs(v) <= this.getVelocityMin()){
				// might control animation interval with style instead of calculating all frame by javascript
				this.drawOnce(function updateThenEndAnimation() {
					this.correctY();
				});
				return;
			}

			//draw with ease-out-cubic animation
			var iterationCount = 0,
					totalIteration = this.getTotalIteration();
			var shouldEarlyBreak = false;
			var breakCondition = function() {
				return shouldEarlyBreak || iterationCount === totalIteration;
			};

			var velocity = Math.abs(v * this.getSpeedFactor());
      var targetY = this.getY(this.y + Math.round(event.deltaY * velocity));
			var draw = function drawInFrame() {
				var nextY = easeOutCubic(this.y, targetY - this.y, iterationCount, totalIteration);
				this.setY(nextY);
				iterationCount = iterationCount + 1;
				shouldEarlyBreak = targetY === this.getY(nextY);
				if(breakCondition()){
					this.correctY();
				}
			}.bind(this);

			this.doAnimate(breakCondition, draw);
			function easeOutCubic(start, distance, currentIter, totalIter){
				return distance * (Math.pow(currentIter / totalIter - 1, 3) + 1) + start;
    	}
		}
	};
	var tapHandler = {
		onTap: function onTap($event) {
			var itemIndex = +$event.gesture.target.dataset.index;
			if(itemIndex === this.itemIndex) return;
			var nextY = this.getYByIndex(itemIndex);
			this.itemIndex = itemIndex;
			this.setY(nextY);
			this.onChange.call(this, this.itemIndex, this.getItem(this.itemIndex));
			$event.preventDefault();
		}
	};

	Slot.$inject = ['PickerFactory'];
	function Slot(factory) {
		var slotDirectiveConfig = {
			require: '^^picker',
			restrict: 'E',
			replace: true,
			templateUrl: 'js/picker/Slot.html',
			scope: {
				index: '@',
				raw: '=slot',
				uuid: '=',
			},
			link: slotLink
		};

		return slotDirectiveConfig;
		function slotLink(scope, element, attrs, pickerCtrl, transclude) {
			var slot = factory.slot
				.props({elem: element})
				.methods(angular.extend(dragHandler, tapHandler))({
					index: +scope.index,
					items: scope.raw.items,
					onChange: scope.raw.onChange || angular.noop,
					defaultOption: scope.raw.defaultOption,
				});
			scope.slot = slot;
			pickerCtrl.addSlot(slot);
			scope.$on('picker.update_slot_'+ (+scope.index), function(e, payload) {
				slot.clear();
				slot.items = payload.items;
				slot.toDefaultPosition(payload);
			});
		}
	}
})();

// Pickers
(function() {
	angular.module(PICKER)
		.directive('picker', Slot);

	Slot.$inject = ['PickerFactory'];
	function Slot(factory) {
		var pickerDirectiveConfig = {
			restrict: 'E',
			replace: true,
			templateUrl: 'js/picker/Picker.html',
			controller: ['$scope', pickerCtrl]
		};

		return pickerDirectiveConfig;
		function pickerCtrl(scope) {
			var self = this;
			var picker = factory.picker({
				onSubmit: function(item) {
					var slotIndices = this.slots.map(function(slot) { return slot.itemIndex; });
					self.payload.onSelected && self.payload.onSelected.call(this, item, slotIndices);
				},
				selector: function() {
					return this.slots.map(function(slot) {
						return slot.getItem(slot.itemIndex);
					});
				}
			});

			scope.state = picker;
			scope.slots = [];
			this.payload = {};
			scope.$on('picker.slideUp', function(e, payload) {
				var slots = payload.slots;
				if(!slots || !slots.length) return;

				self.payload = payload;
				scope.slots = slots;
				picker.open();
			});

			scope.cancel = function resetPicker(e) {
				e.preventDefault();
				picker.cancel();
				picker.close();
			};
			scope.submit = function choose() {
				picker.choose();
				picker.close();
			};

			this.addSlot = function(slot) {
				picker.addItem(slot);
			};
		}
	}
})();


// input directive
(function() {
	angular.module('picker')
		.directive('pickerModel', PickerModel);

	PickerModel.$inject = ['$rootScope', '$timeout', '$parse', 'PickerFactory'];
	function PickerModel($rootScope, $timeout, $parse, factory) {
		var pickerModelConfig = {
			restrict: 'A',
			require: 'ngModel',
			link: pickerModelLink,
		};

		function pickerModelLink(scope, element, attrs, modelCtrl, transclude) {
			attrs.$set('readonly', 'readonly');
			attrs.$set('data-tap-disabled', 'true');
			var delimiter = '|';
			var pickerData = $parse(attrs.pickerModel)(scope);
			pickerData.rootScope = $rootScope;
			var onSelected = (pickerData.onSelected || angular.noop);
			pickerData.onSelected = function wrappedOnSelected(slots, selectedIndices) {
				var label = pickerData.mapping.label(slots, selectedIndices);
				var value = pickerData.mapping.value(slots, selectedIndices);

				element[0]['value'] = label;
				modelCtrl.$setViewValue(value);
				scope.defaultOption = selectedIndices;
				onSelected.call(this, slots, selectedIndices);
			}.bind(pickerData);

			element.bind('click', function(e) {
				$timeout(function() {
					slideUpPicker(pickerData);
				}, 0);
			});

			function slideUpPicker(pickerData) {
				if(scope.defaultOption && scope.defaultOption.length) {
					angular.forEach(pickerData.slots, function(slot, index) {
						slot.defaultOption = (scope.defaultOption[index] || 0);
					});
				}
				$rootScope.$broadcast('picker.slideUp', pickerData);
			}
		}
		return pickerModelConfig;
	}
})()