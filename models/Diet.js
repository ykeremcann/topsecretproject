import mongoose from "mongoose";

const DietSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Kullanıcı gerekli"],
    },
    title: {
      type: String,
      required: [true, "Yemek adı gerekli"],
      trim: true,
      maxlength: [100, "Yemek adı en fazla 100 karakter olabilir"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
      default: "",
    },
    calories: {
      type: Number,
      required: [true, "Kalori değeri gerekli"],
      min: [0, "Kalori 0'dan küçük olamaz"],
    },
    type: {
      type: String,
      required: [true, "Kalori tipi gerekli"],
      enum: ["income"], // income: alındı (+) - Diyet sadece income
      default: "income",
    },
    date: {
      type: Date,
      required: [true, "Tarih gerekli"],
      index: true,
    },
    time: {
      type: String, // "HH:MM"
    }
  },
  {
    timestamps: true,
  }
);

// Index
DietSchema.index({ user: 1, date: -1 });

export default mongoose.model("Diet", DietSchema);
