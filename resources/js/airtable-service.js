const { app } = require('./angular-app.js');

(() => {
    const factory = ($q, $http, DelayHttp) => {

        let service = {};

        /**
         * getData
         *
         * @param table
         * @param config
         * @param refId
         *
         * @return {*}
         */
        service.getData = (table, config, refId) => {
            let deferred = $q.defer(),
                url = `${config.url}/${table}${refId ? '/' + refId : ''}?api_key=${config.key}`,
                results = [];

            let loadURL = (url, offset) => {
                let deferred = $q.defer();

                DelayHttp({
                    url: url + (offset ? `&offset=${ offset }` : ''),
                    method: 'GET'
                }).then(
                    //success
                    response => {
                        //process records
                        let records = response.data['records'] || (response.data ? [response.data] : []);
                        records.forEach(record => {
                            let value = {refId: record.id};

                            config.tables[table].fields.forEach(field => {
                                switch(true) {
                                    case field.startsWith('date'):
                                        value[field] = service.parseDate(record.fields[field]);
                                        break;

                                    case Array.isArray(record.fields[field]):
                                        value[field] = record.fields[field][0];
                                        break;

                                    default:
                                        value[field] = record.fields[field] ? `${record.fields[field]}` : '';
                                }
                            });

                            results.push(value);
                        });

                        //process next page
                        if(response.data['offset']) {
                            loadURL(url, response.data['offset'])
                                .then(() => {
                                    deferred.resolve();
                                });
                        } else {
                            deferred.resolve();
                        }
                    },

                    //failure
                    (response) => {
                        deferred.reject(response.error);
                    }
                );

                return deferred.promise;
            };

            loadURL(url)
                .then(
                    //success
                    () => {
                        results.sort((r1, r2) => { return parseInt(r1.id) - parseInt(r2.id); });
                        deferred.resolve(results);
                    },

                    //failure
                    (error) => {
                        console.log(error);
                    }
                );

            return deferred.promise;
        };

        /**
         * createData
         *
         * @param table
         * @param config
         * @param data
         *
         * @returns {*|void}
         */
        service.createData = (table, config, data) => {
            let deferred = $q.defer();

            $http({
                url: `${config.url}/${table}?api_key=${config.key}`,
                method: 'POST',
                data: data
            })
                .then(
                    //success
                    (response) => {
                        deferred.resolve(response.data);
                    },

                    //failure
                    (response) => {
                        console.log(`Error: ${response.error}`);
                    }
                );

            return deferred.promise;
        };

        /**
         * updateData
         *
         * @param table
         * @param config
         * @param data
         * @param refId
         *
         * @returns {*|void}
         */
        service.updateData = (table, config, refId, data) => {
            let deferred = $q.defer();

            $http({
                url: `${config.url}/${table}/${refId}?api_key=${config.key}`,
                method: 'PATCH',
                data: data
            })
                .then(
                    //success
                    (response) => {
                        deferred.resolve(response.data);
                    },

                    //failure
                    (response) => {
                        console.log(`Error: ${response.error}`);
                    }
                );

            return deferred.promise;
        };

        /**
         * deleteData
         *
         * @param table
         * @param config
         * @param refId
         *
         * @returns {*|void}
         */
        service.deleteData = (table, config, refId) => {
            let deferred = $q.defer();

            $http({
                url: `${config.url}/${table}/${refId}?api_key=${config.key}`,
                method: 'DELETE'
            })
                .then(
                    //success
                    (response) => {
                        deferred.resolve(response.data);
                    },

                    //failure
                    (response) => {
                        console.log(`Error: ${response.error}`);
                    }
                );

            return deferred.promise;
        };

        /**
         * parseDate
         *
         * @param value
         *
         * @returns {Date}
         */
        service.parseDate = (value) => {
            let date = new Date(Date.parse(value));

            date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
            return date;
        };

        /**
         * sortByLocale
         *
         * @param array
         * @param property
         */
        service.sortByLocale = (array, property) => {
            array && array.sort((v1, v2) => {
                let p1 = typeof v1 === 'object' && property ? v1[property] : v1,
                    p2 = typeof v2 === 'object' && property ? v2[property] : v2;

                return p1 && p2 ? p1.localeCompare(p2) : 0;
            });
        };

        return service;

    };

    factory.$inject = ['$q', '$http', 'DelayHttp'];
    app.factory('AirtableService', factory);
})();