import mongoose, { Schema, Document } from 'mongoose';

interface Template extends Document {
    templateDescId: [mongoose.Schema.Types.ObjectId],
    goal : string, 
    experience : string
}

const templateSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    templateDescId: [mongoose.Schema.Types.ObjectId],
    goal : String, 
    experience : String
});

const Temmplate = mongoose.model<Template>('template', templateSchema);

export default Temmplate;
