const express=require('express');
const { getHmpcData, getHmpcDatabyID, setHmpcDatatoSql, setHmpcTechVer, setHmpcCRMVer, getHmpcDatabySheet, setDuplicateDatatoSql } = require('../controller/hmpcController');

const hmpccrmdata=express.Router();

hmpccrmdata.get('/gethmpcdata', getHmpcData);
hmpccrmdata.get('/gethmpcdatabyid/:hmpcid', getHmpcDatabyID);
hmpccrmdata.post('/sethmpcdatatosql', setHmpcDatatoSql);
hmpccrmdata.put('/sethmpctechver', setHmpcTechVer);
hmpccrmdata.put('/sethmpccrmver', setHmpcCRMVer);
hmpccrmdata.get('/gethmpcdatabysheet', getHmpcDatabySheet);
hmpccrmdata.post('/setduplicatedatatosql', setDuplicateDatatoSql);

module.exports = hmpccrmdata;