const mongoose = require("mongoose");
customerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  gymId: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  contact: {
    type: String,
    required: true,
  },
  email: String,
  password: String,
  currentBeginDate: String,
  currentFinishDate: String,
  gymName: String,
});

module.exports = mongoose.model("customer", customerSchema);
