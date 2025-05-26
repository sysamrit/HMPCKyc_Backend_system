const express=require('express');
const { getHmpcTechData, getHmpcCRMData, getHmpcDatabyID, setHmpcDatatoSql, setHmpcTechVer, setHmpcCRMVer, getHmpcDatabySheet, setDuplicateDatatoSql, getHmpcPendingData } = require('../controller/hmpcController');

const hmpccrmdata=express.Router();

hmpccrmdata.get('/gethmpctechdata', getHmpcTechData);
hmpccrmdata.get('/gethmpccrmdata', getHmpcCRMData);
hmpccrmdata.get('/gethmpcdatabyid/:hmpcid', getHmpcDatabyID);
hmpccrmdata.post('/sethmpcdatatosql', setHmpcDatatoSql);
hmpccrmdata.put('/sethmpctechver', setHmpcTechVer);
hmpccrmdata.put('/sethmpccrmver', setHmpcCRMVer);
hmpccrmdata.get('/gethmpcdatabysheet', getHmpcDatabySheet);
hmpccrmdata.post('/setduplicatedatatosql', setDuplicateDatatoSql);
hmpccrmdata.get('/gethmpcpendingdata', getHmpcPendingData);

module.exports = hmpccrmdata;