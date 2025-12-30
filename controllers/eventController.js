import Event from "../models/Event.js";
import User from "../models/User.js";

// Etkinlik oluştur
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      instructor,
      instructorTitle,
      date,
      endDate,
      location,
      locationAddress,
      maxParticipants,
      price,
      isOnline,
      organizer,
      organizerType,
      tags,
      requirements,

      image,
      isExternal,
    } = req.body;

    // Eğer doktor ise onay durumunu kontrol et
    if (req.user.role === "doctor") {
      const user = await User.findById(req.user._id).select("doctorInfo");
      if (!user.doctorInfo || user.doctorInfo.approvalStatus !== "approved") {
        return res.status(403).json({
          message: "Etkinlik oluşturmak için doktor onayınız gerekli",
          approvalStatus: user.doctorInfo?.approvalStatus || "pending",
        });
      }
    }

    const event = new Event({
      title,
      description,
      category,
      instructor,
      instructorTitle,
      date: new Date(date),
      endDate: new Date(endDate),
      location,
      locationAddress,
      maxParticipants,
      price: price || 0,
      isOnline: isOnline || false,
      organizer,
      organizerType,
      tags: tags || [],
      requirements,
      image: image || "",
      authorId: req.user._id,

      status: req.user.role === "admin" && isExternal ? "active" : "pending", // Admin dışarıdan ekliyorsa direkt aktif yapabilir
      isExternal: req.user.role === "admin" ? (isExternal || false) : false,
    });

    await event.save();

    // Author bilgilerini populate et
    await event.populate("authorId", "username firstName lastName profilePicture");

    res.status(201).json({
      message: "Etkinlik başarıyla oluşturuldu",
      event,
    });
  } catch (error) {
    console.error("Etkinlik oluşturma hatası:", error);
    res.status(500).json({
      message: "Etkinlik oluşturulurken hata oluştu",
      error: error.message,
    });
  }
};

// Tüm etkinlikleri getir
export const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, status, isOnline, isExternal, sortBy, sortOrder, search } = req.query;

    let query = { status: { $in: ["active", "full"] } }; // Sadece aktif etkinlikler

    // if admin and query has status=all then show all status events



    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Durum filtresi
    if (status) {
      query.status = status;
    }
    if (req.user && req.user.role === "admin" && status === "all") {
      query.status = { $in: ["pending", "active", "full", "completed", "cancelled", "rejected"] };
    }
    // Online/Offline filtresi
    if (isOnline !== undefined) {
      query.isOnline = isOnline === "true";
    }

    // Harici/Dahili filtresi
    if (isExternal !== undefined) {
      query.isExternal = isExternal === "true";
    }

    // Arama filtresi
    if (search) {
      query.$text = { $search: search };
    }

    // Sıralama
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sort = { date: 1 }; // Varsayılan olarak tarihe göre sırala
    }

    const events = await Event.find(query)
      .populate("authorId", "username firstName lastName profilePicture")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Kullanıcı giriş yapmışsa kayıt durumunu kontrol et ve response'a ekle
    const eventsWithRegistration = events.map(event => {
      const eventObj = event.toObject();
      if (req.user) {
        eventObj.isRegistered = event.isUserRegistered(req.user._id);
        eventObj.isOwner = event.authorId._id.toString() === req.user._id.toString();
      } else {
        eventObj.isRegistered = false;
        eventObj.isOwner = false;
      }
      return eventObj;
    });

    const total = await Event.countDocuments(query);

    res.json({
      events: eventsWithRegistration,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Etkinlikleri getirme hatası:", error);
    res.status(500).json({
      message: "Etkinlikler alınırken hata oluştu",
    });
  }
};

// Etkinlik arama
export const searchEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { q, category, location, isOnline, dateFrom, dateTo } = req.query;

    let query = { status: { $in: ["active", "full"] } };

    // Metin arama
    if (q) {
      query.$text = { $search: q };
    }

    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Lokasyon filtresi
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Online/Offline filtresi
    if (isOnline !== undefined) {
      query.isOnline = isOnline === "true";
    }

    // Tarih aralığı filtresi
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const events = await Event.find(query)
      .populate("authorId", "username firstName lastName profilePicture")
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    // Kullanıcı giriş yapmışsa kayıt durumunu kontrol et ve response'a ekle
    const eventsWithRegistration = events.map(event => {
      const eventObj = event.toObject();
      if (req.user) {
        eventObj.isRegistered = event.isUserRegistered(req.user._id);
        eventObj.isOwner = event.authorId._id.toString() === req.user._id.toString();
      } else {
        eventObj.isRegistered = false;
        eventObj.isOwner = false;
      }
      return eventObj;
    });

    const total = await Event.countDocuments(query);

    res.json({
      events: eventsWithRegistration,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Etkinlik arama hatası:", error);
    res.status(500).json({
      message: "Etkinlik arama sırasında hata oluştu",
    });
  }
};

