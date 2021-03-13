const { app } = require('resources/js/angular-app.js');
const profiles = ['aW1hbmhkdW5ndHJhbkBnbWFpbC5jb20=', 'aW1sb2FudHJhbkBnbWFpbC5jb20='];

require('./login.scss');

(() => {
    const controller = ($scope) => {
        /**
         * init
         */
        $scope.init = () => {
            const page = sessionStorage.getItem('entryPage');
            $scope.page = `${location.origin}${page}`;
        };

        /**
         * signin
         */
        $scope.signin = (profile) => {
            if(!profiles.includes(btoa(profile.getEmail()))) {
                $scope.$apply(() => {
                    $scope.noaccess = true;
                });
            } else {
                sessionStorage.setItem('authenticated', 'true');
                sessionStorage.removeItem('entryPage');
                location.href = $scope.page;
            }
        };
    };

    controller.$inject = ['$scope'];
    app.controller('login', controller);
})();