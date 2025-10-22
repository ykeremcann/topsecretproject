import Exercise from "../models/Exercise.js";
import { validationResult } from "express-validator";

// Tüm egzersizleri getir
export const getAllExercises = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const userId = req.user.id;
    const query = { user: userId };

    // Filtreleme
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Sayfalama
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sıralama
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const exercises = await Exercise.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("user", "firstName lastName email");

    const total = await Exercise.countDocuments(query);

    res.status(200).json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Egzersizleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersizler getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Tek egzersiz getir
export const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.findOne({ _id: id, user: userId })
      .populate("user", "firstName lastName email");

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error("Egzersiz getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Yeni egzersiz oluştur
export const createExercise = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validasyon hatası",
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      duration,
      period,
      customPeriod,
    } = req.body;

    const userId = req.user.id;

    // Özel periyot kontrolü
    if (period === "custom" && !customPeriod) {
      return res.status(400).json({
        success: false,
        message: "Özel periyot seçildiğinde customPeriod alanı gerekli",
      });
    }

    const exerciseData = {
      user: userId,
      name,
      description,
      duration,
      period,
    };

    if (period === "custom") {
      exerciseData.customPeriod = customPeriod;
    }

    const exercise = new Exercise(exerciseData);
    await exercise.save();

    await exercise.populate("user", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Egzersiz başarıyla oluşturuldu",
      data: exercise,
    });
  } catch (error) {
    console.error("Egzersiz oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz oluşturulurken hata oluştu",
      error: error.message,
    });
  }
};

// Egzersiz güncelle
export const updateExercise = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validasyon hatası",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Özel periyot kontrolü
    if (updateData.period === "custom" && !updateData.customPeriod) {
      return res.status(400).json({
        success: false,
        message: "Özel periyot seçildiğinde customPeriod alanı gerekli",
      });
    }

    const exercise = await Exercise.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName email");

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Egzersiz başarıyla güncellendi",
      data: exercise,
    });
  } catch (error) {
    console.error("Egzersiz güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz güncellenirken hata oluştu",
      error: error.message,
    });
  }
};

// Egzersiz sil
export const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.findOneAndDelete({ _id: id, user: userId });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Egzersiz başarıyla silindi",
    });
  } catch (error) {
    console.error("Egzersiz silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz silinirken hata oluştu",
      error: error.message,
    });
  }
};

// Egzersizi tamamla
export const completeExercise = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validasyon hatası",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { duration, notes } = req.body;
    const userId = req.user.id;

    const exercise = await Exercise.findOne({ _id: id, user: userId });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    if (!exercise.isActive) {
      return res.status(400).json({
        success: false,
        message: "Bu egzersiz aktif değil",
      });
    }

    await exercise.markCompleted(duration, notes);

    res.status(200).json({
      success: true,
      message: "Egzersiz başarıyla tamamlandı",
      data: exercise,
    });
  } catch (error) {
    console.error("Egzersiz tamamlama hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz tamamlanırken hata oluştu",
      error: error.message,
    });
  }
};

// Egzersiz durumunu değiştir (aktif/pasif)
export const toggleExerciseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exercise = await Exercise.findOne({ _id: id, user: userId });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    exercise.isActive = !exercise.isActive;
    await exercise.save();

    res.status(200).json({
      success: true,
      message: `Egzersiz ${exercise.isActive ? "aktif" : "pasif"} hale getirildi`,
      data: exercise,
    });
  } catch (error) {
    console.error("Egzersiz durumu değiştirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz durumu değiştirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Kullanıcı istatistiklerini getir
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Exercise.getUserStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("İstatistik getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "İstatistikler getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Aktif egzersizleri getir
export const getActiveExercises = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'daily' } = req.query; // daily, weekly, monthly, custom

    let query = { user: userId, isActive: true };
    
    // Periyot filtresi ekle
    if (period) {
      query.period = period;
    }

    const exercises = await Exercise.find(query).sort({ createdAt: -1 });

    // Tarih aralığını period'a göre belirle
    const now = new Date();
    let startDate, endDate, periodLabel;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Günlük';
        break;
      
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Bu haftanın başlangıcı (Pazar)
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Haftalık';
        break;
      
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Aylık';
        break;
      
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Günlük';
    }

    const periodData = {
      period: period,
      periodLabel: periodLabel,
      startDate: startDate,
      endDate: endDate,
      totalExercises: 0,
      completedExercises: 0,
      totalDuration: 0,
      exercises: [],
    };

    for (const exercise of exercises) {
      const periodCompletions = exercise.completionHistory.filter(completion => {
        const completionDate = new Date(completion.completedAt);
        return completionDate >= startDate && completionDate <= endDate;
      });

      periodData.totalExercises++;
      
      if (periodCompletions.length > 0) {
        periodData.completedExercises++;
        periodData.totalDuration += periodCompletions.reduce(
          (sum, completion) => sum + completion.duration,
          0
        );
      }

      periodData.exercises.push({
        _id: exercise._id,
        name: exercise.name,
        targetDuration: exercise.duration,
        completedDuration: periodCompletions.reduce(
          (sum, completion) => sum + completion.duration,
          0
        ),
        completions: periodCompletions.length,
        isCompleted: periodCompletions.length > 0,
      });
    }

    res.status(200).json({
      success: true,
      data: periodData,
    });
  } catch (error) {
    console.error("Aktif egzersizleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Aktif egzersizler getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Egzersiz tamamlama geçmişini getir
export const getExerciseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const exercise = await Exercise.findOne({ _id: id, user: userId });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Egzersiz bulunamadı",
      });
    }

    let history = exercise.completionHistory;

    // Tarih filtresi varsa uygula
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      history = exercise.getCompletionHistory(start, end);
    }

    // Tarihe göre sırala (en yeni önce)
    history.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.status(200).json({
      success: true,
      data: {
        exercise: {
          _id: exercise._id,
          name: exercise.name,
        },
        history,
        totalCompletions: history.length,
      },
    });
  } catch (error) {
    console.error("Egzersiz geçmişi getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Egzersiz geçmişi getirilirken hata oluştu",
      error: error.message,
    });
  }
};


