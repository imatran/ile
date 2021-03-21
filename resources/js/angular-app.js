const angular = require('angular');

require('angular-route');
require('angular-sanitize');
require('angular-ui-bootstrap');
require('jquery-ui/ui/widgets/datepicker');
require('jquery-ui/themes/base/theme.css');
require('jquery-ui/themes/base/datepicker.css');
require('bootstrap');
require('bootstrap/dist/css/bootstrap.css');
require('ui-select');
require('ui-select/dist/select.css');
require('resources/css/angular-app.scss');

const app = angular.module('angular-app', ['ui.bootstrap', 'ui.select', 'ngSanitize', 'ngRoute']);
module.exports = { app: app };

(() => {
    const directive = ($http) => {
        return {
            restrict: 'A',

            link: (scope, element) => {
                scope.isLoading = () => {
                    return $http.pendingRequests.length > 0;
                };

                scope.$watch(scope.isLoading, (value) => {
                    value ? element.removeClass('ng-hide') : element.addClass('ng-hide');
                });
            }
        };
    };

    directive.$inject = ['$http'];
    app.directive('loading', directive);
})();

(() => {
    const directive = ($window, $document) => {
        const scrolltop = () => {
            //scroll to top
            $('html').scrollTop(0, 0);
        };

        return {
            restrict: 'A',

            link: () => {
                $document.ready(() => {
                    scrolltop();
                });

                $window.addEventListener('hashchange', () => {
                    scrolltop();
                });
            }
        };
    };

    directive.$inject = ['$window', '$document'];
    app.directive('scrolltop', directive);
})();

(() => {
    const factory = () => {
        let util = {};

        /**
         * isEmpty
         *
         * @param str
         * @return {boolean}
         */
        util.isEmpty = (str) => {
            return str !== 0 && !Boolean(str);
        };

        /**
         * pick
         *
         * @param obj
         * @param keys
         */
        util.pick = (obj, ...keys) => {
            return keys.reduce((o, k) => (!util.isEmpty(obj[k]) && (o[k] = obj[k]), o), {});
        };

        /**
         * Fixes ui-select on clicking the caret to
         */
        util.fixui = () => {
            //fix for clicking the caret on ui-select
            $("body").on('click', '.ui-select-toggle>i.caret', (e) => {
                e.stopPropagation();

                let parent = $(e.target).parent('.ui-select-toggle');
                parent && parent.click();
            });
        };

        return util;
    };

    app.factory('AppUtil', factory);
})();

(() => {
    const factory = ($http, $q) => {
        let promise = $q.resolve();

        return (conf) => {
            let next = () => {
                return $http(conf);
            };

            return promise = promise.then(next);
        };
    };

    factory.$inject = ['$http', '$q'];
    app.factory('QueueHttp', factory);
})();

(() => {
    const factory = ($http, $timeout) => {
        let counter = 0;

        return (conf, delay) => {
            counter += 1;

            return $timeout(() => {
                counter -= 1;
                return $http(conf);
            }, counter * delay);
        };
    };

    factory.$inject = ['$http', '$timeout'];
    app.factory('DelayHttp', factory);
})();

(() => {
    const filter = () => {
        return (input, total) => {
            total = parseInt(total);

            for (let i = 0; i < total; i++) {
                input.push(i);
            }

            return input;
        };
    };

    app.filter('range', filter);
})();

(() => {
    const directive = ($document) => {
        return {
            restrict: 'AC',
            link: (scope, el) => {
                let startX = 0, startY = 0, x = 0, y = 0,
                    dialog = el.parent();

                dialog.css({
                    position: 'relative'
                });

                dialog.on('mousedown', (e) => {
                    // Prevent default dragging of selected content
                    e.preventDefault();
                    startX = e.pageX - x;
                    startY = e.pageY - y;
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                const mousemove = (e) => {
                    y = e.pageY - startY;
                    x = e.pageX - startX;
                    dialog.css({
                        top: y + 'px',
                        left: x + 'px'
                    });
                };

                const mouseup = () => {
                    $document.unbind('mousemove', mousemove);
                    $document.unbind('mouseup', mouseup);
                }
            }
        };
    };

    directive.$inject = ['$document'];
    app.directive('movableModal', directive);
})();
