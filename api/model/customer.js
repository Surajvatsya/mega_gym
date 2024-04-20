const mongoose = require("mongoose");
customerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  customerName: String,
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  phone: Number,
  email: String,
  password: String,
  currentBeginDate: String,
  currentFinishDate: String,
  gymId: String,
});

module.exports = mongoose.model("customer", customerSchema);
