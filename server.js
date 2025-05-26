const express=require('express');
const dotenv=require('dotenv').config();
const port=process.env.PORT || 3300
const {db}=require('./db/db');
const cors=require('cors');


const app=express();

//middlewares
app.use(express.urlencoded());
app.use(express.json());
app.use(cors('*'));


db.connect((err) => {
    if (err) {
        console.error('SQL connection failed: ' + err);
        return;
    }
});

app.use('/api/v1/hmpc',require('./router/hmpcRouter'));

app.listen(port,()=>{
    console.log(`Server running http://localhost:${port}`)
});