import axios from "./axios";

export const getAllDataRequest = () => axios.get("/data");

export const getAllLogs = () => axios.get("/userslog");

export const postData = (data) => axios.post('/data', data);

export const getHistory = () => axios.get("/history");

export const getAllBatteries = () => axios.get("/batteries");

export const postAllBatteries = () => axios.post("/batteries", batteries);

export const getAllXitzin2Data = () => axios.get("/xitzin2data");

export const getAllXitzin2Batteries = () => axios.get("/xitzin2batteries");

export const postAllXitzin2Batteries = () => axios.post("/xitzin2batteries", xitzin2batteries);

export const getBancoData = () => axios.get("/bancodepruebas");

export const postBancoData = (data) => axios.post("/bancodepruebas", data);