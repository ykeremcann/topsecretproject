import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Kullanıcı gerekli"],
    },
    title: {
      type: String,
      required: [true, "Aktivite başlığı gerekli"],
      trim: true,
      maxlength: [100, "Başlık en fazla 100 karakter olabilir"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
      min: [0, "Süre negatif olamaz"],
    },
    calories: {
      type: Number,
      required: [true, "Kalori değeri gerekli"],
      min: [0, "Kalori 0'dan küçük olamaz"],
    },
    type: {
      type: String,
      required: [true, "Kalori tipi gerekli"],
      enum: ["income", "expense"], // income: alındı (+), expense: verildi (-)
      default: "expense",
    },
    date: {
      type: Date,
      required: [true, "Tarih gerekli"],
      index: true, // Tarihe göre sorgulamalar için index
    },
    time: {
      type: String, // "HH:MM" formatında veya Date objesi olabilir, şimdilik basit tutalım
    }
  },
  {
    timestamps: true,
  }
);

// Index'ler
activitySchema.index({ user: 1, date: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
