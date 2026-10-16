# Session Summary and Report Feature Proposal

Status: proposed for a later increment. Not part of the initial MVP.

## Why it may matter

Flow & Magic may produce useful value beyond the live session if users can revisit what they explained, identify the main topics, and turn the session into a concise report or learning artifact.

## Proposed outputs

### Session summary
- Session title and date, if available.
- Main concepts covered.
- Key explanations or visual topics shown.
- Open questions explicitly recorded.
- User-confirmed decisions or action items, if applicable.
- Links/references to visuals shown, where available.

### Session report
A more structured export that could include:
- Purpose/audience
- Topic outline
- Concepts and visual assets used
- Presenter notes, if provided
- Confirmed decisions and action items
- Unresolved questions
- Sources and attribution
- Limitations or uncertain AI-generated statements

### Improvement suggestions
After the session, Flow & Magic could suggest:
- Concepts that may need a clearer explanation.
- Visuals that were repeatedly dismissed or replaced.
- Missing prerequisites or concepts that may need introducing first.
- Opportunities to simplify a diagram.
- Potential follow-up topics or exercises.
- A revised presentation outline.

These should be framed as suggestions, not objective judgments about the presenter.

## Required safeguards
- Do not fabricate topics, decisions, citations, or action items.
- Distinguish captured content from model-generated inference.
- Allow the presenter to edit before exporting or sharing.
- Do not share reports publicly by default.
- Define storage, retention, and deletion before retaining session content.
- Make clear if external AI providers process the content.
- Include provenance for generated visuals and external assets where available.

## Validation questions
- Do users want a summary, a formal report, or both?
- Should reports be Markdown, PDF, HTML, or more than one format?
- Is the input sufficient to create a faithful report?
- Which audience needs the report: presenter, learner, manager, or client?
- What is the minimum useful output?

## Suggested MVP for this feature
Start with a user-reviewed Markdown summary built from explicit session events and presenter notes. Add richer reports and AI improvement suggestions only after summary accuracy is evaluated.
