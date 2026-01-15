/**
 * Prompt Templates for AI Question Generation
 * Versioned templates for consistent question generation
 */

const PROMPT_VERSION = '1.0.0';

/**
 * Difficulty definitions for prompts
 */
const DIFFICULTY_DEFINITIONS = {
  easy: {
    description: 'Direct recall, definitions, basic examples',
    cognitiveLevel: 'Knowledge and Comprehension',
    complexity: 'Single concept, straightforward application',
    examples: 'Define terms, identify facts, simple calculations'
  },
  medium: {
    description: 'Conceptual understanding, application-based, multi-step reasoning',
    cognitiveLevel: 'Application and Analysis',
    complexity: 'Multiple concepts, requires understanding relationships',
    examples: 'Apply formulas to new situations, compare concepts, solve multi-step problems'
  },
  hard: {
    description: 'Analytical, case-based, problem solving, edge cases',
    cognitiveLevel: 'Synthesis and Evaluation',
    complexity: 'Complex scenarios, requires critical thinking',
    examples: 'Analyze scenarios, evaluate solutions, solve complex problems with multiple variables'
  }
};

/**
 * Question type specifications
 */
const QUESTION_TYPE_SPECS = {
  'mcq-single': {
    name: 'Multiple Choice (Single Answer)',
    instructions: 'Generate a question with exactly 4 options where only ONE option is correct.',
    outputFormat: {
      options: 'Array of 4 objects with {text: string, isCorrect: boolean, explanation: string}',
      validation: 'Exactly one option must have isCorrect: true'
    }
  },
  'mcq-multiple': {
    name: 'Multiple Choice (Multiple Answers)',
    instructions: 'Generate a question with 4-6 options where 2 or more options can be correct.',
    outputFormat: {
      options: 'Array of 4-6 objects with {text: string, isCorrect: boolean, explanation: string}',
      validation: 'At least 2 options must have isCorrect: true'
    }
  },
  'true-false': {
    name: 'True/False',
    instructions: 'Generate a statement that is clearly true or false.',
    outputFormat: {
      options: 'Array of 2 objects: [{text: "True", isCorrect: boolean}, {text: "False", isCorrect: boolean}]',
      validation: 'Exactly one option must have isCorrect: true'
    }
  },
  'numerical': {
    name: 'Numerical Answer',
    instructions: 'Generate a problem requiring a numerical answer with calculation.',
    outputFormat: {
      numericalAnswer: '{value: number, tolerance: number, unit: string}',
      validation: 'Value must be a valid number'
    }
  },
  'short-answer': {
    name: 'Short Answer',
    instructions: 'Generate a question requiring a brief text response (1-3 sentences).',
    outputFormat: {
      expectedAnswer: 'Model answer text',
      keywords: 'Array of key terms that should appear in correct answer'
    }
  },
  'long-answer': {
    name: 'Long Answer / Essay',
    instructions: 'Generate a question requiring detailed explanation (paragraph or more).',
    outputFormat: {
      expectedAnswer: 'Model answer text',
      keywords: 'Array of key concepts that should be covered'
    }
  },
  'case-based': {
    name: 'Case Study Based',
    instructions: 'Generate a scenario/case study followed by related questions.',
    outputFormat: {
      caseStudy: 'The case study or scenario text',
      text: 'The specific question about the case',
      options: 'MCQ options if applicable'
    }
  }
};

/**
 * Base system prompt for question generation
 */
const SYSTEM_PROMPT = `You are an expert educational content creator specializing in creating high-quality quiz questions for students. Your questions must be:

1. ACCURATE: Factually correct and pedagogically sound
2. CLEAR: Unambiguous and easy to understand
3. CURRICULUM-ALIGNED: Relevant to the topic and learning objectives
4. DIFFICULTY-APPROPRIATE: Matching the specified difficulty level exactly
5. WELL-STRUCTURED: Following the exact output format specified

CRITICAL RULES:
- Never generate inappropriate, offensive, or biased content
- Ensure all answer options are plausible (no obviously wrong distractors)
- Provide educational explanations for answers
- Match the cognitive level to the difficulty
- Output ONLY valid JSON, no additional text`;

/**
 * Generate the main question generation prompt
 */
