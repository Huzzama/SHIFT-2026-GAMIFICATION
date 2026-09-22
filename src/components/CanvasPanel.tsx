/**
 * The Canvas integration, made visible.
 *
 * Every FARO screen is already driven by Canvas data — this panel is where a
 * reviewer can check that claim instead of taking it. It shows the four
 * endpoints FARO calls, the live request log as those calls happen, and the
 * two LTI scopes FARO deliberately refuses.
 *
 * The mode badge is the honest part. In the prototype it reads "simulated",
 * because the requests are answered by fixtures rather than an institution.
 * The paths, the shapes and the mapping are real; the server is not, and the
 * panel says so rather than letting a demo imply otherwise.
 */
import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import type { Dict } from '@/i18n'
import { endpoints, ltiScopes } from '@/data/canvas/endpoints'
import { canvasConfig, launchContext } from '@/data/canvas/config'
import { canvasLog, type CanvasRequestRecord } from '@/data/canvas/transport'

const shortTime = (iso: string) => new Date(iso).toLocaleTimeString()

/** Drops the query string: the panel shows what was called, not how it paged. */
const cleanPath = (p: string) => p.split('?')[0]

export function CanvasPanel({ t }: { t: Dict }) {
  const c = t.profile.canvas
  const [records, setRecords] = useState<CanvasRequestRecord[]>(canvasLog.all())
  const [open, setOpen] = useState(false)

  useEffect(() => canvasLog.subscribe(setRecords), [])

  const simulated = canvasConfig.mode === 'mock'
  const paths = [
    endpoints.course(launchContext.courseId),
    endpoints.modules(launchContext.courseId),
    endpoints.assignments(launchContext.courseId),
    endpoints.userActivity(launchContext.courseId, launchContext.userId),
  ].map(cleanPath)

  return (
    <div className="card cv-panel">
      <div className="row row--between">
        <div className="row">
          <span className="ibadge ibadge--teal">
            <Icon name="refresh" size={22} />
          </span>
          <div>
            <div className="eyebrow">{c.title}</div>
            <div className="cv-panel__course">
              {c.course(launchContext.courseId)}
            </div>
          </div>
        </div>
        <span className={`cv-mode${simulated ? ' cv-mode--sim' : ''}`}>
          {simulated ? c.modeMock : c.modeLive}
        </span>
      </div>

      <p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.55 }}>
        {simulated ? c.bodyMock : c.bodyLive}
      </p>

      {/* What FARO calls ------------------------------------------------- */}
      <div className="cv-section">
        <div className="cv-section__title">{c.endpointsTitle}</div>
        <ul className="cv-paths">
          {paths.map((p) => (
            <li key={p}>
              <span className="cv-verb">GET</span>
              <code>{p}</code>
            </li>
          ))}
        </ul>
        <p className="cm-note">{c.readOnly}</p>
      </div>

      {/* What FARO refuses ------------------------------------------------ */}
      <div className="cv-section">
        <div className="cv-section__title">{c.refusedTitle}</div>
        <ul className="cv-refused">
          {ltiScopes.refused.map((s) => (
            <li key={s}>
              <Icon name="check" size={14} />
              <code>{s.split('/').slice(-1)[0]}</code>
            </li>
          ))}
        </ul>
        <p className="cm-note">{c.refusedNote}</p>
      </div>

      {/* Live log --------------------------------------------------------- */}
      <button className="rcv-why__head cv-toggle" onClick={() => setOpen(!open)}>
        <span>{c.logTitle(records.length)}</span>
        <Icon name="chevron" size={16} className={open ? 'flip' : undefined} />
      </button>

      {open && (
        <div className="cv-log">
          {records.length === 0 ? (
            <p className="cm-note" style={{ margin: 0 }}>{c.logEmpty}</p>
          ) : (
            <ul>
              {records.map((r, i) => (
                <li key={`${r.at}-${i}`} className={r.error ? 'cv-log__row cv-log__row--err' : 'cv-log__row'}>
                  <span className="cv-log__time">{shortTime(r.at)}</span>
                  <span className={`cv-log__status cv-log__status--${r.status >= 400 || r.error ? 'err' : 'ok'}`}>
                    {r.status}
                  </span>
                  <code className="cv-log__path">{cleanPath(r.path)}</code>
                  <span className="cv-log__meta">
                    {r.items !== undefined ? c.rows(r.items) : ''} {r.ms}ms
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
