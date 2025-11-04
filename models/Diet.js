import mongoose from "mongoose";

const DietProgressRecordSchema = new mongoose.Schema(
  {
    completedAt: { type: Date, required: true },
    notes: { type: String },
    currentWeightKg: { type: Number }, // O gün kaydedilen kilo
    currentBodyFatPercentage: { type: Number }, // O gün kaydedilen yağ oranı
    consumedCalories: { type: Number }, // O gün tüketilen tahmini kalori
  },
  { _id: false }
);

const DietSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, required: true }, // gün
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      required: true,
    },
    customPeriod: { type: Number },
    
    // Hedef Metrikler
    targetCalories: { type: Number }, // Günlük hedeflenen kalori miktarı
    startWeightKg: { type: Number, required: true }, // Diyete başlarken ki kilo (zorunlu)
    targetWeightKg: { type: Number }, // Hedeflenen kilo
    startBodyFatPercentage: { type: Number }, // Başlangıç yağ oranı
    targetBodyFatPercentage: { type: Number }, // Hedeflenen yağ oranı
    
    // Makro Besin Hedefleri
    macroNutrients: {
      protein: { type: Number }, // Protein hedefi
      fat: { type: Number }, // Yağ hedefi 
      carbs: { type: Number }, // Karbonhidrat hedefi
    },
    
    logCount: { type: Number, default: 0 }, // progressLog.length değeri
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    progressLog: [DietProgressRecordSchema], // completionHistory -> progressLog
  },
  { timestamps: true }
);

export default mongoose.model("Diet", DietSchema);