// Günlük egzersiz özeti
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // O gün tamamlanan egzersizleri bul
    const exercises = await Exercise.find({ user: userId });

    const dailyData = {
      date: targetDate,
      totalExercises: 0,
      completedExercises: 0,
      totalDuration: 0,
      exercises: [],
    };

    for (const exercise of exercises) {
      const dayCompletions = exercise.completionHistory.filter(completion => {
        const completionDate = new Date(completion.completedAt);
        return completionDate >= startOfDay && completionDate <= endOfDay;
      });

      if (exercise.isActive) {
        dailyData.totalExercises++;
        
        if (dayCompletions.length > 0) {
          dailyData.completedExercises++;
          dailyData.totalDuration += dayCompletions.reduce(
            (sum, completion) => sum + completion.duration,
            0
          );
        }

        dailyData.exercises.push({
          _id: exercise._id,
          name: exercise.name,
          targetDuration: exercise.duration,
          completedDuration: dayCompletions.reduce(
            (sum, completion) => sum + completion.duration,
            0
          ),
          completions: dayCompletions.length,
          isCompleted: dayCompletions.length > 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    console.error("Günlük özet getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Günlük özet getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Takvim verilerini getir
export const getCalendarData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    // Aktif egzersizleri getir
    const exercises = await Exercise.find({ 
      user: userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    // Tarih aralığını period'a göre belirle
    const now = new Date();
    let startDate, endDate, periodLabel;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Günlük';
        break;
      
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Bu haftanın başlangıcı (Pazar)
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Haftalık';
        break;
      
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Aylık';
        break;
      
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = 'Günlük';
    }

    // Tarih bazlı veri yapısı oluştur
    const calendarData = {};
    const totalExercises = exercises.length;

    // Her egzersiz için completion'ları kontrol et
    for (const exercise of exercises) {
      const periodCompletions = exercise.completionHistory.filter(completion => {
        const completionDate = new Date(completion.completedAt);
        return completionDate >= startDate && completionDate <= endDate;
      });

      // Her completion tarihini işle
      periodCompletions.forEach(completion => {
        const completionDate = new Date(completion.completedAt);
        const dateKey = completionDate.toISOString().split('T')[0]; // YYYY-MM-DD formatı

        if (!calendarData[dateKey]) {
          calendarData[dateKey] = {
            date: dateKey,
            totalExercises: totalExercises,
            completedExercises: 0,
            partialExercises: 0,
            status: 'failed', // Varsayılan durum
            exercises: []
          };
        }

        // Egzersiz tamamlama durumunu hesapla
        const completedDuration = completion.duration;
        const targetDuration = exercise.duration;
        const completionPercentage = (completedDuration / targetDuration) * 100;

        // Egzersiz durumunu belirle
        let exerciseStatus;
        if (completionPercentage >= 100) {
          exerciseStatus = 'success';
        } else if (completionPercentage >= 50) {
          exerciseStatus = 'partial';
        } else {
          exerciseStatus = 'failed';
        }

        // Sadece success ve partial durumlarını ekle
        if (exerciseStatus === 'success' || exerciseStatus === 'partial') {
          const existingExercise = calendarData[dateKey].exercises.find(
            ex => ex.exerciseId === exercise._id.toString()
          );

          if (!existingExercise) {
            calendarData[dateKey].exercises.push({
              exerciseId: exercise._id,
              name: exercise.name,
              targetDuration: targetDuration,
              completedDuration: completedDuration,
              completionPercentage: Math.round(completionPercentage),
              status: exerciseStatus
            });

            if (exerciseStatus === 'success') {
              calendarData[dateKey].completedExercises++;
            } else if (exerciseStatus === 'partial') {
              calendarData[dateKey].partialExercises++;
            }
          }
        }
      });
    }

    // Her tarih için genel durumu hesapla
    Object.keys(calendarData).forEach(dateKey => {
      const dayData = calendarData[dateKey];
      
      if (dayData.completedExercises === totalExercises) {
        dayData.status = 'success';
      } else if (dayData.completedExercises > 0 || dayData.partialExercises > 0) {
        dayData.status = 'partial';
      } else {
        dayData.status = 'failed';
      }
    });

    // Sadece success ve partial durumlarındaki tarihleri döndür
    const filteredCalendarData = Object.values(calendarData).filter(
      dayData => dayData.status === 'success' || dayData.status === 'partial'
    );

    res.status(200).json({
      success: true,
      data: {
        period: period,
        periodLabel: periodLabel,
        startDate: startDate,
        endDate: endDate,
        totalDays: filteredCalendarData.length,
        calendarData: filteredCalendarData
      }
    });
  } catch (error) {
    console.error("Takvim verilerini getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takvim verileri getirilirken hata oluştu",
      error: error.message,
    });
  }
};
