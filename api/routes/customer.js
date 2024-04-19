const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Customer = require('../model/customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.post('/signup',(req,res)=>{
  console.log(req.body);
  bcrypt.hash(req.body.password,10,(err,hash)=>{
    if(err)
    {
      return res.status(500).json({
        error:err
      })
    }

    else
    {
        const customer = new Customer({
        _id:new mongoose.Types.ObjectId,
        userName:req.body.userName,
        password:hash,
        email:req.body.email,
        phone:req.body.phone,
        address:req.body.address,
        age:req.body.age,
        gender:req.body.gender,
        bloodGroup:req.body.bloodGroup,
        currentBeginDate:req.body.currentBeginDate,
        currentFinishDate:req.body.currentFinishDate
      })

      customer.save()
      .then(result=>{
        res.status(200).json({
          new_customer : result
        })
      })
      .catch(err=>{
        console.log(err);
        res.status(500).json({
          error:err
        })
      })
    }
  })
})



router.post('/login',(req,res)=>{
  console.log(req.body);
  Customer.find({email:req.body.email})
  .exec()
  .then(customer=>{
    console.log("customerFromDB: " , customer);
    if(customer.length < 1)
    {
      return res.status(404).json({
        msg:'user not found'
      })
    }
    console.log("req.body.password,customer[0].password",req.body.password,customer[0].password)
    bcrypt.compare(req.body.password,customer[0].password,(err,result)=>{
      if(!result)
      {
        return res.status(401).json({
          msg:'password matching failed'
        })
      }
      if(result)
      {
        const token = jwt.sign({
          customerName:customer[0].customerName,
          email:customer[0].email,
          phone:customer[0].phone,
          userType:customer[0].userType
        },
        'this is demo user api', //second parameter is the secret key used to sign the token
        {
          expiresIn:"24h"
        }
        );
        res.status(200).json({
          customer:customer[0].customerName,
          userType:customer[0].userType,
          phone:customer[0].phone,
          email:customer[0].email,
          token:token
        })
      }
    })
  })

  .catch(err=>{
    res.status(500).json({
      error:err
    })
  })

})


module.exports = router;
