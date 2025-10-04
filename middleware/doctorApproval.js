import User from "../models/User.js";

// Doktor onay kontrolü middleware
export const requireDoctorApproval = async (req, res, next) => {
  try {
    // Kullanıcının doktor olup olmadığını kontrol et
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Bu işlem sadece doktorlar için geçerlidir",
      });
    }

    // Doktor onay durumunu kontrol et
    const user = await User.findById(req.user._id).select(
      "doctorInfo"
    );

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    if (!user.doctorInfo) {
      return res.status(403).json({
        message: "Doktor bilgileri bulunamadı. Bu işlemi gerçekleştiremezsiniz.",
      });
    }

    if (user.doctorInfo.approvalStatus === "pending") {
      return res.status(403).json({
        message: "Doktor onayınız bekleniyor. Lütfen onay sürecinin tamamlanmasını bekleyin.",
        approvalStatus: "pending",
      });
    }

    if (user.doctorInfo.approvalStatus === "rejected") {
      return res.status(403).json({
        message: "Doktor onayınız reddedildi. Bu işlemi gerçekleştiremezsiniz.",
        approvalStatus: "rejected",
        rejectionReason: user.doctorInfo.rejectionReason,
      });
    }

    if (user.doctorInfo.approvalStatus !== "approved") {
      return res.status(403).json({
        message: "Doktor onayınız gerekli. Bu işlemi gerçekleştiremezsiniz.",
        approvalStatus: user.doctorInfo.approvalStatus,
      });
    }

    // Onay verilmişse devam et
    next();
  } catch (error) {
    console.error("Doktor onay kontrolü hatası:", error);
    res.status(500).json({
      message: "Doktor onay durumu kontrol edilirken hata oluştu",
    });
  }
};

// Doktor onay durumunu kontrol et (sadece bilgi için)
export const checkDoctorApproval = async (req, res, next) => {
  try {
    if (req.user.role === "doctor") {
      const user = await User.findById(req.user._id).select(
        "doctorInfo"
      );

      if (user && user.doctorInfo) {
        req.doctorApprovalInfo = {
          status: user.doctorInfo.approvalStatus,
          rejectionReason: user.doctorInfo.rejectionReason,
          approvalDate: user.doctorInfo.approvalDate,
          location: user.doctorInfo.location,
          specialization: user.doctorInfo.specialization,
          hospital: user.doctorInfo.hospital,
          experience: user.doctorInfo.experience,
          isApproved: user.doctorInfo.approvalStatus === "approved",
        };
      }
    }
    next();
  } catch (error) {
    console.error("Doktor onay bilgisi kontrolü hatası:", error);
    next(); // Hata durumunda da devam et
  }
};
