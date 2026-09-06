import { useQuery, useQueryClient } from 'react-query'
import { questionService } from '@/services/apiServices'
import MaterialViewer from './MaterialViewer'
import { QUESTION_TYPE_LABELS, resolveExpectedFormats, getResponseQuestions, safePdfUrl } from '@/utils/courseQuestionFormats.mjs'

export default function ExpectedQuestionFormats({ course, materials = [], materialsLoading = false, materialsError = null }) {
  const queryClient = useQueryClient()
  const structure = useQuery(['courseStructure', course._id], () => questionService.getCourseStructure(course._id))
  const history = useQuery(['courseFormatGenerations', course._id], () => questionService.getGenerationHistory({ courseId: course._id, limit: 5 }))
  const generations = history.data?.generations || []
  const formats = resolveExpectedFormats({ course, materials, structure: structure.data, generations })
  const loading = structure.isLoading || history.isLoading || materialsLoading
  const failed = structure.isError || history.isError || !!materialsError
  const refreshing = structure.isFetching || history.isFetching
  const refresh = () => {
    queryClient.invalidateQueries(['course', course._id])
    queryClient.invalidateQueries(['adminCourseMaterials', course._id])
    structure.refetch()
    history.refetch()
  }
  const files = materials.flatMap(material => material.sourceFiles || [])

  return <section className="bg-white rounded-lg shadow p-6" aria-labelledby="expected-question-formats">
    <div className="flex items-center justify-between gap-3">
      <h2 id="expected-question-formats" className="text-xl font-semibold">Expected question formats <span className="text-sm font-normal text-gray-500">({formats.length})</span></h2>
      <button type="button" onClick={refresh} disabled={refreshing} className="text-sm text-blue-700 underline disabled:opacity-50">{refreshing ? 'Refreshing…' : 'Refresh formats'}</button>
    </div>
    <p className="text-sm text-gray-600 mt-1">Exercise formats identified in the scanned PDFs and retained in generation prompts.</p>
    {loading && <p role="status" className="text-sm text-gray-500 mt-4">Loading exercise formats and prompt results…</p>}
    {structure.isError && <p role="alert" className="text-sm text-red-700 mt-4">Could not load scanned exercise formats. <button type="button" onClick={() => structure.refetch()} className="underline">Retry</button></p>}
    {history.isError && <p role="alert" className="text-sm text-red-700 mt-4">Could not load prompt results. <button type="button" onClick={() => history.refetch()} className="underline">Retry</button></p>}

    {materialsError && <p role="alert" className="text-sm text-red-700 mt-4">Could not load exercise formats from course materials. Use Refresh formats to retry.</p>}
    {!formats.length && failed && !loading && <p className="text-sm text-gray-600 mt-4">Exercise formats could not be fully loaded. Retry before scanning the PDF again.</p>}
    <div className="space-y-3 mt-4">
      {formats.map((format, index) => {
        const source = files.find(file => file.fileName === format.sourceFileName)
        const url = safePdfUrl(source?.fileUrl)
        return <article key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{format.label}</h3>
            <span className="text-xs bg-blue-50 text-blue-800 rounded-full px-2 py-1">{QUESTION_TYPE_LABELS[format.questionType] || format.questionType}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{format.chapterName || 'Chapter not recorded'}{format.topics?.length ? ` · ${format.topics.join(', ')}` : ' · Chapter-wide exercises'}</p>
          <p className="text-xs text-gray-500 mt-1">Evidence: {format.origins.join(' and ')}{format.sourceFileName && <> · {url ? <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{format.sourceFileName}</a> : format.sourceFileName}</>}</p>
          {format.sourcePages?.length > 0 && <p className="text-xs text-gray-500 mt-1">PDF pages: {format.sourcePages.join(', ')}</p>}
          {format.instructions && <p className="text-sm text-gray-800 whitespace-pre-wrap mt-3">{format.instructions}</p>}
          {format.example && <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-700">Scanned exercise example</summary>
            <div className="mt-2 p-3 bg-gray-50 rounded"><MaterialViewer material={{ type: 'article', title: 'Scanned exercise example', content: format.example }} /></div>
          </details>}
        </article>
      })}
    </div>
    {!loading && !failed && !formats.length && <p className="text-sm text-gray-500 mt-4">{course.exercisePatternsReviewed ? 'The PDF exercise review found no learner exercise formats in this course.' : 'No exercise formats have been recorded yet. Scan the course PDF to capture its exercise headings, instructions and examples.'}</p>}

    <h3 className="font-semibold text-gray-900 mt-6">Recent prompt responses</h3>
    <p className="text-xs text-gray-500 mt-1">The latest five generation records for this course. Response types show the saved AI output; they do not confirm that every question follows the exercise instructions.</p>
    {!history.isLoading && !history.isError && !generations.length && <p className="text-sm text-gray-500 mt-3">No question-generation responses yet. The formats above will guide generation.</p>}
    <div className="space-y-3 mt-3">
      {generations.map(generation => {
        const questions = getResponseQuestions(generation)
        const types = [...new Set(questions.map(question => question.type || 'Type not recorded'))]
        const expected = generation.sourceSnapshot?.exercisePatterns || []
        return <details key={generation._id} className="border border-gray-200 rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium">{generation.chapterName} · {generation.topic} · {generation.status} <span className="font-normal text-gray-500">{new Date(generation.createdAt).toLocaleString()}</span></summary>
          <dl className="text-sm mt-3 space-y-2">
            <div><dt className="font-medium">Expected in the prompt</dt><dd>{expected.length ? [...new Set(expected.map(pattern => pattern.label))].join(', ') : 'No scanned format recorded in this prompt'}</dd></div>
            <div><dt className="font-medium">Requested question type</dt><dd>{QUESTION_TYPE_LABELS[generation.generationParams?.questionType] || generation.generationParams?.questionType || 'Not recorded'}</dd></div>
            <div><dt className="font-medium">Returned question types</dt><dd>{types.length ? types.map(type => QUESTION_TYPE_LABELS[type] || type).join(', ') + ` · ${questions.length} question(s)` : 'No readable question response recorded'}</dd></div>
          </dl>
          {questions[0] && <div className="mt-3"><p className="text-sm font-medium mb-2">Response example</p><MaterialViewer material={{ type: 'article', title: 'Generated example', content: questions[0].text || questions[0].question || '' }} /></div>}
          {generation.errorMessage && <p className="text-sm text-red-700 mt-3">{generation.errorMessage}</p>}
          {(generation.finalPrompt || generation.prompt) && <details className="mt-3"><summary className="cursor-pointer text-sm text-blue-700">View saved prompt</summary><pre className="mt-2 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap break-words max-h-80 overflow-auto">{generation.finalPrompt || generation.prompt}</pre></details>}
        </details>
      })}
    </div>
  </section>
}
