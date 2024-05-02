const mongoose = require("mongoose");
ownerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  ownerName: {
    type: String,
    required: true,
  },
  email: String,
  password: String,
  gymName: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  upiId: String,
  deviceToken : String,
});

module.exports = mongoose.model("owner", ownerSchema);
