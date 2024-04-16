const mongoose = require('mongoose');
userSchema = mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    userName:String,
    password:String,
    phone:Number,
    email:String,
    age:Number,
    gender:String,
    bloodGroup:String,
    address:String,
    currentBeginDate:Date,
    currentFinishDate:Date
})

module.exports = mongoose.model('user',userSchema);
