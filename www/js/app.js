// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'picker'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.controller('IndexController', ['$scope', '$rootScope', 'PickerFactory', function($scope, $rootScope, factory) {
  $scope.values = {
    form: {
    address: ''
    }
  }
  $scope.showPicker = function showPicker() {
    $rootScope.$broadcast('picker.slideUp', {
      slots: [
        {
          items: [{label:"OneSlot1",value:0},{label:"OneSlot2",value:1},{label:"OneSlot3",value:2},{label:"OneSlot4",value:3},{label:"OneSlot5",value:4},{label:"OneSlot6",value:5},{label:"OneSlot7",value:6},{label:"OneSlot8",value:7},{label:"OneSlot9",value:8}]
        }
      ]
    });
  };
  $scope.showPicker2 = function showPicker2() {
    $rootScope.$broadcast('picker.slideUp', {
      slots: [
        {
          items: [{label:"Item01",value:0},{label:"Item02",value:1},{label:"Item03",value:2},{label:"Item04",value:3},{label:"Item05",value:4},{label:"Item06",value:5},{label:"Item07",value:6},{label:"Item08",value:7},{label:"Item09",value:8}]
        },
        {
          items: [{label:"Second1",value:0},{label:"Second2",value:1},{label:"Second3",value:2},{label:"Second4",value:3},{label:"Second5",value:4},{label:"Second6",value:5},{label:"Second7",value:6},{label:"Second8",value:7},{label:"Second9",value:8}]
        },
        {
          items: [{label: '1', value: 1}, {label: '2', value: 2}, {label: '3', value: 3}, {label: '4', value: 4}, {label: '5', value: 5}, {label: '6', value: 6}, {label: '7', value: 7}, {label: '8', value: 8}, {label: '9', value: 9}, {label: '10', value: 10}, {label: '11', value: 11}, {label: '12', value: 12}, {label: '13', value: 13}, {label: '14', value: 14}, {label: '15', value: 15}]
        }
      ]
    });
  };


  //pickerdata
  var mockAry = [{label:"OneSlot1",value:0},{label:"OneSlot2",value:1},{label:"OneSlot3",value:2},{label:"OneSlot4",value:3},{label:"OneSlot5",value:4},{label:"OneSlot6",value:5},{label:"OneSlot7",value:6},{label:"OneSlot8",value:7},{label:"OneSlot9",value:8}];
      var mockSecond = ['a','b','c','d','e','f','g','h','i'];
      var pickerData = factory.pickerData({
        mapping: {
          label: function (values) {
            return values.reduce(function(acc, value) {
              return acc + ',' + value.label;
            }, '');
          },
          value: function (values) {
            return values.reduce(function(acc, value) {
              return acc + '|' + value.value;
            }, '');
          }
        }
      });
      pickerData.addSlot({
        name: 'slotI',
        items: mockAry,
        onChange: function(index, item){
          console.log("onChange from pickerData#addSlot @ app.js", index, item);
          if(index === 4){
            pickerData.updateSlotAt({
              index: 1,
              defaultOption: 3,
              items: [1,2,3,4,5,6,7,8,9,10]
            });
          }else {
            pickerData.updateSlotAt({
              index: 1,
              items: mockSecond
            });
          }
        },
      })
      .addSlot({
        name: 'slotII',
        items: mockSecond,
      });
      $scope.pickerData = pickerData;
}]);