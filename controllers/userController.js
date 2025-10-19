import User from "../models/User.js";

// Tüm kullanıcıları getir (admin için)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, isActive, doctorApprovalStatus, search } = req.query;

    // Query objesi oluştur
    let query = {};

    // Role filtresi
    if (role && ["patient", "doctor", "admin"].includes(role)) {
      query.role = role;
    }

    // Aktiflik durumu filtresi
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Doktor onay durumu filtresi (sadece doktorlar için)
    if (doctorApprovalStatus && ["pending", "approved", "rejected"].includes(doctorApprovalStatus)) {
      query["doctorInfo.approvalStatus"] = doctorApprovalStatus;
    }

    // Arama filtresi
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { bio: searchRegex },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("doctorInfo.approvedBy", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // İstatistikler için ek bilgiler
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalPatients: {
            $sum: { $cond: [{ $eq: ["$role", "patient"] }, 1, 0] }
          },
          totalDoctors: {
            $sum: { $cond: [{ $eq: ["$role", "doctor"] }, 1, 0] }
          },
          totalAdmins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
          },
          pendingDoctors: {
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$role", "doctor"] },
                  { $eq: ["$doctorInfo.approvalStatus", "pending"] }
                ]}, 1, 0
              ]
            }
          },
          approvedDoctors: {
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$role", "doctor"] },
                  { $eq: ["$doctorInfo.approvalStatus", "approved"] }
                ]}, 1, 0
              ]
            }
          },
          rejectedDoctors: {
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$role", "doctor"] },
                  { $eq: ["$doctorInfo.approvalStatus", "rejected"] }
                ]}, 1, 0
              ]
            }
          },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: stats[0] || {
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalAdmins: 0,
        pendingDoctors: 0,
        approvedDoctors: 0,
        rejectedDoctors: 0,
        activeUsers: 0,
        inactiveUsers: 0
      },
      filters: {
        role,
        isActive,
        doctorApprovalStatus,
        search
      }
    });
  } catch (error) {
    console.error("Kullanıcıları getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcılar alınırken hata oluştu",
    });
  }
};

// Kullanıcı detayını getir
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Kullanıcı getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı bilgileri alınırken hata oluştu",
    });
  }
};

// Kullanıcı güncelle
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, bio, dateOfBirth, profilePicture } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password");

    res.json({
      message: "Profil başarıyla güncellendi",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    res.status(500).json({
      message: "Profil güncellenirken hata oluştu",
    });
  }
};

// Kullanıcı güncelleme
export const updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, bio, dateOfBirth, profilePicture } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password");

    res.json({
      message: "Profil başarıyla güncellendi",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    res.status(500).json({
      message: "Profil güncellenirken hata oluştu",
    });
  }
}


// Kullanıcı arama
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        message: "Arama terimi gerekli",
      });
    }

    const searchRegex = new RegExp(q, "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex },
      ],
      isActive: true,
    })
      .select("-password")
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex },
      ],
      isActive: true,
    });

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Kullanıcı arama hatası:", error);
    res.status(500).json({
      message: "Arama sırasında hata oluştu",
    });
  }
};

// Kullanıcı istatistikleri
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const user = await User.findById(userId).select(
      "createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    // Post sayısını al (Post modeli import edilmeli)
    // const postCount = await Post.countDocuments({ author: userId });

    res.json({
      stats: {
        // posts: postCount,
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error("İstatistik getirme hatası:", error);
    res.status(500).json({
      message: "İstatistikler alınırken hata oluştu",
    });
  }
};

// Onay bekleyen doktorları listele (admin için)
export const getPendingDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pendingDoctors = await User.find({
      role: "doctor",
      "doctorInfo.approvalStatus": "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      role: "doctor",
      "doctorInfo.approvalStatus": "pending",
    });

    res.json({
      pendingDoctors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPending: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Onay bekleyen doktorları getirme hatası:", error);
    res.status(500).json({
      message: "Onay bekleyen doktorlar alınırken hata oluştu",
    });
  }
};

// Doktor onayla (admin için)
export const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        message: "Doktor bulunamadı",
      });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({
        message: "Bu kullanıcı doktor değil",
      });
    }

    if (doctor.doctorInfo.approvalStatus === "approved") {
      return res.status(400).json({
        message: "Bu doktor zaten onaylanmış",
      });
    }

    doctor.doctorInfo.approvalStatus = "approved";
    doctor.doctorInfo.approvalDate = new Date();
    doctor.doctorInfo.approvedBy = req.user._id;
    doctor.doctorInfo.rejectionReason = undefined;

    await doctor.save();

    res.json({
      message: "Doktor başarıyla onaylandı",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        doctorInfo: {
          approvalStatus: doctor.doctorInfo.approvalStatus,
          approvalDate: doctor.doctorInfo.approvalDate,
          location: doctor.doctorInfo.location,
          specialization: doctor.doctorInfo.specialization,
          hospital: doctor.doctorInfo.hospital,
          experience: doctor.doctorInfo.experience,
        },
      },
    });
  } catch (error) {
    console.error("Doktor onaylama hatası:", error);
    res.status(500).json({
      message: "Doktor onaylanırken hata oluştu",
    });
  }
};

