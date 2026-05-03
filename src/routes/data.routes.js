import Router from "express-promise-router";
import { getAllData, getAllBatteries, getAllXitzin2Batteries, getAllXitzin2Data, postXitzin2Data, updateXitzin2Batteries, updateBatteries, postBancoData, 
    getBancoData, ignicion, getignicion, postLaniakeaData, getLaniakeaData } from "../controllers/data.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { postData } from "../controllers/data.controller.js"

const router = Router();

//AKBAL-II

router.get("/data", getAllData);

router.post("/data", postData);

router.get("/batteries", getAllBatteries);

router.post("/batteries", updateBatteries);

//XITZIN-II

router.get("/xitzin2data", getAllXitzin2Data);

router.post("/xitzin2data", postXitzin2Data);

router.get("/xitzin2batteries", getAllXitzin2Batteries);

router.post("/xitzin2batteries", updateXitzin2Batteries);

//BANCO DE PRUEBAS

router.get("/bancodepruebas", getBancoData);

router.post("/bancodepruebas", postBancoData);

router.post("/ignicion", ignicion);

router.get("/ignicion", getignicion);

//LANIAKEA

router.get("/laniakea", getLaniakeaData);

router.post("/laniakea", postLaniakeaData);

// OPERACIONES HÍBRIDAS



export default router;