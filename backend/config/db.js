import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://tengkowartiyem:tengkokelompok6@cluster0.lbwlj.mongodb.net/tengkobadog').then(()=>console.log("DB Connected"));
}