// Doktor reddet (admin için)
export const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        message: "Doktor bulunamadı",
      });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({
        message: "Bu kullanıcı doktor değil",
      });
    }

    if (doctor.doctorInfo.approvalStatus === "rejected") {
      return res.status(400).json({
        message: "Bu doktor zaten reddedilmiş",
      });
    }

    doctor.doctorInfo.approvalStatus = "rejected";
    doctor.doctorInfo.rejectionReason = rejectionReason || "Belirtilmemiş sebep";
    doctor.doctorInfo.approvalDate = new Date();
    doctor.doctorInfo.approvedBy = req.user._id;

    await doctor.save();

    res.json({
      message: "Doktor reddedildi",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        doctorInfo: {
          approvalStatus: doctor.doctorInfo.approvalStatus,
          rejectionReason: doctor.doctorInfo.rejectionReason,
          approvalDate: doctor.doctorInfo.approvalDate,
          location: doctor.doctorInfo.location,
          specialization: doctor.doctorInfo.specialization,
          hospital: doctor.doctorInfo.hospital,
          experience: doctor.doctorInfo.experience,
        },
      },
    });
  } catch (error) {
    console.error("Doktor reddetme hatası:", error);
    res.status(500).json({
      message: "Doktor reddedilirken hata oluştu",
    });
  }
};

// Doktor onay durumunu kontrol et
export const checkDoctorApprovalStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "role doctorInfo"
    );

    if (user.role !== "doctor") {
      return res.status(400).json({
        message: "Bu kullanıcı doktor değil",
      });
    }

    if (!user.doctorInfo) {
      return res.status(400).json({
        message: "Doktor bilgileri bulunamadı",
      });
    }

    res.json({
      doctorInfo: {
        approvalStatus: user.doctorInfo.approvalStatus,
        rejectionReason: user.doctorInfo.rejectionReason,
        approvalDate: user.doctorInfo.approvalDate,
        location: user.doctorInfo.location,
        specialization: user.doctorInfo.specialization,
        hospital: user.doctorInfo.hospital,
        experience: user.doctorInfo.experience,
      },
      isApproved: user.doctorInfo.approvalStatus === "approved",
    });
  } catch (error) {
    console.error("Doktor onay durumu kontrol hatası:", error);
    res.status(500).json({
      message: "Doktor onay durumu kontrol edilirken hata oluştu",
    });
  }
};

// Onaylanmış doktorları listele (experts)
export const getApprovedDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { specialization, location, hospital, search } = req.query;

    // Query objesi oluştur
    let query = {
      role: "doctor",
      "doctorInfo.approvalStatus": "approved",
      isActive: true,
    };

    // Uzmanlık alanı filtresi
    if (specialization) {
      query["doctorInfo.specialization"] = new RegExp(specialization, "i");
    }

    // Lokasyon filtresi
    if (location) {
      query["doctorInfo.location"] = new RegExp(location, "i");
    }

    // Hastane filtresi
    if (hospital) {
      query["doctorInfo.hospital"] = new RegExp(hospital, "i");
    }

    // Arama filtresi
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { "doctorInfo.specialization": searchRegex },
        { "doctorInfo.hospital": searchRegex },
        { "doctorInfo.location": searchRegex },
      ];
    }

    const approvedDoctors = await User.find(query)
      .select("-password")
      .populate("doctorInfo.approvedBy", "username firstName lastName")
      .sort({ "doctorInfo.approvalDate": -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Uzmanlık alanları istatistikleri
    const specializationStats = await User.aggregate([
      {
        $match: {
          role: "doctor",
          "doctorInfo.approvalStatus": "approved",
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$doctorInfo.specialization",
          count: { $sum: 1 },
          avgExperience: { $avg: "$doctorInfo.experience" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          specialization: "$_id",
          count: 1,
          avgExperience: { $round: ["$avgExperience", 1] },
          _id: 0,
        },
      },
    ]);

    // Lokasyon istatistikleri
    const locationStats = await User.aggregate([
      {
        $match: {
          role: "doctor",
          "doctorInfo.approvalStatus": "approved",
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$doctorInfo.location",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          location: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      experts: approvedDoctors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExperts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: {
        totalExperts: total,
        specializationStats,
        locationStats,
      },
      filters: {
        specialization,
        location,
        hospital,
        search,
      },
    });
  } catch (error) {
    console.error("Onaylanmış doktorları getirme hatası:", error);
    res.status(500).json({
      message: "Onaylanmış doktorlar alınırken hata oluştu",
    });
  }
};
