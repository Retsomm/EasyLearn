import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useUser } from '@clerk/nextjs'
import Icon from './Icons'

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

interface AvatarPosition {
  x: number
  y: number
}

const DEFAULT_POS: AvatarPosition = { x: 50, y: 50 }
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const readAvatarPosition = (metadata: unknown): AvatarPosition => {
  const pos = (metadata as { avatarPosition?: AvatarPosition } | null | undefined)?.avatarPosition
  if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') return pos
  return DEFAULT_POS
}

interface AccountHeaderProps {
  user: ClerkUser
}

const AccountHeader = ({ user }: AccountHeaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPos: AvatarPosition } | null>(null)

  const [pos, setPos] = useState<AvatarPosition>(() => readAvatarPosition(user.unsafeMetadata))
  const [posBeforeEdit, setPosBeforeEdit] = useState<AvatarPosition>(pos)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [nameEditing, setNameEditing] = useState(false)
  const [nameValue, setNameValue] = useState(user.firstName ?? '')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    setPos(readAvatarPosition(user.unsafeMetadata))
  }, [user.unsafeMetadata])

  useEffect(() => {
    setNameValue(user.firstName ?? '')
  }, [user.firstName])

  const saveMetadata = async (nextPos: AvatarPosition) => {
    const metadata: Record<string, unknown> = { ...user.unsafeMetadata, avatarPosition: nextPos }
    await user.update({ unsafeMetadata: metadata })
  }

  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await user.setProfileImage({ file })
      setPos(DEFAULT_POS)
      await saveMetadata(DEFAULT_POS)
    } finally {
      setUploading(false)
    }
  }

  const startReposition = () => {
    setPosBeforeEdit(pos)
    setIsRepositioning(true)
  }

  const cancelReposition = () => {
    setPos(posBeforeEdit)
    setIsRepositioning(false)
  }

  const confirmReposition = async () => {
    setIsRepositioning(false)
    await saveMetadata(pos)
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRepositioning) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: pos }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRepositioning || !dragRef.current || !avatarRef.current) return
    const { width, height } = avatarRef.current.getBoundingClientRect()
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPos({
      x: clamp(dragRef.current.startPos.x - (dx / width) * 100, 0, 100),
      y: clamp(dragRef.current.startPos.y - (dy / height) * 100, 0, 100),
    })
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const saveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed) return
    setSavingName(true)
    try {
      await user.update({ firstName: trimmed, lastName: '' })
      setNameEditing(false)
    } finally {
      setSavingName(false)
    }
  }

  const cancelNameEdit = () => {
    setNameValue(user.firstName ?? '')
    setNameEditing(false)
  }

  return (
    <div className="account-header">
      <div
        ref={avatarRef}
        className={`account-avatar ${isRepositioning ? 'is-repositioning' : ''}`}
        style={user.hasImage ? { backgroundImage: `url(${user.imageUrl})`, backgroundPosition: `${pos.x}% ${pos.y}%` } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {!user.hasImage && <Icon name="user" size={28} />}
      </div>

      <div className="account-avatar-actions">
        <button className="text-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Icon name="upload" size={14} />
          {uploading ? '上傳中…' : '上傳照片'}
        </button>
        {user.hasImage && !isRepositioning && (
          <button className="text-btn" onClick={startReposition}>
            <Icon name="move" size={14} />
            調整位置
          </button>
        )}
        {isRepositioning && (
          <>
            <button className="text-btn" onClick={confirmReposition}>
              <Icon name="check-circle" size={14} />
              完成
            </button>
            <button className="text-btn" onClick={cancelReposition}>
              <Icon name="x" size={14} />
              取消
            </button>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarFile} />
      </div>
      {isRepositioning && <p className="storage-note">拖曳照片調整顯示位置，完成後按「完成」儲存。</p>}

      <div className="account-name-row">
        {nameEditing ? (
          <>
            <input
              className="account-name-input"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              maxLength={40}
              autoFocus
            />
            <button className="text-btn" onClick={saveName} disabled={savingName}>
              <Icon name="check-circle" size={14} />
            </button>
            <button className="text-btn" onClick={cancelNameEdit} disabled={savingName}>
              <Icon name="x" size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="account-name">{user.firstName || '未命名'}</span>
            <button className="text-btn" onClick={() => setNameEditing(true)}>
              <Icon name="pencil" size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AccountHeader
