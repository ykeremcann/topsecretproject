import Diet from "../models/Diet.js";
import { validationResult } from "express-validator";

// Tüm yemek kayıtlarını getir (Tarih bazlı)
export const getAllDiets = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = { user: userId };

    if (date) {
      // Belirli bir günün tüm kayıtları
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

    const diets = await Diet.find(query).sort({ date: -1, createdAt: -1 });

    // Günlük toplam hesaplama
    let summary = null;
    if (date || (startDate && endDate)) {
      summary = {
        totalIncome: 0, // Alınan kalori
      };

      diets.forEach(d => {
        summary.totalIncome += d.calories;
      });
    }

    res.status(200).json({
      success: true,
      data: diets,
      summary
    });
  } catch (error) {
    console.error("Diyetleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Yemek kayıtları getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Takvim Verisi Getir (Ay bazlı özet)
export const getCalendarData = async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.id;

    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Yıl ve Ay gereklidir" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const diets = await Diet.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const calendarMap = {};
    let totalMeals = 0;
    let totalCalories = 0;
    const uniqueDays = new Set();

    diets.forEach(d => {
      totalMeals++;
      totalCalories += d.calories;

      const dayKey = new Date(d.date).toISOString().split('T')[0];
      uniqueDays.add(dayKey);

      if (!calendarMap[dayKey]) {
        calendarMap[dayKey] = {
          date: dayKey,
          totalIncome: 0,
          hasActivity: true
        };
      }
      calendarMap[dayKey].totalIncome += d.calories;
    });

    // Ortalama Günlük Kalori (Sadece kayıt girilen günler üzerinden mi yoksa ay geneli mi? Ay geneli yapalım Egzersiz gibi)
    const daysInMonth = endDate.getDate();
    const averageDailyCalories = daysInMonth > 0 ? Math.round(totalCalories / daysInMonth) : 0;

    res.status(200).json({
      success: true,
      data: Object.values(calendarMap),
      stats: {
        totalMeals,
        totalCalories,
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

// Yeni yemek kaydı oluştur
export const createDiet = async (req, res) => {
  try {
    const { title, description, calories, date, time } = req.body;
    const userId = req.user.id;

    const diet = new Diet({
      user: userId,
      title,
      description,
      calories,
      type: "income", // Her zaman income
      date: date || new Date(),
      time
    });

    await diet.save();

    res.status(201).json({
      success: true,
      message: "Yemek eklendi",
      data: diet,
    });
  } catch (error) {
    console.error("Yemek ekleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Yemek eklenirken hata oluştu",
      error: error.message,
    });
  }
};

// Yemek kaydı sil
export const deleteDiet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const diet = await Diet.findOneAndDelete({ _id: id, user: userId });

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Kayıt bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Kayıt silindi",
    });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Silinirken hata oluştu",
      error: error.message,
    });
  }
};

// Eski fonksiyonları (getDietById, updateDiet, logDietProgress, getUserDietStats) kaldırıyoruz veya dummy bırakabiliriz ama temizledik.
// Router'da da bu endpointleri temizlememiz lazım.
