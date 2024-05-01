const mongoose = require("mongoose");
customerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  customerName: {
    type: String,
    required: true,
  },
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  phone: {
    type: String,
    required: true,
  },
  email: String,
  password: String,
  currentBeginDate: String,
  currentFinishDate: String,
  gymId: String,
});

module.exports = mongoose.model("customer", customerSchema);
