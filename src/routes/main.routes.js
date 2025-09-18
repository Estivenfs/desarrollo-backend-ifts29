import { Router } from 'express';
import loginController from '../controllers/login.controller.js';

const router = Router();



router.get('/', loginController.home);


export default router;
