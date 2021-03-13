const gapidiv = 'gapi-signin';

const g_renderButton = () => {
    gapi.signin2.render(gapidiv, {
        // 'scope': 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send',
        width: 200,
        longtitle: true,
        theme: 'dark',
        onsuccess: g_onSuccess,
        onfailure: g_onFailure
    });
};

const g_onSuccess = (user) => {
    const profile = user.getBasicProfile();

    if (profile) {
        const scope = angular.element('#' + gapidiv).scope();
        scope && scope.signin(profile);
    }
};

const g_onFailure = (error) => {
    console.log(error);
};
