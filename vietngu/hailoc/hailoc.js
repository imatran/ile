const app = angular.module("hailoc", []);

(() => {
    const controller = ($scope) => {

        /**
         * init
         */
        $scope.init = () => {
            $scope.next();
        };

        $scope.next = () => {
            let total = 39,
                number = Math.floor(Math.random() * Math.floor(total)) + 1;

            $scope.image = number < 10 ? `00${number}` : number < 100 ? `0${number}` : `${number}`;
            console.log($scope.image);
        }

    };

    controller.$inject = ['$scope'];
    app.controller("hailoc", controller);
})();