// Etkinlik istatistikleri (Admin)
export const getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: "active" });
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const completedEvents = await Event.countDocuments({ status: "completed" });

    // Kategori istatistikleri
    const categoryStats = await Event.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalParticipants: { $sum: "$currentParticipants" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Organizatör tipi istatistikleri
    const organizerStats = await Event.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      {
        $group: {
          _id: "$organizerType",
          count: { $sum: 1 },
          totalParticipants: { $sum: "$currentParticipants" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Toplam katılımcı sayısı
    const totalParticipantsResult = await Event.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$currentParticipants" } } },
    ]);

    const totalParticipants = totalParticipantsResult[0]?.total || 0;
    const averageParticipants = totalEvents > 0 ? totalParticipants / totalEvents : 0;

    res.json({
      stats: {
        totalEvents,
        activeEvents,
        pendingEvents,
        completedEvents,
        totalParticipants,
        averageParticipants: Math.round(averageParticipants * 100) / 100,
        categoryStats,
        organizerStats,
      },
    });
  } catch (error) {
    console.error("Etkinlik istatistikleri hatası:", error);
    res.status(500).json({
      message: "Etkinlik istatistikleri alınırken hata oluştu",
    });
  }
};

// Kullanıcının etkinlikleri
export const getUserEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type, status } = req.query;

    let query = {};
    let events = [];

    if (type === "created") {
      // Kullanıcının oluşturduğu etkinlikler
      query = { authorId: req.user._id };
      if (status) {
        query.status = status;
      }

      events = await Event.find(query)
        .populate("authorId", "username firstName lastName profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Event.countDocuments(query);

      return res.json({
        events: events.map(event => ({
          ...event.toObject(),
          type: "created",
          isRegistered: event.isUserRegistered(req.user._id),
          isOwner: true, // Kullanıcının oluşturduğu event'ler
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } else {
      // Kullanıcının kayıt olduğu etkinlikler
      query = {
        "participants.user": req.user._id,
        "participants.status": "confirmed",
      };

      events = await Event.find(query)
        .populate("authorId", "username firstName lastName profilePicture")
        .sort({ "participants.registrationDate": -1 })
        .skip(skip)
        .limit(limit);

      // Registration bilgilerini ekle
      events = events.map(event => {
        const participant = event.participants.find(
          p => p.user.toString() === req.user._id.toString()
        );
        return {
          ...event.toObject(),
          type: "registered",
          registrationDate: participant.registrationDate,
          isRegistered: true, // Kullanıcının katıldığı event'ler
          isOwner: event.authorId._id.toString() === req.user._id.toString(),
        };
      });

      const total = await Event.countDocuments(query);

      return res.json({
        events,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    }
  } catch (error) {
    console.error("Kullanıcı etkinlikleri getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı etkinlikleri alınırken hata oluştu",
    });
  }
};

// Etkinlik detayı
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate("authorId", "username firstName lastName profilePicture")
      .populate("approvedBy", "username firstName lastName");

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    // Event objesini hazırla
    const eventObj = event.toObject();

    // Kullanıcı giriş yapmışsa kayıt durumunu kontrol et
    if (req.user) {
      eventObj.isRegistered = event.isUserRegistered(req.user._id);
      eventObj.isOwner = event.authorId._id.toString() === req.user._id.toString();
      eventObj.canRegister = !event.isFull && event.status === "active" && !event.isUserRegistered(req.user._id);
    } else {
      eventObj.isRegistered = false;
      eventObj.isOwner = false;
      eventObj.canRegister = !event.isFull && event.status === "active";
    }

    res.json({ event: eventObj });
  } catch (error) {
    console.error("Etkinlik getirme hatası:", error);
    res.status(500).json({
      message: "Etkinlik bilgileri alınırken hata oluştu",
    });
  }
};

// Etkinlik güncelle
export const updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      instructor,
      instructorTitle,
      date,
      endDate,
      location,
      locationAddress,
      maxParticipants,
      price,
      isOnline,
      organizer,
      organizerType,
      tags,
      requirements,
      image,
    } = req.body;

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    // Sadece etkinlik sahibi veya admin güncelleyebilir
    if (
      event.authorId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu etkinliği güncelleme yetkiniz yok",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (instructor) updateData.instructor = instructor;
    if (instructorTitle) updateData.instructorTitle = instructorTitle;
    if (date) updateData.date = new Date(date);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location) updateData.location = location;
    if (locationAddress) updateData.locationAddress = locationAddress;
    if (maxParticipants) updateData.maxParticipants = maxParticipants;
    if (price !== undefined) updateData.price = price;
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (organizer) updateData.organizer = organizer;
    if (organizerType) updateData.organizerType = organizerType;
    if (tags) updateData.tags = tags;
    if (requirements) updateData.requirements = requirements;
    if (image) updateData.image = image;
    if (req.user.role === "admin" && isExternal !== undefined) updateData.isExternal = isExternal;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.eventId,
      updateData,
      { new: true, runValidators: true }
    ).populate("authorId", "username firstName lastName profilePicture");

    res.json({
      message: "Etkinlik başarıyla güncellendi",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Etkinlik güncelleme hatası:", error);
    res.status(500).json({
      message: "Etkinlik güncellenirken hata oluştu",
    });
  }
};

// Etkinlik sil
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    // Sadece etkinlik sahibi veya admin silebilir
    if (
      event.authorId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu etkinliği silme yetkiniz yok",
      });
    }

    await Event.findByIdAndDelete(req.params.eventId);

    res.json({
      message: "Etkinlik başarıyla silindi",
    });
  } catch (error) {
    console.error("Etkinlik silme hatası:", error);
    res.status(500).json({
      message: "Etkinlik silinirken hata oluştu",
    });
  }
};

