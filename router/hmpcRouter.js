const express=require('express');
const { getHmpcData, getHmpcDatabyID, setHmpcDatatoSql, setHmpcTechVer, setHmpcCRMVer, getHmpcDatabySheet } = require('../controller/hmpcController');

const hmpccrmdata=express.Router();

hmpccrmdata.get('/gethmpcdata', getHmpcData);
hmpccrmdata.get('/gethmpcdatabyid/:hmpcid', getHmpcDatabyID);
hmpccrmdata.post('/sethmpcdatatosql', setHmpcDatatoSql);
hmpccrmdata.put('/sethmpctechver', setHmpcTechVer);
hmpccrmdata.put('/sethmpccrmver', setHmpcCRMVer);
hmpccrmdata.get('/gethmpcdatabysheet', getHmpcDatabySheet);

module.exports = hmpccrmdata;