/**
 * Profile - public within Community, opened by tapping any name or avatar.
 *
 * Two modes, one screen. Your own is editable: photo, name, bio, a mocked
 * institutional link, and every badge you have earned - resilience and
 * community together, so a student never has to visit two screens to see
 * what they have built. Anyone else's is read-only: whatever they chose to
 * share, and nothing FARO computed about them that they did not choose to
 * show. Neither mode adds a rank, a follower count, or any way to compare
 * one student's badges against another's - Community does not have that,
 * and this screen does not add it back in through the side door.
 */
import { useMemo, useRef, useState } from 'react'
import { CanvasPanel } from '@/components/CanvasPanel'
import { Icon } from '@/components/Icon'
import { mockAuthors } from '@/data/community.mock'
import { communityRecognitionState, evaluateCommunityAchievements } from '@/lib/community'
import { useCommunity } from '@/state/community'
import { useStore } from '@/state/store'
import type { CommunityAchievementId } from '@/types'

const BIO_MAX = 160
/** Longest edge of the stored photo, in pixels. Small on purpose - this is an avatar, not a gallery. */
const PHOTO_SIZE = 240

/** Downsizes whatever the student picked to a small square JPEG, client-side. Never the raw file. */
function photoToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const canvas = document.createElement('canvas')
        canvas.width = PHOTO_SIZE
        canvas.height = PHOTO_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas context'))
        ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function BigAvatar({
  photoDataUrl,
  initials,
  editable,
  onPick,
}: {
  photoDataUrl: string | null
  initials: string
  editable?: boolean
  onPick?: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="profile-avatar">
      {photoDataUrl ? (
        <img src={photoDataUrl} alt="" className="profile-avatar__img" />
      ) : (
        <span className="profile-avatar__initials tint--teal" aria-hidden="true">
          {initials}
        </span>
      )}
      {editable && (
        <>
          <button
            type="button"
            className="profile-avatar__cam"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="camera" size={16} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="profile-avatar__input"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPick?.(f)
              e.target.value = ''
            }}
          />
        </>
      )}
    </div>
  )
}

