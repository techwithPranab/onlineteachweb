const Course = require('../models/Course.model');
const Material = require('../models/Material.model');
const scanMaterialService = require('../services/scanMaterial.service');
const crypto = require('crypto');
const ScanCourseGeneration = require('../models/ScanCourseGeneration.model');
const { uploadScanPdf } = require('../services/cloudinary.service');
const fs = require('fs').promises;

exports.createFromScans = async (req, res, next) => {
  let course;
  let generation;
  const startedAt = Date.now();
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ success: false, message: 'At least one scanned PDF is required' });
    if (files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'Combined PDF size cannot exceed 100MB' });
    }

    generation = await ScanCourseGeneration.create({
      status: 'processing',
      request: {
        grade: Number(req.body.grade), subject: req.body.subject, board: req.body.board, title: req.body.title,
        files: files.map((file, order) => ({ fileName: file.originalname, mimeType: file.mimetype, fileSize: file.size, order }))
      },
      createdBy: req.user._id
    });
    for (const [order, file] of files.entries()) {
      Object.assign(file, await uploadScanPdf(file));
      await ScanCourseGeneration.findByIdAndUpdate(generation._id, { $set: {
        [`request.files.${order}.fileUrl`]: file.fileUrl,
        [`request.files.${order}.cloudinaryPublicId`]: file.cloudinaryPublicId
      } });
    }
    const generated = await scanMaterialService.generateCourseFromScans(files, {
      ...req.body,
      onExchange: exchange => ScanCourseGeneration.findByIdAndUpdate(generation._id, { $push: { exchanges: exchange } })
    });
    const requestedGrade = Number(req.body.grade) || 4;
    const requestedSubject = String(req.body.subject || 'Computer').trim();
    const courseData = generated.course;
    course = await Course.create({
      ...courseData,
      grade: requestedGrade,
      subject: requestedSubject,
      board: req.body.board ? [req.body.board] : (courseData.board || ['CBSE']),
      status: 'draft',
      createdBy: req.user._id
    });

    const sourceFiles = files.map((file, pageOrder) => ({
      fileUrl: file.fileUrl,
      cloudinaryPublicId: file.cloudinaryPublicId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageOrder
    }));
    const materials = await Material.insertMany(generated.materials.map((item, index) => ({
      course: course._id,
      tutor: req.user._id,
      title: item.title,
      description: item.description,
      type: 'article',
      content: item.content,
      contentFormat: 'markdown',
      exercisePatterns: item.exercisePatterns || [],
      exercisePatternsReviewed: item.exercisePatternsReviewed === true,
      exerciseAnalysisReport: item.exerciseAnalysisReport,
      category: 'lesson',
      order: index,
      tags: [requestedSubject, `Grade ${requestedGrade}`, item.chapterName].filter(Boolean),
      sourceFiles: sourceFiles[index] ? [sourceFiles[index]] : sourceFiles,
      sourceProvenance: {
        kind: 'scan-ocr',
        model: generated.model,
        extractedAt: new Date(),
        contentHash: crypto.createHash('sha256').update(item.content).digest('hex')
      }
    })));

    await ScanCourseGeneration.findByIdAndUpdate(generation._id, {
      status: 'success', course: course._id, materials: materials.map(item => item._id), completedAt: new Date(), durationMs: Date.now() - startedAt
    });
    res.status(201).json({ success: true, generationId: generation._id, course, materials, message: `Created draft course with ${materials.length} materials` });
  } catch (error) {
    if (course?._id) {
      await Material.deleteMany({ course: course._id }).catch(() => {});
      await Course.findByIdAndDelete(course._id).catch(() => {});
    }
    if (generation?._id) await ScanCourseGeneration.findByIdAndUpdate(generation._id, {
      status: 'failed', error: { message: error.message, stack: error.stack }, completedAt: new Date(), durationMs: Date.now() - startedAt
    }).catch(() => {});
    next(error);
  } finally {
    await Promise.all((req.files || []).map(file => fs.unlink(file.path).catch(() => {})));
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [items, total] = await Promise.all([
      ScanCourseGeneration.find().select('-exchanges -error.stack').populate('course', 'title grade subject status').populate('createdBy', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ScanCourseGeneration.countDocuments()
    ]);
    res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getHistoryItem = async (req, res, next) => {
  try {
    const item = await ScanCourseGeneration.findById(req.params.id).populate('course', 'title grade subject status').populate('materials', 'title type').populate('createdBy', 'name email').lean();
    if (!item) return res.status(404).json({ success: false, message: 'Scan generation history not found' });
    res.json({ success: true, item });
  } catch (error) { next(error); }
};
