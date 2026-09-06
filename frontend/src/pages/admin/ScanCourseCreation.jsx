import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, Sparkles, X, CheckCircle, History, RefreshCw } from 'lucide-react'
import { courseService } from '../../services/apiServices'
import SEOHead from '../../components/SEO/SEOHead'

export default function ScanCourseCreation() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [form, setForm] = useState({ grade: 4, subject: 'Computer', board: 'CBSE', title: 'Grade 4 Computer' })
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedHistory, setSelectedHistory] = useState(null)

  const loadHistory = async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const data = await courseService.getScanCourseHistory({ limit: 20 })
      setHistory(data.items || [])
    } catch (err) {
      setHistoryError(err.response?.data?.message || 'Could not load generation history. Please try refreshing the history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [])

  const viewHistory = async id => {
    try {
      const data = await courseService.getScanCourseHistoryItem(id)
      setSelectedHistory(data.item)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load history details.')
    }
  }

  const submit = async event => {
    event.preventDefault()
    if (loading) return
    if (!files.length) return setError('Select at least one textbook PDF.')
    setLoading(true)
    setProgress(0)
    setError('')
    setResult(null)
    const data = new FormData()
    files.forEach(file => data.append('files', file))
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    try {
      setResult(await courseService.createFromScans(data, setProgress))
      await loadHistory()
    } catch (err) {
      setError(err.response?.data?.message || 'Course generation failed. Please verify the scans and try again.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <SEOHead title="Scan to Course - Admin" noIndex noFollow />
    <div className="max-w-4xl mx-auto p-2 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Sparkles className="text-purple-600" /> Scan PDF to Course</h1>
        <p className="text-gray-600 mt-2">Upload textbook chapters. AI creates one draft course and complete editable material for each chapter.</p>
      </div>

      <form onSubmit={submit} className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">Grade
            <input type="number" min="1" max="12" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="input-field w-full mt-2" required />
          </label>
          <label className="text-sm font-medium text-gray-700">Subject
            <input list="scan-course-subjects" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field w-full mt-2" required />
          </label>
          <datalist id="scan-course-subjects">
            {['Mathematics', 'Science', 'Olympiad-Mathematics', 'Olympiad-Science', 'English', 'Computer', 'Computer Science', 'Social Studies', 'Physics', 'Chemistry', 'Biology'].map(subject => <option key={subject} value={subject} />)}
          </datalist>
          <label className="text-sm font-medium text-gray-700">Course title hint
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field w-full mt-2" />
          </label>
          <label className="text-sm font-medium text-gray-700">Board
            <select value={form.board} onChange={e => setForm({ ...form, board: e.target.value })} className="input-field w-full mt-2">
              {['CBSE', 'ICSE', 'State Board', 'Other'].map(board => <option key={board}>{board}</option>)}
            </select>
          </label>
        </div>

        <label className="block border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl p-8 text-center cursor-pointer hover:bg-purple-100">
          <FileUp className="w-10 h-10 mx-auto text-purple-600 mb-3" />
          <span className="font-medium text-purple-900">Select scanned chapter PDFs</span>
          <span className="block text-sm text-purple-700 mt-1">Choose files in chapter order · maximum 20 files / 100MB combined</span>
          <input type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
        </label>

        {!!files.length && <div className="space-y-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"><span>{index + 1}. {file.name}</span><button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))}><X className="w-4 h-4 text-red-500" /></button></div>)}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{error}</div>}
        {loading && <div><div className="flex justify-between text-sm"><span>{progress < 100 ? 'Uploading scans…' : 'Reading textbook and building course…'}</span><span>{progress}%</span></div><div className="h-2 bg-gray-200 rounded mt-2"><div className="h-2 bg-purple-600 rounded transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-gray-500 mt-2">OCR and comprehensive material generation can take several minutes.</p></div>}
        <button disabled={loading || !files.length} className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50"><Sparkles className="w-4 h-4" />{loading ? 'Generating…' : 'Generate Draft Course & Materials'}</button>
      </form>

      {result && <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5"><h2 className="font-semibold text-green-900 flex gap-2"><CheckCircle /> Course created successfully</h2><p className="text-green-800 mt-2">{result.course.title} · {result.materials.length} material(s) created as a draft.</p><div className="flex gap-3 mt-4"><button className="btn-primary" onClick={() => navigate(`/admin/courses/${result.course._id}/edit`)}>Review Course</button><button className="px-4 py-2 border rounded-lg" onClick={() => navigate('/admin/materials')}>Review Materials</button></div></div>}

      <section className="mt-8 bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div><h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><History className="w-5 h-5" /> Generation History</h2><p className="text-sm text-gray-500">Stored requests, OpenAI responses, results and failures.</p></div>
          <button onClick={loadHistory} disabled={historyLoading} className="p-2 border rounded-lg" title="Refresh"><RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="overflow-x-auto">
          {historyError && <p role="alert" className="p-3 bg-red-50 text-red-700">{historyError}</p>}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Request</th><th className="p-3">Files</th><th className="p-3">Status</th><th className="p-3">Result</th><th className="p-3"></th></tr></thead>
            <tbody>{history.map(item => <tr key={item._id} className="border-t">
              <td className="p-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
              <td className="p-3">Grade {item.request?.grade} · {item.request?.subject}<div className="text-xs text-gray-500">{item.request?.board}</div></td>
              <td className="p-3">{item.request?.files?.length || 0}</td>
              <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'success' ? 'bg-green-100 text-green-700' : item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span></td>
              <td className="p-3">{item.course?.title || item.error?.message || 'Processing'}</td>
              <td className="p-3"><button onClick={() => viewHistory(item._id)} className="text-purple-700 font-medium">View</button></td>
            </tr>)}</tbody>
          </table>
          {!historyLoading && !history.length && <p className="p-6 text-center text-gray-500">No scan generations recorded yet.</p>}
        </div>
      </section>

      {selectedHistory && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedHistory(null)}>
        <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between gap-4"><div><h2 className="text-xl font-bold">Generation details</h2><p className="text-sm text-gray-500">{selectedHistory._id}</p></div><button onClick={() => setSelectedHistory(null)}><X /></button></div>
          <dl className="grid sm:grid-cols-3 gap-3 mt-5 text-sm"><div><dt className="text-gray-500">Status</dt><dd className="font-medium">{selectedHistory.status}</dd></div><div><dt className="text-gray-500">Created by</dt><dd>{selectedHistory.createdBy?.name || '-'}</dd></div><div><dt className="text-gray-500">Duration</dt><dd>{selectedHistory.durationMs ? `${(selectedHistory.durationMs / 1000).toFixed(1)}s` : '-'}</dd></div></dl>
          {selectedHistory.error?.message && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg">{selectedHistory.error.message}</div>}
          <details className="mt-5 border rounded-lg"><summary className="p-3 cursor-pointer font-medium">Original request</summary><pre className="p-3 border-t bg-gray-950 text-gray-100 text-xs overflow-auto max-h-80">{JSON.stringify(selectedHistory.request, null, 2)}</pre></details>
          {(selectedHistory.exchanges || []).map((exchange, index) => <details key={`${exchange.stage}-${index}`} className="mt-3 border rounded-lg"><summary className="p-3 cursor-pointer font-medium">{index + 1}. {exchange.stage} · {exchange.model || 'model'} · {exchange.responseId || 'no response id'}</summary><div className="border-t"><h3 className="px-3 pt-3 font-medium text-sm">Request payload</h3><pre className="p-3 bg-gray-950 text-gray-100 text-xs overflow-auto max-h-96">{JSON.stringify(exchange.requestPayload, null, 2)}</pre><h3 className="px-3 pt-3 font-medium text-sm">Response payload</h3><pre className="p-3 bg-gray-950 text-gray-100 text-xs overflow-auto max-h-96">{JSON.stringify(exchange.responsePayload, null, 2)}</pre></div></details>)}
        </div>
      </div>}
    </div>
  </>
}