function BadgeList({
  items,
}: {
  items: { id: string; title: string; description: string; hint: string; earned: boolean }[]
}) {
  return (
    <ul className="badges">
      {items.map((b) => (
        <li key={b.id} className={`badge${b.earned ? ' badge--earned' : ''}`}>
          <span className="badge__mark" aria-hidden="true">
            <Icon name={b.earned ? 'beacon' : 'stateBeaconNotYet'} size={20} tone="none" />
          </span>
          <div>
            <div className="badge__title">{b.title}</div>
            <div className="badge__body">{b.earned ? b.description : b.hint}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ProfileView({ authorId, onBack }: { authorId: string; onBack: () => void }) {
  const { t, profile, setProfile, achievements, awayGap } = useStore()
  const community = useCommunity()
  const p = t.profile

  const recognitions = useMemo(
    () => evaluateCommunityAchievements(communityRecognitionState(community, awayGap), t.community.achievements),
    [community, awayGap, t.community.achievements],
  )

  const own = authorId === 'me'

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(profile.name)
  const [draftBio, setDraftBio] = useState(profile.bio)

  const startEdit = () => {
    setDraftName(profile.name)
    setDraftBio(profile.bio)
    setEditing(true)
  }

  const save = () => {
    setProfile({
      ...profile,
      name: draftName.trim(),
      bio: draftBio.trim().slice(0, BIO_MAX),
      updatedAt: new Date().toISOString(),
    })
    setEditing(false)
  }

  const setPhoto = async (file: File) => {
    try {
      const dataUrl = await photoToDataUrl(file)
      setProfile({ ...profile, photoDataUrl: dataUrl, updatedAt: new Date().toISOString() })
    } catch {
      /* a photo the browser can't decode just stays unset - never a crash */
    }
  }

  const removePhoto = () => setProfile({ ...profile, photoDataUrl: null, updatedAt: new Date().toISOString() })

  if (own) {
    const displayName = profile.name.trim() || mockAuthors.find((a) => a.id === 'me')?.name || ''
    const initials = displayName ? displayName[0].toUpperCase() : 'T'
    const earnedCommunity = recognitions.filter((r) => r.earned).length
    const earnedResilience = achievements.filter((a) => a.earned).length

    return (
      <div className="stack">
        <div className="card profile-head">
          <BigAvatar
            photoDataUrl={profile.photoDataUrl}
            initials={initials}
            editable
            onPick={(f) => void setPhoto(f)}
          />
          {!editing ? (
            <>
              <div className="profile-head__name">{displayName || p.own.namePlaceholder}</div>
              {profile.bio.trim() && <p className="profile-head__bio">{profile.bio}</p>}
              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <button className="btn btn--ghost" onClick={startEdit}>
                  {p.own.edit}
                </button>
                {profile.photoDataUrl && (
                  <button className="btn btn--ghost" onClick={removePhoto}>
                    {p.own.photoRemove}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="stack" style={{ width: '100%' }}>
              <label className="profile-field">
                <span className="profile-field__label">{p.own.nameLabel}</span>
                <input
                  className="purpose__input"
                  value={draftName}
                  placeholder={p.own.namePlaceholder}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={40}
                />
              </label>
              <label className="profile-field">
                <span className="profile-field__label">{p.own.bioLabel}</span>
                <textarea
                  className="purpose__input"
                  rows={3}
                  value={draftBio}
                  placeholder={p.own.bioPlaceholder}
                  maxLength={BIO_MAX}
                  onChange={(e) => setDraftBio(e.target.value.slice(0, BIO_MAX))}
                />
                <span className="profile-field__count">{p.own.bioCount(draftBio.length, BIO_MAX)}</span>
              </label>
              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <button className="btn btn--block" onClick={save}>
                  {p.own.save}
                </button>
                <button className="btn btn--ghost" onClick={() => setEditing(false)}>
                  {p.own.cancel}
                </button>
              </div>
            </div>
          )}
          <p className="mentor__note" style={{ margin: 0 }}>{p.own.visibilityNote}</p>
        </div>

        <div className="card">
          <div className="row row--between">
            <div className="eyebrow">{p.institution.title}</div>
            <span className="profile-mocktag">{p.institution.mockTag}</span>
          </div>
          <p className="muted" style={{ margin: '10px 0 12px', lineHeight: 1.55 }}>{p.institution.body}</p>
          <div className="row row--between">
            <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
              {profile.institutionLinked ? p.institution.linked : p.institution.notLinked}
            </span>
            <button
              className="btn btn--ghost"
              onClick={() =>
                setProfile({ ...profile, institutionLinked: !profile.institutionLinked, updatedAt: new Date().toISOString() })
              }
            >
              {profile.institutionLinked ? p.institution.unlink : p.institution.link}
            </button>
          </div>
        </div>

        {/* Where the course data actually comes from. Shown next to the
            institutional account because that is the question it answers:
            what is FARO connected to, and what can it touch. */}
        <CanvasPanel t={t} />

        <div className="card">
          <div className="row row--between">
            <div className="eyebrow">{p.badges.resilience.eyebrow}</div>
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              {p.badges.resilience.of(earnedResilience, achievements.length)}
            </span>
          </div>
          {achievements.length === 0 ? (
            <p className="muted" style={{ margin: '10px 0 0' }}>{p.badges.empty}</p>
          ) : (
            <BadgeList items={achievements} />
          )}
        </div>

        <div className="card">
          <div className="row row--between">
            <div className="eyebrow">{p.badges.community.eyebrow}</div>
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              {p.badges.community.of(earnedCommunity, recognitions.length)}
            </span>
          </div>
          <BadgeList items={recognitions} />
        </div>

        <button className="btn btn--ghost btn--block" onClick={onBack}>
          {p.back}
        </button>
      </div>
    )
  }

  /* ----------------------------------------------------------- peer view */
  const author = mockAuthors.find((a) => a.id === authorId) ?? mockAuthors[0]
  const badgeIds: CommunityAchievementId[] = author.badges ?? []
  const peerBadges = badgeIds.map((id) => ({ id, earned: true, ...t.community.achievements[id] }))

  return (
    <div className="stack">
      <div className="card profile-head">
        <BigAvatar photoDataUrl={author.photoDataUrl ?? null} initials={author.initials} />
        <div className="profile-head__name">{author.name}</div>
        <p className="profile-head__bio">{author.bio?.trim() || p.peer.noBio}</p>
      </div>

      <div className="card">
        <div className="eyebrow">{p.badges.community.eyebrow}</div>
        {peerBadges.length === 0 ? (
          <p className="muted" style={{ margin: '10px 0 0' }}>{p.badges.empty}</p>
        ) : (
          <BadgeList items={peerBadges} />
        )}
      </div>

      <p className="mentor__note">{p.peer.note}</p>

      <button className="btn btn--ghost btn--block" onClick={onBack}>
        {p.back}
      </button>
    </div>
  )
}
