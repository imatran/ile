const { app } = require('resources/js/angular-app.js');
const { profiles } = require('resources/js/app-secret.js');

require('resources/js/airtable-service.js');
require('resources/js/vietngu-service.js');
require('./reportcard.scss');

(() => {
    const controller = ($scope, $q, $document, $location, $modal, service, apputil) => {
        /**
         * init
         */
        $scope.init = () => {
            $scope.dateFormat = "yy-mm-dd";
            $scope.refresh = false;
            $scope.profile = {};

            //assign user configs
            Object.assign($scope, apputil.pick(_config, 'absentChoices', 'skillChoices', 'gradeChoices', 'commentChoices'));

            //fix ui issues
            apputil.fixui();

            //handle refresh
            refresh();

            //handle login
            $scope.login();
        };

        /**
         * login
         */
        $scope.login = () => {
            let authenticated = Boolean(sessionStorage.getItem('authenticated')),
                profile = $scope.profile.email;

            if(!authenticated) {
                if(!profile) {
                    location.hash = '/login'
                } else {
                    if(profiles.includes(btoa(profile))) {
                        sessionStorage.setItem('authenticated', 'true');
                        authenticated = true;
                    } else {
                        $scope.noaccess = true;
                    }
                }
            }

            if(authenticated) {
                $scope.authenticated = true;
                loadData()
                    .then(() => {
                        location.hash = '/list';
                    });
            }
        };

        /**
         * view
         * @param oen
         */
        $scope.view = (oen) => {
            getReport(oen)
                .then(report => {
                    $scope.report = report;
                });
        };

        /**
         * edit
         * @param oen
         */
        $scope.edit = (oen) => {
            getReport(oen)
                .then(report => {
                    $scope.report = angular.copy(report);
                    $scope.saved = false;

                    $scope.$watch('report', (obj) => {
                        const savebtn = $('#save-btn')[0];
                        savebtn && (angular.equals(obj, report) ? savebtn.classList.add('disabled') : savebtn.classList.remove('disabled'));
                    }, true);

                    $document.ready(() => {
                        $('#datepicker-t1').datepicker(datepicker());
                        $('#datepicker-t2').datepicker(datepicker());
                    });
                });
        };

        /**
         * submit
         */
        $scope.submit = () => {
            const refId = $scope.report.refId;
            const promise = refId ? service.updateReport(refId, $scope.report) : service.createReport($scope.report);

            promise.then(() => {
                //update reports
                let report = $scope.reports.find(report => { return report['oen'] === $scope.report.oen; });
                if(!report) {
                    $scope.reports.push($scope.report);
                }

                //back to view
                $scope.saved = true;
                location.hash = '/view';
            });
        };

        /**
         * clearDate
         * @param time
         */
        $scope.clearDate = (time) => {
            delete $scope.report[`date_${time}`];
            delete $scope.report[`signature_${time}`];
        };

        /**
         * print
         * @param type
         */
        $scope.print = (type) => {
            const configs = {
                view: {
                    name: `${$scope.report.name} - Report Card.pdf`,
                    size: 920,
                    x: 0,
                    y: 8,
                    width: 210,
                    height: 280
                },

                participate: {
                    name: `${$scope.report.name} - Certificate of Participation.pdf`,
                    size: 1080,
                    x: 0,
                    y: 0,
                    width: 296.5,
                    height: 209.5
                },

                graduate: {
                    name: `${$scope.report.name} - Grade 8 Certificate.pdf`,
                    size: 1080,
                    x: 14,
                    y: 0,
                    width: 268,
                    height: 206
                }
            };

            const config = configs[type];
            const html2canvas = require('html2canvas');
            const jsPDF = require('jspdf');

            //scroll to top
            $('html').scrollTop(0, 0);

            //capture screen then print
            html2canvas(document.getElementById('printarea'), {
                width: config.size
            })
                .then(canvas => {
                    const img = canvas.toDataURL('image/jpeg');
                    const pdf = new jsPDF(config.height > config.width ? 'p' : 'l');

                    pdf.addImage(img, 'JPEG', config.x, config.y, config.width, config.height);
                    pdf.save(config.name);
                });
        };

        /**
         * popup
         */
        $scope.popup = () => {
            const popup = $modal.open({
                scope: $scope,
                templateUrl: 'suggests.html',
                size: 'lg',
                controller: () => {
                    $scope.cancel = () => {
                        popup.close();
                    };

                    $scope.select = (value) => {
                        console.log(value);
                    };
                }
            });
        };

        /**
         * formatOEN
         * @param oen
         * @return {string}
         */
        $scope.formatOEN = (oen) => {
            const match = (oen || '').replace(/\D/g, '').match(/^(\d{3})(\d{3})(\d*)$/);
            return match ? `${match[1]}-${match[2]}-${match[3]}` : oen;
        };


        /*****************/
        /**** private ****/
        /*****************/

        const loadData = () => {
            const deferred = $q.defer();

            $q.all([
                service.loadStudents(_config.lang),
                service.loadReports()
            ])
                .then((values) => {
                    $scope.students = values[0];
                    $scope.reports = values[1];

                    $scope.reports.forEach(report => {
                        sanitize(report);
                    });

                    deferred.resolve();
                });

            return deferred.promise;
        };

        const getReport = (oen) => {
            const deferred = $q.defer();
            const student = $scope.students.find(student => { return student['oen'] === oen; });
            let report = $scope.reports.find(report => { return report['oen'] === oen; });

            if(report) {
                service.getReport(report.refId)
                    .then(report => {
                        sanitize(report);
                        deferred.resolve(report);
                    });
            } else {
                report = { oen: student.oen, absent_1: '0' };
                sanitize(report);
                deferred.resolve(report);
            }

            return deferred.promise;
        };

        const refresh = () => {
            //handle browser refresh
            if(!$scope.report) {
                location.hash = '/login';
                history.pushState(null,  document.title, location.href);
            }

            //handle back button refresh
            window.addEventListener('hashchange', (e) => {
                if((/\/view$/).test(e.newURL) && (/\/edit$/).test(e.oldURL)) {
                    $scope.$apply(() => {
                        $scope.refresh = !$scope.saved;
                    });
                }
            });

            //refresh data
            $scope.$watch('refresh', (refresh) => {
                if(refresh) {
                    if($scope.report && $scope.report.oen) {
                        getReport($scope.report.oen)
                            .then(report => {
                                $scope.report = report;
                            });
                    } else {
                        location.hash = '/login';
                    }

                    $scope.refresh = !refresh;
                }
            });
        };

        const sanitize = (report) => {
            //sanitize signature
            !apputil.isEmpty(report['date_t1']) && (report['signature_t1'] = _config.signature);
            !apputil.isEmpty(report['date_t2']) && (report['signature_t2'] = _config.signature);

            //sanitize student name
            let student = $scope.students.find(student => { return student.oen === report.oen; });
            student && Object.assign(report, apputil.pick(student, 'name', 'grade'));

            //sanitize from configs
            Object.assign(report, apputil.pick(_config, 'lang', 'center', 'instructor'));
        };

        const datepicker = () => {
            return {
                dateFormat: $scope.dateFormat,
                onSelect: (date, field) => {
                    $scope.$apply(() => {
                        const id = field.input[0].dataset['id'];
                        $scope.report[`date_${id}`] = date;
                        $scope.report[`signature_${id}`] = _config.signature;
                    });
                }
            };
        };
    };

    controller.$inject = ['$scope', '$q', '$document', '$location', '$uibModal', 'VietNguService', 'AppUtil'];
    app.controller("reportcard", controller);
})();

(() => {
    const config = ($routeProvider, $locationProvider) => {
        const context = location.pathname.split('/')[1];

        $routeProvider.
        when('/list', {
            templateUrl: `/${context}/reportcard/list.html`
        }).
        when('/view', {
            templateUrl: `/${context}/reportcard/view.html`
        }).
        when('/edit', {
            templateUrl: `/${context}/reportcard/edit.html`
        }).
        when('/participate', {
            templateUrl: `/${context}/reportcard/participate.html`
        }).
        when('/graduate', {
            templateUrl: `/${context}/reportcard/graduate.html`
        }).
        otherwise({
            templateUrl: `/${context}/reportcard/login.html`
        });

        $locationProvider.hashPrefix('');
    };

    config.$inject = ['$routeProvider', '$locationProvider'];
    app.config(config);
})();