function generateQuestionPrompt({ topic, content, difficultyLevel, questionType, count, context }) {
  const difficulty = DIFFICULTY_DEFINITIONS[difficultyLevel];
  const typeSpec = QUESTION_TYPE_SPECS[questionType];
  
  if (!difficulty || !typeSpec) {
    throw new Error(`Invalid difficulty level or question type: ${difficultyLevel}, ${questionType}`);
  }

  const contextSection = context ? `
ADDITIONAL CONTEXT:
- Learning Objectives: ${context.learningObjectives?.join(', ') || 'Not specified'}
- Prerequisites: ${context.prerequisites?.join(', ') || 'None'}
- Grade Level: ${context.grade || 'Not specified'}
- Subject: ${context.subject || 'Not specified'}
- Board: ${context.board || 'Not specified'}
` : '';

  const userPrompt = `Generate exactly ${count} ${typeSpec.name} question(s) about the following topic.

TOPIC: ${topic}

SOURCE CONTENT:
${content || 'Use your knowledge about this topic.'}
${contextSection}

DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
- Description: ${difficulty.description}
- Cognitive Level: ${difficulty.cognitiveLevel}
- Complexity: ${difficulty.complexity}
- Example Types: ${difficulty.examples}

QUESTION TYPE: ${typeSpec.name}
- Instructions: ${typeSpec.instructions}

OUTPUT FORMAT:
Return a JSON object with a "questions" array. Each question MUST have this exact structure:
{
  "questions": [
    {
      "text": "The complete question text",
      "difficultyLevel": "${difficultyLevel}",
      "type": "${questionType}",
      "topic": "${topic}",
      ${questionType.startsWith('mcq') || questionType === 'true-false' ? 
        `"options": [
        {"text": "Option A text", "isCorrect": false, "explanation": "Why this option is incorrect"},
        {"text": "Option B text", "isCorrect": false, "explanation": "Why this option is incorrect"},
        {"text": "Option C text", "isCorrect": true, "explanation": "Why this is the CORRECT answer"},
        {"text": "Option D text", "isCorrect": false, "explanation": "Why this option is incorrect"}
      ],
      "correctAnswer": "The exact text of the correct option",
      "correctAnswerIndex": 2,` : ''}
      ${questionType === 'numerical' ? 
        `"numericalAnswer": {"value": 42, "tolerance": 0.1, "unit": "meters"},
      "correctAnswer": "42 meters",
      "solutionSteps": ["Step 1: ...", "Step 2: ...", "Final answer: 42 meters"],` : ''}
      ${questionType === 'short-answer' || questionType === 'long-answer' ? 
        `"expectedAnswer": "The complete model answer that would receive full marks",
      "correctAnswer": "The complete model answer",
      "keywords": ["key", "terms", "that", "must", "appear"],
      "sampleAnswer": "A detailed sample answer demonstrating the expected response",` : ''}
      ${questionType === 'case-based' ? 
        `"caseStudy": "The complete case study scenario with all necessary details",
      "correctAnswer": "The correct answer for the case-based question",` : ''}
      "explanation": "DETAILED explanation of WHY the correct answer is correct, including the concept being tested",
      "hint": "A helpful hint for students who are struggling",
      "marks": ${difficultyLevel === 'easy' ? 1 : difficultyLevel === 'medium' ? 2 : 3},
      "negativeMarks": ${difficultyLevel === 'easy' ? 0 : difficultyLevel === 'medium' ? 0.5 : 1},
      "recommendedTime": ${difficultyLevel === 'easy' ? 60 : difficultyLevel === 'medium' ? 120 : 180},
      "tags": ["relevant", "topic", "tags"]
    }
  ]
}

CRITICAL ANSWER REQUIREMENTS:
- EVERY question MUST include ALL answer options (for MCQ: exactly 4 options)
- EVERY question MUST clearly mark which answer is correct using "isCorrect": true
- EVERY question MUST include a "correctAnswer" field with the correct answer text
- For MCQ: Include "correctAnswerIndex" (0-based index of correct option)
- For Numerical: Include "solutionSteps" showing how to arrive at the answer
- For Short/Long Answer: Include a complete "sampleAnswer"
- ALL options must have explanations for why they are correct or incorrect

IMPORTANT:
- Generate EXACTLY ${count} question(s)
- Return ONLY the JSON object with "questions" array, no other text
- EVERY question MUST have complete answer options with ONE marked as correct
- EVERY question MUST include "correctAnswer" field with the answer text
- Ensure variety in questions (don't repeat similar concepts)
- All questions must be answerable from the given content or standard knowledge
- Include detailed explanations for BOTH correct and incorrect options`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

/**
 * Prompt for content extraction from materials
 */
function generateContentExtractionPrompt(materialText, topic) {
  return {
    systemPrompt: `You are an expert at extracting and summarizing educational content. Extract key concepts, definitions, formulas, and important facts that would be useful for generating quiz questions.`,
    userPrompt: `Extract key educational content from the following material about "${topic}". 
Focus on:
1. Key definitions and concepts
2. Important facts and figures
3. Formulas or procedures
4. Examples and applications
5. Common misconceptions

MATERIAL:
${materialText}

OUTPUT FORMAT:
Return a JSON object with:
{
  "topic": "${topic}",
  "keyConcepts": ["concept1", "concept2"],
  "definitions": [{"term": "term", "definition": "definition"}],
  "formulas": [{"name": "formula name", "formula": "formula", "usage": "when to use"}],
  "facts": ["fact1", "fact2"],
  "examples": ["example1", "example2"],
  "commonMisconceptions": ["misconception1", "misconception2"]
}`
  };
}

/**
 * Prompt for quality validation
 */
function generateValidationPrompt(question) {
  return {
    systemPrompt: `You are an expert educational content reviewer. Evaluate questions for quality, accuracy, and appropriateness.`,
    userPrompt: `Evaluate the following question for quality:

QUESTION:
${JSON.stringify(question, null, 2)}

Evaluate on these criteria (score 1-5 for each):
1. CLARITY: Is the question clear and unambiguous?
2. ACCURACY: Is the content factually correct?
3. DIFFICULTY_MATCH: Does it match the stated difficulty level?
4. COMPLETENESS: Are all required fields properly filled?
5. PEDAGOGY: Is it educationally valuable?

OUTPUT FORMAT:
{
  "scores": {
    "clarity": number,
    "accuracy": number,
    "difficultyMatch": number,
    "completeness": number,
    "pedagogy": number
  },
  "overallScore": number (average),
  "issues": ["list of issues found"],
  "suggestions": ["improvement suggestions"],
  "isPassing": boolean (true if overallScore >= 3.5)
}`
  };
}

module.exports = {
  PROMPT_VERSION,
  DIFFICULTY_DEFINITIONS,
  QUESTION_TYPE_SPECS,
  SYSTEM_PROMPT,
  generateQuestionPrompt,
  generateContentExtractionPrompt,
  generateValidationPrompt
};
