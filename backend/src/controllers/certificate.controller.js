import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Course from "../models/course.model.js";
import CourseProgress from "../models/course-progress.model.js";
import Certificate from "../models/certificate.model.js";
import User from "../models/user.model.js";

function generateCertificateId() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LC-${timePart}-${randPart}`;
}

export async function checkEligibility(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const progress = await CourseProgress.findOne({
      student: req.auth.userId,
      course: courseId,
    });

    const completed =
      course.totalLessons > 0 &&
      (progress?.completedLessons ?? 0) >= course.totalLessons;

    const existingCert = await Certificate.findOne({
      student: req.auth.userId,
      course: courseId,
    });

    res.json({
      eligible: completed,
      courseTitle: course.title,
      completedLessons: progress?.completedLessons ?? 0,
      totalLessons: course.totalLessons,
      certificateId: existingCert ? existingCert.certificateId : null,
      issueDate: existingCert ? existingCert.issueDate : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadCertificate(req, res, next) {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const progress = await CourseProgress.findOne({
      student: req.auth.userId,
      course: courseId,
    });

    const isCompleted =
      course.totalLessons > 0 &&
      (progress?.completedLessons ?? 0) >= course.totalLessons;

    if (!isCompleted) {
      return res.status(403).json({
        success: false,
        message:
          "Course completion requirements have not been met. All lessons must be completed to earn this certificate.",
        progress: {
          completedLessons: progress?.completedLessons ?? 0,
          totalLessons: course.totalLessons,
        },
      });
    }

    const student = await User.findById(req.auth.userId);
    const studentName = student?.name || "Accomplished Student";

    // Find or create permanent certificate record
    let cert = await Certificate.findOne({
      student: req.auth.userId,
      course: courseId,
    });

    if (!cert) {
      cert = await Certificate.create({
        student: req.auth.userId,
        course: courseId,
        certificateId: generateCertificateId(),
        studentName,
        courseTitle: course.title,
        completedLessonsCount: progress.completedLessons,
        totalLessonsCount: course.totalLessons,
        issueDate: new Date(),
      });
    }

    // Generate PDF document in landscape orientation
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      info: {
        Title: `LearnCraft Certificate - ${course.title}`,
        Author: "LearnCraft Learning Management System",
        Subject: "Certificate of Completion",
      },
    });

    const sanitizedFileName = course.title
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="LearnCraft_Certificate_${sanitizedFileName}.pdf"`
    );

    doc.pipe(res);

    const width = doc.page.width;
    const height = doc.page.height;

    // Outer and inner borders
    doc
      .lineWidth(4)
      .strokeColor("#1e293b")
      .rect(20, 20, width - 40, height - 40)
      .stroke();

    doc
      .lineWidth(1.5)
      .strokeColor("#6366f1")
      .rect(28, 28, width - 56, height - 56)
      .stroke();

    // Top Header Banner
    doc.moveDown(1.5);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#6366f1")
      .text("LEARNCRAFT ACADEMY", { align: "center", characterSpacing: 3 });

    doc.moveDown(0.4);
    doc
      .fontSize(32)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("CERTIFICATE OF COMPLETION", { align: "center", characterSpacing: 1 });

    doc.moveDown(0.6);
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("This official credential certifies that", { align: "center" });

    doc.moveDown(0.8);
    // Student Name
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#3b82f6")
      .text(studentName, { align: "center" });

    doc.moveDown(0.6);
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        "has successfully met all instructional requirements and demonstrated mastery in",
        { align: "center" }
      );

    doc.moveDown(0.6);
    // Course Title
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(course.title, { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#475569")
      .text(
        `Completed all ${course.totalLessons} curriculum lessons with verified digital coursework.`,
        { align: "center" }
      );

    // Bottom Details Section
    const formattedDate = new Date(cert.issueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const bottomY = height - 120;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text("Date Issued:", 70, bottomY);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text(formattedDate, 70, bottomY + 16);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text("Certificate ID:", width / 2 - 60, bottomY);
    doc
      .font("Helvetica-Bold")
      .fillColor("#6366f1")
      .text(cert.certificateId, width / 2 - 60, bottomY + 16);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text("Authorized by:", width - 200, bottomY);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("LearnCraft Academic Board", width - 200, bottomY + 16);

    // Decorative line across bottom
    doc
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .moveTo(70, bottomY - 15)
      .lineTo(width - 70, bottomY - 15)
      .stroke();

    doc.end();
  } catch (error) {
    next(error);
  }
}

export async function verifyCertificate(req, res, next) {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId }).lean();
    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: "No certificate found with this verification ID.",
      });
    }

    res.json({
      valid: true,
      certificate: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        issueDate: cert.issueDate,
        completedLessonsCount: cert.completedLessonsCount,
        totalLessonsCount: cert.totalLessonsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
