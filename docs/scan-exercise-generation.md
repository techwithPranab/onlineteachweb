# Scanned textbook exercises and question generation

Scanning preserves exercise headings, directions, numbering, options, blanks and matching columns in the OCR Markdown. Course synthesis extracts `exercisePatterns` containing the original format label, supported question type, directions, a representative example, chapter, topics and zero-based source PDF index. The server validates the PDF reference and records the filename. Patterns are saved on the course and the corresponding material independently of the model's material count.

The main question generator defaults to **Match exercise formats from scanned textbooks**. For each topic it uses formats from the matching chapter/topic, including chapter-wide exercises. Selected material IDs restrict the source patterns. With no detected formats, or when automatic matching is disabled, it uses the manually selected question types. Low/Medium/High versus Olympiad difficulty rules still apply.

Fill-in-the-blanks, matching and one-word answers use the existing `short-answer` storage type; their distinct textbook format is preserved in the question text and expected answer through prompt instructions. Other supported storage types are single/multiple-answer MCQs, true/false, numerical, long-answer and case-based. These changes do not add new quiz response widgets.

Exercise examples and directions are passed separately from length-limited material content into the actual provider prompt, and are recorded in generation history. Prompts ask for new questions in the source style, not copied examples. The single-type generation modal and offline prompt form suggest a detected type and include matching exercise evidence for the selected type. Queued generation forwards the same options as synchronous generation and returns draft IDs.

Older scanned materials without structured patterns use conservative recognition of clearly labelled exercise headings. Ambiguous or missing exercise text is not classified. Re-scan a PDF to obtain full structured chapter/topic metadata; no database migration is required. Existing saved prompts remain historical records and must be regenerated to include newly extracted patterns.

Validation: `cd backend && npm test -- --runInBand`; `cd frontend && node --test tests/exercisePatterns.test.mjs`.
