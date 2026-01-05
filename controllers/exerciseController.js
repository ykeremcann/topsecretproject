import Activity from "../models/Exercise.js"; // Model ismi dosya adıyla aynı kaldı import sorunları olmasın diye
import { validationResult } from "express-validator";

// Tüm aktiviteleri getir (Tarih bazlı filtreleme ile)
export const getActivities = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = { user: userId };

    if (date) {
      // Belirli bir günün tüm kayıtları (00:00 - 23:59)
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      query.date = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate && endDate) {
      // Tarih aralığı
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const activities = await Activity.find(query).sort({ date: -1, createdAt: -1 });

    // Günlük özet hesaplama (Eğer tek gün seçildiyse)
    let summary = null;
    if (date || (startDate && endDate)) {
      summary = {
        totalIncome: 0,
        totalExpense: 0,
        net: 0
      };

      activities.forEach(act => {
        if (act.type === 'income') {
          summary.totalIncome += act.calories;
          summary.net += act.calories;
        } else {
          summary.totalExpense += act.calories;
          summary.net -= act.calories;
        }
      });
    }

    res.status(200).json({
      success: true,
      data: activities,
      summary
    });
  } catch (error) {
    console.error("Aktiviteleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Aktiviteler getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Takvim Verisi Getir (Ay bazlı özet)
export const getCalendarData = async (req, res) => {
  try {
    const { year, month } = req.query; // year: 2026, month: 1 (Ocak)
    const userId = req.user.id;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Yıl ve Ay gereklidir" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Ayın son günü

    const activities = await Activity.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Gün bazlı gruplama ve İstatistik Hesaplama
    const calendarMap = {};
    let totalExercises = 0;
    let totalDuration = 0;
    let totalCalories = 0;
    const uniqueDays = new Set();

    activities.forEach(act => {
      // Stats
      totalExercises++;
      totalDuration += (act.duration || 0);

      // Sadece expense/egzersiz tipindekileri topluyoruz (zaten hepsi öyle olmalı ama emin olalım)
      if (act.type === 'expense') {
        totalCalories += act.calories;
      }

      const dayKey = new Date(act.date).toISOString().split('T')[0]; // YYYY-MM-DD
      uniqueDays.add(dayKey);

      if (!calendarMap[dayKey]) {
        calendarMap[dayKey] = {
          date: dayKey,
          totalIncome: 0,
          totalExpense: 0,
          net: 0,
          hasActivity: true
        };
      }

      if (act.type === 'income') {
        calendarMap[dayKey].totalIncome += act.calories;
        calendarMap[dayKey].net += act.calories;
      } else {
        calendarMap[dayKey].totalExpense += act.calories;
        calendarMap[dayKey].net -= act.calories;
      }
    });

    // En Uzun Streak Hesaplama
    const sortedDays = Array.from(uniqueDays).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate = null;

    for (const dayStr of sortedDays) {
      const currentDate = new Date(dayStr);
      if (prevDate) {
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      prevDate = currentDate;
    }

    // Ortalama Günlük Kalori (Ayın gün sayısına böl)
    const daysInMonth = endDate.getDate(); // Ayın son günü = gün sayısı
    const averageDailyCalories = daysInMonth > 0 ? Math.round(totalCalories / daysInMonth) : 0;

    res.status(200).json({
      success: true,
      data: Object.values(calendarMap),
      stats: {
        totalExercises,
        totalDuration,
        longestStreak,
        averageDailyCalories
      }
    });

  } catch (error) {
    console.error("Takvim verisi hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takvim verisi alınamadı",
      error: error.message
    });
  }
};

// Yeni aktivite oluştur
export const createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validasyon hatası",
        errors: errors.array(),
      });
    }

    const { title, description, calories, duration, type, date, time } = req.body;
    const userId = req.user.id;

    const activity = new Activity({
      user: userId,
      title,
      description,
      calories,
      duration,
      type,
      date: date || new Date(),
      time
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: "Aktivite oluşturuldu",
      data: activity,
    });
  } catch (error) {
    console.error("Aktivite oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Aktivite oluşturulurken hata oluştu",
      error: error.message,
    });
  }
};

// Aktivite güncelle
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const activity = await Activity.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Aktivite bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Aktivite güncellendi",
      data: activity,
    });
  } catch (error) {
    console.error("Aktivite güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Aktivite güncellenirken hata oluştu",
      error: error.message,
    });
  }
};

// Aktivite sil
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const activity = await Activity.findOneAndDelete({ _id: id, user: userId });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Aktivite bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Aktivite silindi",
    });
  } catch (error) {
    console.error("Aktivite silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Aktivite silinirken hata oluştu",
      error: error.message,
    });
  }
};
