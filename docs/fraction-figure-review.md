# Fraction figure review

Reviewed all 11 pages of `Class4_Olympiad_Fraction.pdf` (printed pages 29–39). The scan is reference material; its exercise instructions describe learner tasks, not instructions to the coding agent. Examples in the gallery are new instances of these formats, not transcriptions of the book or its answer key.

| Scan page / printed page | Figure question evidence | Representation |
| --- | --- | --- |
| 3 / 31 | Self Test 1 Q3: unshaded triangular composite; Q5: multiple quartered circles | `regions`; improper numerator across congruent pie wholes |
| 7 / 35 | Exercise Q3: composite triangles; Q6: shaded grid including half cells; Q7: triangle mixed fraction | `regions`; `grid` with corner shading; `triangle` across wholes |
| 8 / 36 | Q12: select a figure for a fraction; Q15: match a reference's shaded fraction to an option's unshaded fraction; Q20: equivalent shaded areas | Labelled `panels`, including reference X and normal option labels A–D |
| 8 / 36 | Q16: fraction of objects that are circles; Q21: unshaded grid area | Mixed `set.items`; complement of grid area |
| 9 / 37 | Q24: circles with different partition sizes; Q28: necklace choices; Q30: arithmetic on two shaded figures | Weighted pie sectors; necklace set panels; P/Q panels with operation in question text |
| 10 / 38 | SOF Q4: compare triangular tessellation and concentric circle | Polygon regions and pie rings; compute areas rather than count unequal pieces |
| 11 / 39 | SOF Q8: count figures with more than half shaded | Labelled panels mixing pie, triangle, and half-cell grid |
| 9 / 37 and 11 / 39 | Pictorial unknowns in equations | Symbolic reasoning can use named objects or existing mathematical symbols in question text; the fraction renderer does not recreate book/pencil/eraser artwork |

The explanatory pages also show ordinary pie fractions, equivalent object collections, and mixed triangle wholes. Existing pie/bar/set inputs remain supported; zero and improper fractions now render faithfully. Fraction value labels default to hidden, with `showLabel:true` available for teaching illustrations.

## Use

Open `/tutor/diagrams` or `/admin/diagrams` and select the fraction filter to inspect ten new examples. Enable image-based questions in the existing generation flow for a Grade 4 fractions topic. The backend and material-editor prompt catalogs describe the extended JSON contract. Olympiad Mathematics subject names now match Mathematics diagram tags.

Store visual choices as one top-level `diagram.params.panels` array. Put matching panel labels in the existing text options, so option selection and grading continue to use the ordinary question model. Geometry travels with selection snapshots, active quizzes, quiz sessions, and student question cards.

Grid cells use row-major order and the values `empty`, `full`, `top-left`, `top-right`, `bottom-left`, `bottom-right`. Corner values shade half the cell. Custom polygon regions use coordinates in a 100 × 100 square; each region must be convex and regions cannot overlap. A composite whole may have an irregular outline. Weighted pie sectors encode relative angles, and ring boundaries encode relative radii. Generation instructions require area-based answers, clear definitions of the whole, and unique correct MCQ choices.

Validation rejects malformed grids, overlapping/degenerate polygons, invalid indices, invalid rings, and excessive sizes before the AI generation service saves a question. It validates geometry, not arbitrary natural-language answer semantics; tutor review remains the existing final quality check. No live paid AI request or database migration is needed for these changes.

## Verification

- `node --test frontend/tests/*.test.mjs`
- `cd backend && npm test -- --runInBand`
- `cd frontend && npm run build`

Tests cover the example geometry, complements, mixed wholes, unequal areas, zero/full fractions, option uniqueness, generated prompt guidance, validation, and preservation through quiz schemas.
