const mongoose = require("mongoose");
planSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  customerId: mongoose.Schema.Types.ObjectId,
  duration: Number,
  fee: Number,
  discount: Number,
});

module.exports = mongoose.model("plan", planSchema);
