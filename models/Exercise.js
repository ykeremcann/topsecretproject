import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Kullanıcı gerekli"],
    },
    name: {
      type: String,
      required: [true, "Egzersiz adı gerekli"],
      trim: true,
      maxlength: [100, "Egzersiz adı en fazla 100 karakter olabilir"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
      default: "",
    },
    duration: {
      type: Number, // dakika cinsinden
      required: [true, "Egzersiz süresi gerekli"],
      min: [1, "Egzersiz süresi en az 1 dakika olmalı"],
      max: [300, "Egzersiz süresi en fazla 300 dakika olabilir"],
    },
    period: {
      type: String,
      required: [true, "Egzersiz periyodu gerekli"],
      enum: ["daily", "weekly", "monthly", "custom"],
      default: "daily",
    },
    customPeriod: {
      type: Number, // gün cinsinden (sadece period: "custom" olduğunda kullanılır)
      min: [1, "Özel periyot en az 1 gün olmalı"],
      max: [365, "Özel periyot en fazla 365 gün olabilir"],
    },
    completedCount: {
      type: Number,
      default: 0,
      min: [0, "Tamamlanan sayı negatif olamaz"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    completionHistory: [
      {
        completedAt: {
          type: Date,
          default: Date.now,
        },
        duration: {
          type: Number, // gerçekte yapılan süre (dakika)
          required: true,
        },
        notes: {
          type: String,
          maxlength: [200, "Not en fazla 200 karakter olabilir"],
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index'ler
exerciseSchema.index({ user: 1, createdAt: -1 });
exerciseSchema.index({ user: 1, isActive: 1 });

// Virtual field for completion percentage (basit tamamlama oranı)
exerciseSchema.virtual("completionPercentage").get(function () {
  return this.completedCount > 0 ? 100 : 0;
});

// Virtual field for streak (consecutive days)
exerciseSchema.virtual("streak").get(function () {
  if (this.completionHistory.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort completion history by date (most recent first)
  const sortedHistory = this.completionHistory.sort((a, b) => b.completedAt - a.completedAt);
  
  for (let i = 0; i < sortedHistory.length; i++) {
    const completionDate = new Date(sortedHistory[i].completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));
    
    if (i === 0) {
      if (daysDiff <= 1) {
        streak = 1;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    } else {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - 1);
      
      if (Math.floor((completionDate - expectedDate) / (1000 * 60 * 60 * 24)) === 0) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  return streak;
});

// Method to mark exercise as completed
exerciseSchema.methods.markCompleted = function (duration, notes) {
  this.completedCount += 1;
  this.completionHistory.push({
    completedAt: new Date(),
    duration: duration || this.duration,
    notes: notes || "",
  });
  
  return this.save();
};

// Method to get completion history for a specific period
exerciseSchema.methods.getCompletionHistory = function (startDate, endDate) {
  return this.completionHistory.filter(completion => {
    const completionDate = new Date(completion.completedAt);
    return completionDate >= startDate && completionDate <= endDate;
  });
};

// Static method to get user's active exercises
exerciseSchema.statics.getActiveExercises = function (userId) {
  return this.find({ user: userId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to get user's exercise statistics
exerciseSchema.statics.getUserStats = async function (userId) {
  const exercises = await this.find({ user: userId });
  
  const stats = {
    totalExercises: exercises.length,
    activeExercises: exercises.filter(ex => ex.isActive).length,
    totalCompletions: exercises.reduce((sum, ex) => sum + ex.completedCount, 0),
    totalDuration: exercises.reduce((sum, ex) => {
      return sum + ex.completionHistory.reduce((historySum, completion) => 
        historySum + completion.duration, 0);
    }, 0),
    longestStreak: 0,
  };
  
  // Calculate longest streak
  exercises.forEach(exercise => {
    if (exercise.streak > stats.longestStreak) {
      stats.longestStreak = exercise.streak;
    }
  });
  
  return stats;
};

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
