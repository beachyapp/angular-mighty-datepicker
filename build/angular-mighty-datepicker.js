(function() {
  angular.module("mightyDatepicker", ["pasvaz.bindonce"]);

  angular.module("mightyDatepicker").run([
    "$templateCache", function($templateCache) {
      var pickerTemplate;
      pickerTemplate = "<div class=\"mighty-picker__wrapper\">\n  <button type=\"button\" class=\"mighty-picker__prev-month\"\n    ng-click=\"moveMonth(-1)\">\n    <<\n  </button>\n  <div class=\"mighty-picker__month\"\n    bindonce ng-repeat=\"month in months track by $index\">\n    <div class=\"mighty-picker__month-name\" ng-bind=\"month.name\"></div>\n    <table class=\"mighty-picker-calendar\">\n      <tr class=\"mighty-picker-calendar__days\">\n        <th bindonce ng-repeat=\"day in month.weeks[1]\"\n          class=\"mighty-picker-calendar__weekday\"\n          bo-text=\"day.date.format('dd')\">\n        </th>\n      </tr>\n      <tr bindonce ng-repeat=\"week in month.weeks\">\n        <td\n            bo-class='{\n              \"mighty-picker-calendar__day\": day,\n              \"mighty-picker-calendar__day--selected\": day.selected,\n              \"mighty-picker-calendar__day--selected-to\": day.selectedTo,\n              \"mighty-picker-calendar__day--disabled\": day.disabled,\n              \"mighty-picker-calendar__day--in-range\": day.inRange,\n              \"mighty-picker-calendar__day--marked\": day.marker\n            }'\n            ng-repeat=\"day in week track by $index\" ng-click=\"select(day)\">\n            <div class=\"mighty-picker-calendar__day-wrapper\"\n              bo-text=\"day.date.date()\"></div>\n            <div class=\"mighty-picker-calendar__day-marker-wrapper\">\n              <div class=\"mighty-picker-calendar__day-marker\"\n                ng-if=\"day.marker\"\n                ng-bind-template=\"mightyDatepicker/markerTemplate\">\n              </div>\n            </div>\n        </td>\n      </tr>\n    </table>\n  </div>\n  <button type=\"button\" class=\"mighty-picker__next-month\"\n    ng-click=\"moveMonth(1)\">\n    >>\n  </button>\n</div>";
      return $templateCache.put('mightyDatepicker/pickerTemplate', pickerTemplate);
    }
  ]).directive("mightyDatepicker", [
    "$compile", "$templateCache", function($compile, $templateCache) {
      var options;
      options = {
        mode: "simple",
        months: 1,
        start: null,
        filter: void 0,
        callback: void 0,
        afterMoveMonth: void 0,
        markerTemplate: "{{ day.marker }}"
      };
      return {
        restrict: "AE",
        replace: true,
        template: '<div class="mighty-picker__holder"></div>',
        scope: {
          model: '=ngModel',
          options: '=',
          markers: '=',
          after: '=',
          before: '=',
          rangeFrom: '=',
          rangeTo: '='
        },
        link: function($scope, $element, $attrs) {
          var _bake, _build, _buildMonth, _buildWeek, _getMarker, _indexMarkers, _indexOfMoment, _isInRange, _isSelected, _isSelectedTo, _prepare, _setup, _withinLimits;
          _bake = function() {
            var domEl;
            domEl = $compile(angular.element($templateCache.get('mightyDatepicker/pickerTemplate')))($scope);
            return $element.append(domEl);
          };
          _indexOfMoment = function(array, element, match) {
            var key, value;
            for (key in array) {
              value = array[key];
              if (element.isSame(value, match)) {
                return key;
              }
            }
            return -1;
          };
          _indexMarkers = function() {
            var marker;
            if ($scope.markers) {
              return $scope.markerIndex = (function() {
                var _i, _len, _ref, _results;
                _ref = $scope.markers;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  marker = _ref[_i];
                  _results.push(marker.day);
                }
                return _results;
              })();
            }
          };
          _withinLimits = function(day, month) {
            var withinLimits;
            withinLimits = true;
            if ($scope.before) {
              withinLimits && (withinLimits = day.isBefore($scope.before));
            }
            if ($scope.after) {
              withinLimits && (withinLimits = day.isAfter($scope.after));
            }
            return withinLimits;
          };
          _getMarker = function(day) {
            var ix;
            ix = _indexOfMoment($scope.markerIndex, day, 'day');
            if (ix > -1) {
              return $scope.markers[ix].marker;
            } else {
              return void 0;
            }
          };
          _isSelected = function(day) {
            switch ($scope.options.mode) {
              case "multiple":
                return _indexOfMoment($scope.model, day, 'day') > -1;
              case "range":
                if ($scope.model) {
                  return day.isSame($scope.model.start, 'day');
                }
                break;
              default:
                return $scope.model && day.isSame($scope.model, 'day');
            }
          };
          _isSelectedTo = function(day) {
            switch ($scope.options.mode) {
              case "range":
                if ($scope.model) {
                  return day.isSame($scope.model.end, 'day');
                }
                break;
              default:
                return false;
            }
          };
          _isInRange = function(day) {
            switch ($scope.options.mode) {
              case "multiple":
                if ($scope.options.rangeMode) {
                  if ($scope.options.rangeMode === "from") {
                    return moment.range($scope.model, $scope.before).contains(day) || day.isSame($scope.before, 'day');
                  } else {
                    return moment.range($scope.after, $scope.model).contains(day) || day.isSame($scope.after, 'day');
                  }
                } else {
                  return false;
                }
                break;
              case "range":
                if ($scope.model.start) {
                  return $scope.model.contains(day);
                } else {
                  return false;
                }
            }
          };
          _buildWeek = function(time, month) {
            var days, filter, start;
            days = [];
            filter = true;
            start = time.startOf('week');
            days = [0, 1, 2, 3, 4, 5, 6].map(function(d) {
              var day, withinLimits, withinMonth;
              day = moment(start).add(d, 'days');
              withinMonth = day.month() === month;
              withinLimits = _withinLimits(day, month);
              if ($scope.options.filter) {
                filter = $scope.options.filter(day);
              }
              return {
                date: day,
                selected: _isSelected(day) && withinMonth,
                selectedTo: _isSelectedTo(day) && withinMonth,
                inRange: _isInRange(day),
                disabled: !(withinLimits && withinMonth && filter),
                marker: withinMonth ? _getMarker(day) : void 0
              };
            });
            return days;
          };
          _buildMonth = function(time) {
            var calendarEnd, calendarStart, start, w, weeks, weeksInMonth;
            weeks = [];
            calendarStart = moment(time).startOf('month');
            calendarEnd = moment(time).endOf('month');
            weeksInMonth = 5;
            start = time.startOf('month');
            weeks = (function() {
              var _i, _results;
              _results = [];
              for (w = _i = 0; 0 <= weeksInMonth ? _i <= weeksInMonth : _i >= weeksInMonth; w = 0 <= weeksInMonth ? ++_i : --_i) {
                _results.push(_buildWeek(moment(start).add(w, 'weeks'), moment(start).month()));
              }
              return _results;
            })();
            return {
              weeks: weeks,
              name: time.format("MMMM YYYY")
            };
          };
          _setup = function() {
            var attr, dates, endOfDay, start, startOfDay, tempOptions, v, _ref;
            tempOptions = {};
            for (attr in options) {
              v = options[attr];
              tempOptions[attr] = v;
            }
            if ($scope.options) {
              _ref = $scope.options;
              for (attr in _ref) {
                v = _ref[attr];
                tempOptions[attr] = $scope.options[attr];
              }
            }
            $scope.options = tempOptions;
            switch ($scope.options.mode) {
              case "multiple":
                if ($scope.model && Array.isArray($scope.model) && $scope.model.length > 0) {
                  if ($scope.model.length === 1) {
                    start = moment($scope.model[0]);
                  } else {
                    dates = $scope.model.slice(0);
                    start = moment(dates.sort().slice(-1)[0]);
                  }
                } else {
                  $scope.model = [];
                }
                break;
              case "range":
                if ($scope.model && $scope.model.start) {
                  if ($scope.model.start.isValid()) {
                    start = $scope.model.start;
                  }
                } else {
                  startOfDay = {
                    'hour': 0,
                    'minute': 0,
                    'second': 0
                  };
                  endOfDay = {
                    'hour': 23,
                    'minute': 59,
                    'second': 59
                  };
                  $scope.model = moment.range(moment().set(startOfDay), moment().set(endOfDay));
                }
                break;
              default:
                if ($scope.model) {
                  start = moment($scope.model);
                }
            }
            $scope.options.start = $scope.options.start || start || moment().startOf('day');
            if ($scope.rangeFrom) {
              $scope.options.rangeMode = "from";
            } else if ($scope.rangeTo) {
              $scope.options.rangeMode = "to";
            }
            _indexMarkers();
            return $templateCache.put('mightyDatepicker/markerTemplate', $scope.options.markerTemplate);
          };
          _prepare = function() {
            var m;
            $scope.months = [];
            return $scope.months = (function() {
              var _i, _ref, _results;
              _results = [];
              for (m = _i = 0, _ref = $scope.options.months; 0 <= _ref ? _i < _ref : _i > _ref; m = 0 <= _ref ? ++_i : --_i) {
                _results.push(_buildMonth(moment($scope.options.start).add(m, 'months')));
              }
              return _results;
            })();
          };
          _build = function() {
            _prepare();
            return _bake();
          };
          $scope.moveMonth = function(step) {
            $scope.options.start.add(step, 'month');
            if ($scope.options.afterMoveMonth) {
              $scope.options.afterMoveMonth($scope.options.start);
            }
            _prepare();
          };
          $scope.select = function(day) {
            var endDate, endOfDay, endValid, ix, sameDay, startValid;
            if (!day.disabled) {
              switch ($scope.options.mode) {
                case "multiple":
                  if (day.selected) {
                    ix = _indexOfMoment($scope.model, day.date, 'day');
                    $scope.model.splice(ix, 1);
                  } else {
                    $scope.model.push(moment(day.date));
                  }
                  break;
                case "range":
                  startValid = $scope.model.start.isValid();
                  endValid = $scope.model.end.isValid();
                  endOfDay = {
                    'hour': 23,
                    'minute': 59,
                    'second': 59
                  };
                  sameDay = false;
                  if (startValid && endValid) {
                    sameDay = $scope.model.start.isSame($scope.model.end, 'day');
                  }
                  if ((startValid && endValid && !sameDay) || (!startValid && !endValid)) {
                    endDate = moment(day.date);
                    endDate.set(endOfDay);
                    $scope.model = moment.range(moment(day.date), endDate);
                  } else if (sameDay) {
                    if (moment(day.date).isBefore($scope.model.start, 'day') || moment(day.date).isSame($scope.model.start, 'day')) {
                      $scope.model.start = moment(day.date);
                    } else {
                      endDate = moment(day.date);
                      endDate.set(endOfDay);
                      $scope.model.end = endDate;
                    }
                  }
                  break;
                default:
                  $scope.model = day.date;
              }
              if ($scope.options.callback) {
                $scope.options.callback(day.date);
              }
              return _prepare();
            }
          };
          $scope.$watchCollection('markers', function(newMarkers, oldMarkers) {
            _indexMarkers();
            return _prepare();
          });
          _setup();
          _build();
          switch ($scope.options.mode) {
            case "multiple":
              $scope.$watchCollection('model', function(newVals, oldVals) {
                return _prepare();
              });
              break;
            case "range":
              $scope.$watch('model', function(newVal, oldVal) {
                return _prepare();
              });
              break;
            case "simple":
              $scope.$watch('model', function(newVal, oldVal) {
                if (!moment.isMoment(newVal)) {
                  newVal = moment(newVal);
                }
                if (!oldVal || oldVal && !newVal.isSame(oldVal, 'day')) {
                  $scope.model = newVal;
                  if (oldVal) {
                    $scope.options.start = moment(newVal);
                  }
                  return _prepare();
                }
              });
          }
          $scope.$watch('before', function(newVal, oldVal) {
            if (newVal) {
              if (!moment.isMoment(newVal)) {
                newVal = moment(newVal);
              }
              if (!newVal.isSame(oldVal, 'day')) {
                return _prepare();
              }
            }
          });
          return $scope.$watch('after', function(newVal, oldVal) {
            if (newVal) {
              if (!moment.isMoment(newVal)) {
                newVal = moment(newVal);
              }
              if (!newVal.isSame(oldVal, 'day')) {
                return _prepare();
              }
            }
          });
        }
      };
    }
  ]);

}).call(this);
