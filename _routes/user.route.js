import { signup, login, accountVerification, forgotPassword, resetPassword } from '../_controllers/user.controller.js';

export default (app) => {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
        res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
        res.header('Cache-Control', 'no-cache');
        res.header('Content-Type', 'application/json; charset=utf-8');
        next();
    });

    app.post('/api/user/signup', signup);
    app.post('/api/user/account/verification', accountVerification);
    app.post('/api/user/login', login);
    app.post('/api/user/forgot/password', forgotPassword);
    app.post('/api/user/reset/password', resetPassword);
};
