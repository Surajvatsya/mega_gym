const express = require('express');
const app = express();
const userRoute = require('./api/routes/user');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { urlencoded, json } = require('body-parser');
const cors = require('cors');
const dbUrl = 'mongodb+srv://surajkumar742494:J9qYedaef8h5WbSg@gym.ftaj8yk.mongodb.net/?retryWrites=true&w=majority&appName=GYM'


mongoose.connect(dbUrl);


mongoose.connection.on('error',err=>{
  console.log('connection failed');
});

mongoose.connection.on('connected',()=>{
  console.log('connected successfully with database');
});

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


app.use(cors());

app.use('/user',userRoute);


module.exports = app;
