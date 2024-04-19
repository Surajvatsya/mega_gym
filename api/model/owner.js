const mongoose = require("mongoose");
ownerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  ownerName: String,
  email: String,
  password: String,
  gymName: String,
  contact: Number,
  address: String,
});

module.exports = mongoose.model("owner", ownerSchema);