// Etkinliğe kayıt ol
export const registerForEvent = async (req, res) => {
  try {
    const { notes } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    if (event.status !== "active") {
      return res.status(400).json({
        message: "Bu etkinliğe kayıt alınmıyor",
      });
    }

    if (event.isFull) {
      return res.status(409).json({
        message: "Etkinlik kontenjanı dolu",
      });
    }

    if (event.isUserRegistered(req.user._id)) {
      return res.status(409).json({
        message: "Bu etkinliğe zaten kayıtlısınız",
      });
    }

    await event.addParticipant(req.user._id, notes);

    res.json({
      message: "Etkinliğe başarıyla kayıt oldunuz",
      registration: {
        eventId: event._id,
        userId: req.user._id,
        registrationDate: new Date(),
        notes: notes,
        status: "confirmed",
      },
      event: {
        id: event._id,
        title: event.title,
        currentParticipants: event.currentParticipants,
        isRegistered: true,
      },
    });
  } catch (error) {
    console.error("Etkinlik kayıt hatası:", error);
    if (error.message === "Etkinlik kontenjanı dolu") {
      return res.status(409).json({ message: error.message });
    }
    if (error.message === "Kullanıcı zaten kayıtlı") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({
      message: "Etkinlik kaydı sırasında hata oluştu",
    });
  }
};

// Etkinlik kaydını iptal et
export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    if (!event.isUserRegistered(req.user._id)) {
      return res.status(400).json({
        message: "Bu etkinliğe kayıtlı değilsiniz",
      });
    }

    await event.removeParticipant(req.user._id);

    res.json({
      message: "Etkinlik kaydınız başarıyla iptal edildi",
      event: {
        id: event._id,
        title: event.title,
        currentParticipants: event.currentParticipants,
        isRegistered: false,
      },
    });
  } catch (error) {
    console.error("Etkinlik kayıt iptal hatası:", error);
    res.status(500).json({
      message: "Etkinlik kaydı iptal edilirken hata oluştu",
    });
  }
};

// Etkinlik katılımcıları
export const getEventParticipants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    // Sadece etkinlik sahibi veya admin katılımcıları görebilir
    if (
      event.authorId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu etkinliğin katılımcılarını görme yetkiniz yok",
      });
    }

    let participants = event.participants;

    // Durum filtresi
    if (status) {
      participants = participants.filter(p => p.status === status);
    }

    // Sayfalama
    const totalParticipants = participants.length;
    const paginatedParticipants = participants.slice(skip, skip + limit);

    // Kullanıcı bilgilerini populate et
    const participantsWithUsers = await Promise.all(
      paginatedParticipants.map(async (participant) => {
        const user = await User.findById(participant.user)
          .select("username firstName lastName profilePicture");
        return {
          id: participant._id,
          user,
          registrationDate: participant.registrationDate,
          status: participant.status,
          notes: participant.notes,
        };
      })
    );

    res.json({
      participants: participantsWithUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalParticipants / limit),
        totalParticipants,
        hasNext: page * limit < totalParticipants,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Etkinlik katılımcıları getirme hatası:", error);
    res.status(500).json({
      message: "Etkinlik katılımcıları alınırken hata oluştu",
    });
  }
};

// Etkinlik onayla/reddet (Admin)
export const approveEvent = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    if (action === "approve") {
      await event.approve(req.user._id);
      res.json({
        message: "Etkinlik başarıyla onaylandı",
        event: {
          id: event._id,
          title: event.title,
          status: "active",
          approvedAt: event.approvedAt,
          approvedBy: event.approvedBy,
        },
      });
    } else if (action === "reject") {
      await event.reject(req.user._id, reason);
      res.json({
        message: "Etkinlik reddedildi",
        event: {
          id: event._id,
          title: event.title,
          status: "rejected",
          approvedAt: event.approvedAt,
          approvedBy: event.approvedBy,
          rejectionReason: event.rejectionReason,
        },
      });
    } else {
      return res.status(400).json({
        message: "Geçersiz işlem. 'approve' veya 'reject' olmalı",
      });
    }
  } catch (error) {
    console.error("Etkinlik onaylama hatası:", error);
    res.status(500).json({
      message: "Etkinlik onaylama sırasında hata oluştu",
    });
  }
};

// Etkinlik raporla
export const reportEvent = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        message: "Etkinlik bulunamadı",
      });
    }

    await event.addReport(req.user._id, reason, description);

    res.json({
      message: "Etkinlik başarıyla raporlandı",
    });
  } catch (error) {
    console.error("Etkinlik raporlama hatası:", error);
    res.status(500).json({
      message: "Etkinlik raporlanırken hata oluştu",
    });
  }
};
