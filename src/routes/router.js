import { Router } from "express";
import { getLotesActivos } from "../controllers/LoteController.js";

const router = Router();


router.get('/', (req, res) => {
    res.redirect('/lotes');
});


router.get('/lotes', getLotesActivos);

export default router;
