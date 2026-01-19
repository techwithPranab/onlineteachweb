# AI Question Generation Framework

A comprehensive, pluggable AI-driven question generation system for the MeritAI Platform.

## 🎯 Overview

This framework automatically generates high-quality, curriculum-aligned quiz questions from:
- Course syllabus
- Tutor-uploaded materials (PDFs, PPTs, Docs)
- Topic summaries and learning objectives
- External knowledge sources

## 📁 Architecture

```
backend/ai/
├── index.js                          # Module entry point
├── AIQuestionGenerationService.js    # Main orchestrator service
├── providers/
│   ├── AIProviderInterface.js        # Strategy pattern interface
│   ├── AIProviderFactory.js          # Provider factory/registry
│   ├── OpenAIProvider.js             # OpenAI implementation
│   └── RuleBasedProvider.js          # Fallback template-based provider
├── prompts/
│   └── questionPrompts.js            # Versioned prompt templates
├── validation/
│   ├── QuestionValidator.js          # Schema validation
│   ├── DuplicateDetector.js          # Duplicate detection
│   └── ContentFilter.js              # Content safety filtering
└── ingestion/
    ├── ContentNormalizer.js          # Content normalization
    └── MaterialExtractor.js          # File content extraction
```

## 🚀 Quick Start

### 1. Environment Configuration

Add to your `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
```

### 2. Install Dependencies

```bash
cd backend
npm install openai pdf-parse mammoth
```

### 3. Use the API

#### Generate Questions

```bash
POST /api/ai/questions/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseId": "course_id",
  "topics": ["Algebra", "Geometry"],
  "difficultyLevels": ["easy", "medium", "hard"],
  "questionTypes": ["mcq-single", "numerical"],
  "questionsPerTopic": 5,
  "sources": ["syllabus", "materials"]
}
```

#### Get Drafts for Review

```bash
GET /api/ai/questions/drafts?status=draft&courseId=xxx
Authorization: Bearer <token>
```

#### Approve/Reject Drafts

```bash
POST /api/ai/questions/approve/:draftId
POST /api/ai/questions/reject/:draftId
```

## 📝 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/questions/generate` | Generate questions |
| GET | `/api/ai/questions/drafts` | List draft questions |
| GET | `/api/ai/questions/drafts/:id` | Get single draft |
| PUT | `/api/ai/questions/drafts/:id` | Edit draft |
| POST | `/api/ai/questions/approve/:id` | Approve draft |
| POST | `/api/ai/questions/reject/:id` | Reject draft |
| POST | `/api/ai/questions/bulk-approve` | Bulk approve |
| POST | `/api/ai/questions/bulk-reject` | Bulk reject |
| GET | `/api/ai/questions/stats` | Get statistics |
| GET | `/api/ai/questions/jobs/:jobId` | Get job results |
| GET | `/api/ai/providers/status` | Check AI providers |

### Generation Request Schema

```typescript
{
  courseId: string;           // Required - Course ObjectId
  topics?: string[];          // Optional - Specific topics (all if empty)
  difficultyLevels?: string[];// ["easy", "medium", "hard"]
  questionTypes?: string[];   // ["mcq-single", "mcq-multiple", etc.]
  questionsPerTopic?: number; // Default: 5
  sources?: string[];         // ["syllabus", "materials", "external"]
  providerName?: string;      // Optional - Specific AI provider
}
```

### Question Types

| Type | Description |
|------|-------------|
| `mcq-single` | Multiple choice with single answer |
| `mcq-multiple` | Multiple choice with multiple answers |
| `true-false` | True/False statements |
| `numerical` | Numerical answer with tolerance |
| `short-answer` | Brief text response |
| `long-answer` | Essay/detailed response |
| `case-based` | Case study with questions |

### Difficulty Levels

| Level | Cognitive Level | Description |
|-------|-----------------|-------------|
| Easy | Knowledge, Comprehension | Direct recall, definitions |
| Medium | Application, Analysis | Conceptual, multi-step |
| Hard | Synthesis, Evaluation | Analytical, case-based |

## 🔌 Adding Custom AI Providers

Implement the `AIProviderInterface`:

```javascript
const AIProviderInterface = require('./providers/AIProviderInterface');

class CustomProvider extends AIProviderInterface {
  async generateQuestions(input) {
    // Your implementation
    return questions;
  }

  async isAvailable() {
    return true;
  }

  getName() {
    return 'custom-provider';
  }

  getVersion() {
    return '1.0.0';
  }

  getConfig() {
    return { /* config */ };
  }
}

// Register in AIProviderFactory
const factory = require('./providers/AIProviderFactory');
factory.register('custom', new CustomProvider());
```

## 📊 Database Models

### AIQuestionDraft

Stores AI-generated questions pending review:

```javascript
{
  courseId: ObjectId,
  topic: String,
  difficultyLevel: 'easy' | 'medium' | 'hard',
  type: 'mcq-single' | 'mcq-multiple' | ...,
  questionPayload: Object,    // Full question data
  sourceType: String,
  modelUsed: String,
  confidenceScore: Number,    // 0-1
  status: 'draft' | 'approved' | 'rejected',
  jobId: String,
  createdBy: ObjectId,
  approvedBy: ObjectId,
  rejectedBy: ObjectId,
  rejectionReason: String
}
```

## 🛡️ Quality Controls

### Validation Pipeline

1. **Schema Validation** - Ensures output matches Question model
2. **Content Filtering** - Removes inappropriate content
3. **Duplicate Detection** - Prevents duplicate questions
4. **Difficulty Verification** - Confirms difficulty alignment

### Safety Features

- Deterministic temperature per difficulty
- Max token limits
- Content filters for inappropriate material
- Human review before publishing

## 🖥️ Frontend Integration

### Pages

- `/tutor/ai-questions/generate` - Generate questions
- `/tutor/ai-questions/review` - Review and approve drafts

### Components

- `AIQuestionGenerator` - Configuration form
- `AIQuestionReview` - Draft review interface
- `QuestionPreview` - Question preview
- `QuestionEditor` - Edit before approval

## 📈 Monitoring

### Statistics Available

- Total drafts generated
- Approval rate
- Rejection reasons
- Questions by model/difficulty
- Generation time metrics

### Logging

All operations are logged via Winston:
- Generation jobs
- Approval/rejection actions
- Errors and warnings

## 🔧 Configuration

### Temperature Settings

```javascript
{
  easy: 0.3,    // More deterministic
  medium: 0.5,
  hard: 0.7     // More creative
}
```

### Max Tokens by Type

```javascript
{
  'mcq-single': 800,
  'mcq-multiple': 1000,
  'case-based': 1500
}
```

## 📋 Best Practices

1. **Start with specific topics** - Better quality than broad generation
2. **Review all drafts** - AI can make mistakes
3. **Use appropriate difficulty** - Match student level
4. **Monitor approval rates** - Track quality over time
5. **Provide good course content** - Better input = better output

## 🐛 Troubleshooting

### Common Issues

**Q: OpenAI provider not available**
A: Check `OPENAI_API_KEY` in environment variables

**Q: Low quality questions**
A: Ensure course has detailed topics and learning objectives

**Q: Duplicates being generated**
A: The system detects and filters duplicates automatically

## 📄 License

MIT License - Part of MeritAI Platform
