
import loginService from '../services/login.service.js';

async function home(req, res) {
    const nameApp = loginService.getNameApp();
    res.render('index', { nameApp });   
}

export default {
    home
}
