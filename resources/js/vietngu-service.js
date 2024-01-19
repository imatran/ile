const { app } = require('./angular-app.js');
const { airtable } = require('./app-secret.js');

(() => {
    const factory = ($q, $http, AirtableService, AppUtil) => {

        let service = {},
            config = {
                url: atob(airtable.url.vietngu),
                key: atob(airtable.key),
                token: airtable.token,

                tables: {
                    student: {
                        fields: [ 'oen', 'name', 'lang', 'grade', 'active' ]
                    },

                    reportcard: {
                        fields: [ 'oen', 'lang', 'absent', 'skill', 'oral', 'reading', 'writing', 'signature' ]
                    }
                }
            };

        $http.defaults.headers.common.Authorization = `Basic ${config.token}`;

        /**
         * loadStudents
         */
        service.loadStudents = (lang) => {
            let deferred = $q.defer();

            AirtableService.getData('student', config)
                .then(values => {
                    let records = values.reduce((p, v) => { v.active && v.lang === lang && p.push(v); return p; }, []);

                    AirtableService.sortByLocale(records, ['grade', 'name']);
                    deferred.resolve(records);
                });

            return deferred.promise;
        };

        /**
         * loadReports
         */
        service.loadReports = () => {
            let deferred = $q.defer(),
                results = [];

            AirtableService.getData('reportcard', config)
                .then(records => {
                    records.forEach(record => {
                        record = parseReport(record);
                        results.push(record);
                    });

                    AirtableService.sortByLocale(results, 'name');
                    deferred.resolve(results);
                });

            return deferred.promise;
        };

        /**
         * getReport
         */
        service.getReport = (refId) => {
            let deferred = $q.defer();

            AirtableService.getData('reportcard', config, refId)
                .then(records => {
                    let record = parseReport(records[0]);
                    deferred.resolve(record);
                });

            return deferred.promise;
        };

        /**
         * createReport
         */
        service.createReport = (report) => {
            let deferred = $q.defer(),
                data = {
                    fields: getPayload(report)
                };

            AirtableService.createData('reportcard', config, data)
                .then(data => {
                    report.refId = data.id;
                    deferred.resolve();
                });

            return deferred.promise;
        };

        /**
         * updateReport
         */
        service.updateReport = (refId, report) => {
            let data = {
                fields: getPayload(report)
            };

            return AirtableService.updateData('reportcard', config, refId, data);
        };

        const parseReport = (report) => {
            let absent = JSON.parse(AppUtil.isEmpty(report['absent']) ? "{}" : report['absent']),
                skill = JSON.parse(AppUtil.isEmpty(report['skill']) ? "{}" : report['skill']),
                oral = JSON.parse(AppUtil.isEmpty(report['oral']) ? "{}" : report['oral']),
                reading = JSON.parse(AppUtil.isEmpty(report['reading']) ? "{}" : report['reading']),
                writing = JSON.parse(AppUtil.isEmpty(report['writing']) ? "{}" : report['writing']),
                signature = JSON.parse(AppUtil.isEmpty(report['signature']) ? "{}" : report['signature']);

            report = AppUtil.pick(report, 'refId', 'oen', 'lang');
            Object.assign(report, AppUtil.pick(absent, 'absent_1', 'absent_2'));
            Object.assign(report, AppUtil.pick(skill, 'skill_11', 'skill_12', 'skill_21', 'skill_22', 'skill_31', 'skill_32', 'skill_41', 'skill_42'));
            Object.assign(report, AppUtil.pick(oral, 'oral_g1', 'oral_c1', 'oral_g2', 'oral_c2'));
            Object.assign(report, AppUtil.pick(reading, 'reading_g1', 'reading_c1', 'reading_g2', 'reading_c2'));
            Object.assign(report, AppUtil.pick(writing, 'writing_g1', 'writing_c1', 'writing_g2', 'writing_c2'));
            Object.assign(report, AppUtil.pick(signature, 'date_t1', 'date_t2'));

            return report;
        };

        /**
         * getPayload
         */
        const getPayload = (report) => {
            let payload = AppUtil.pick(report, 'oen', 'lang'),
                absent = AppUtil.pick(report, 'absent_1', 'absent_2'),
                skill = AppUtil.pick(report, 'skill_11', 'skill_12', 'skill_21', 'skill_22', 'skill_31', 'skill_32', 'skill_41', 'skill_42'),
                oral = AppUtil.pick(report, 'oral_g1', 'oral_c1', 'oral_g2', 'oral_c2'),
                reading = AppUtil.pick(report, 'reading_g1', 'reading_c1', 'reading_g2', 'reading_c2'),
                writing = AppUtil.pick(report, 'writing_g1', 'writing_c1', 'writing_g2', 'writing_c2'),
                signature = AppUtil.pick(report, 'date_t1', 'date_t2');

            payload.absent = JSON.stringify(absent);
            payload.skill = JSON.stringify(skill);
            payload.oral = JSON.stringify(oral);
            payload.reading = JSON.stringify(reading);
            payload.writing = JSON.stringify(writing);
            payload.signature = JSON.stringify(signature);

            return payload;
        };

        return service;

    };

    factory.$inject = ['$q', '$http', 'AirtableService', 'AppUtil'];
    app.factory('VietNguService', factory);
})();
