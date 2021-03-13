const { app } = require('./angular-app.js');

(() => {
    const factory = ($http, $cookies, $rootScope) => {
        let service = {};

        service.login = (username, password, callback) => {
            $http.post('/api/authenticate', { username: username, password: password })
                .success((response) => {
                    callback(response);
                });
        };

        service.setCredentials = (username, password) => {
            let authdata = Base64.encode(username + ':' + password);

            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata
                }
            };

            // set default auth header for http requests
            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

            // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
            let cookieExp = new Date();
            cookieExp.setDate(cookieExp.getDate() + 7);
            $cookies.putObject('globals', $rootScope.globals, { expires: cookieExp });
        };

        service.clearCredentials = () => {
            $rootScope.globals = {};
            $cookies.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic';
        };

        return service;
    };

    factory.$inject = ['$http', '$cookies', '$rootScope'];
    app.factory('LoginService', factory);
})();

(() => {
    const factory = ($http, $cookies, $rootScope, $timeout, UserService) => {
        let service = {};

        service.login = (username, password, callback) => {
            /**
             * dummy authentication for testing, uses $timeout to simulate api call
             */
            $timeout(() => {
                let response;
                UserService.getByUsername(username)
                    .then(user => {
                        if(user !== null && user.password === password) {
                            response = { success: true };
                        } else {
                            response = { success: false, message: 'Username or password is incorrect!' };
                        }
                        callback(response);
                    });
            }, 1000);
        };

        service.setCredentials = (username, password) => {
            let authdata = Base64.encode(username + ':' + password);

            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata
                }
            };

            // set default auth header for http requests
            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

            // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
            let cookieExp = new Date();
            cookieExp.setDate(cookieExp.getDate() + 7);
            $cookies.putObject('globals', $rootScope.globals, { expires: cookieExp });
        };

        service.clearCredentials = () => {
            $rootScope.globals = {};
            $cookies.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic';
        };

        return service;
    };

    factory.$inject = ['$http', '$cookies', '$rootScope', '$timeout', 'MockUserService'];
    app.factory('MockLoginService', factory);
})();

(() => {
    const factory = ($http) => {
        let service = {};

        service.getAll = () => {
            return $http.get('/api/users').then(handleSuccess, handleError('Error getting all users'));
        };

        service.getById = (id) => {
            return $http.get('/api/users/' + id).then(handleSuccess, handleError('Error getting user by id'));
        };

        service.getByUsername = (username) => {
            return $http.get('/api/users/' + username).then(handleSuccess, handleError('Error getting user by username'));
        };

        service.create = (user) => {
            return $http.post('/api/users', user).then(handleSuccess, handleError('Error creating user'));
        };

        service.update = (user) => {
            return $http.put('/api/users/' + user.id, user).then(handleSuccess, handleError('Error updating user'));
        };

        service.delete = (id) => {
            return $http.delete('/api/users/' + id).then(handleSuccess, handleError('Error deleting user'));
        };

        const handleSuccess = (response) => {
            return response.data;
        };

        const handleError = (error) => {
            return () => {
                return { success: false, message: error };
            };
        };

        return service;
    };

    factory.$inject = ['$http'];
    app.factory('UserService', factory);
})();

(() => {
    const factory = ($timeout, $filter, $q) => {

        let service = {};

        service.getAll = () => {
            let deferred = $q.defer();

            deferred.resolve(getUsers());
            return deferred.promise;
        };

        service.getById = (id) => {
            let deferred = $q.defer(),
                filtered = $filter('filter')(getUsers(), { id: id }),
                user = filtered.length ? filtered[0] : null;

            deferred.resolve(user);
            return deferred.promise;
        };

        service.getByUsername = (username) => {
            let deferred = $q.defer(),
                filtered = $filter('filter')(getUsers(), { username: username }),
                user = filtered.length ? filtered[0] : null;

            deferred.resolve(user);
            return deferred.promise;
        };

        service.create = (user) => {
            let deferred = $q.defer();

            // simulate api call with $timeout
            $timeout(() => {
                service.getByUsername(user.username)
                    .then((duplicateUser) => {
                        if(duplicateUser !== null) {
                            deferred.resolve({ success: false, message: 'Username "' + user.username + '" is already taken' });
                        } else {
                            let users = getUsers(),
                                lastUser = users[users.length - 1] || { id: 0 };

                            user.id = lastUser.id + 1;
                            users.push(user);
                            setUsers(users);

                            deferred.resolve({ success: true });
                        }
                    });
            }, 1000);

            return deferred.promise;
        };

        service.update = (user) => {
            let deferred = $q.defer(),
                users = getUsers();

            for (let i = 0; i < users.length; i++) {
                if (users[i].id === user.id) {
                    users[i] = user;
                    break;
                }
            }

            setUsers(users);
            deferred.resolve();

            return deferred.promise;
        };

        service.delete = (id) => {
            let deferred = $q.defer(),
                users = getUsers();

            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                if (user.id === id) {
                    users.splice(i, 1);
                    break;
                }
            }

            setUsers(users);
            deferred.resolve();

            return deferred.promise;
        };

        const getUsers = () => {
            if(!localStorage.users){
                localStorage.users = JSON.stringify([]);
            }

            return JSON.parse(localStorage.users);
        };

        const setUsers = (users) => {
            localStorage.users = JSON.stringify(users);
        };

        return service;
    };

    factory.$inject = ['$timeout', '$filter', '$q'];
    app.factory('MockUserService', factory);
})();