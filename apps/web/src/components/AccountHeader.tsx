import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useUser } from '@clerk/nextjs'
import Icon from '@/components/Icons'

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

interface AvatarPosition {
  x: number
  y: number
  scale: number
}

interface NaturalSize {
  w: number
  h: number
}

// 必須跟 .account-avatar 的 CSS 寬高一致，才能正確算出縮放後的可拖曳範圍
const AVATAR_SIZE = 76
const DEFAULT_POS: AvatarPosition = { x: 50, y: 50, scale: 1 }
const MIN_SCALE = 1
const MAX_SCALE = 2.5
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const readAvatarPosition = (metadata: unknown): AvatarPosition => {
  const pos = (metadata as { avatarPosition?: Partial<AvatarPosition> } | null | undefined)?.avatarPosition
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    const scale = Number.isFinite(pos.scale) ? clamp(pos.scale as number, MIN_SCALE, MAX_SCALE) : 1
    return { x: clamp(pos.x as number, 0, 100), y: clamp(pos.y as number, 0, 100), scale }
  }
  return DEFAULT_POS
}

// 圖片以「短邊貼齊裁切框」為基準（等同 cover），使用者的縮放倍率疊加在這個基準之上，
// 這樣兩軸的可拖曳範圍（overflow）才會隨縮放正確增加，而不是只放大裁切後的畫面
const getOverflow = (natural: NaturalSize, scale: number) => {
  const baseScale = AVATAR_SIZE / Math.min(natural.w, natural.h)
  const effectiveScale = baseScale * scale
  const renderedW = natural.w * effectiveScale
  const renderedH = natural.h * effectiveScale
  return {
    renderedW,
    renderedH,
    overflowX: Math.max(0, renderedW - AVATAR_SIZE),
    overflowY: Math.max(0, renderedH - AVATAR_SIZE),
  }
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
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null)

  const [nameEditing, setNameEditing] = useState(false)
  const [nameValue, setNameValue] = useState(user.firstName ?? '')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    // 正在拖曳／縮放調整頭像時，不能因為 Clerk user 物件因為其他更新（如改名）而重新同步，
    // 蓋掉使用者還沒按「完成」儲存的操作
    if (isRepositioning) return
    setPos(readAvatarPosition(user.unsafeMetadata))
  }, [user.unsafeMetadata, isRepositioning])

  useEffect(() => {
    setNaturalSize(null)
  }, [user.imageUrl])

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
    setPosBeforeEdit(pos)
    setUploading(true)
    try {
      await user.setProfileImage({ file })
      // 立刻把新照片的預設裁切位置存進 Clerk metadata：就算使用者這次調整完直接按「取消」，
      // 下次讀到的也是這張新照片的預設值，不會沿用上一張照片留下的舊裁切座標
      await saveMetadata(DEFAULT_POS)
      setPos(DEFAULT_POS)
      setPosBeforeEdit(DEFAULT_POS)
      setIsRepositioning(true)
    } catch (err) {
      console.error('avatar upload failed', err)
      alert('上傳照片失敗，請稍後再試')
    } finally {
      setUploading(false)
    }
  }

  const handleZoomChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPos((prev) => ({ ...prev, scale: clamp(Number(e.target.value), MIN_SCALE, MAX_SCALE) }))
  }

  const cancelReposition = () => {
    setPos(posBeforeEdit)
    setIsRepositioning(false)
  }

  const confirmReposition = async () => {
    try {
      await saveMetadata(pos)
      setIsRepositioning(false)
    } catch (err) {
      console.error('save avatar position failed', err)
      alert('儲存頭像位置失敗，請稍後再試')
    }
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRepositioning) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: pos }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRepositioning || !dragRef.current || !naturalSize) return
    const { startPos } = dragRef.current
    const { overflowX, overflowY } = getOverflow(naturalSize, startPos.scale)
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    // 拖曳量換算成 0~100（50 為置中）的相對位置，拖曳範圍依目前縮放後的可拖曳寬高（overflow）計算，
    // 若某一軸沒有可拖曳空間（overflow 為 0）就固定在置中，不會硬要換算出無意義的位移
    const nextX = overflowX > 0 ? clamp(startPos.x + (dx / (overflowX / 2)) * 50, 0, 100) : 50
    const nextY = overflowY > 0 ? clamp(startPos.y + (dy / (overflowY / 2)) * 50, 0, 100) : 50
    setPos({ x: nextX, y: nextY, scale: startPos.scale })
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const saveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed) return
    setSavingName(true)
    try {
      await user.update({ firstName: trimmed })
      setNameEditing(false)
    } catch (err) {
      console.error('save name failed', err)
      alert('儲存名稱失敗，請稍後再試')
    } finally {
      setSavingName(false)
    }
  }

  const cancelNameEdit = () => {
    setNameValue(user.firstName ?? '')
    setNameEditing(false)
  }

  const imgStyle: CSSProperties = naturalSize
    ? (() => {
        const { renderedW, renderedH, overflowX, overflowY } = getOverflow(naturalSize, pos.scale)
        const fracX = (pos.x - 50) / 50
        const fracY = (pos.y - 50) / 50
        return {
          position: 'absolute',
          width: renderedW,
          height: renderedH,
          left: (AVATAR_SIZE - renderedW) / 2 + fracX * (overflowX / 2),
          top: (AVATAR_SIZE - renderedH) / 2 + fracY * (overflowY / 2),
        }
      })()
    : { width: '100%', height: '100%', objectFit: 'cover' }

  return (
    <div className="account-header">
      <div className="account-header-row">
        <div className="account-avatar-wrap">
          <div
            ref={avatarRef}
            className={`account-avatar ${isRepositioning ? 'is-repositioning' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {user.hasImage ? (
              <img
                className="account-avatar-img"
                src={user.imageUrl}
                alt=""
                draggable={false}
                onLoad={(e) =>
                  setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
                }
                style={imgStyle}
              />
            ) : user.firstName ? (
              <span className="account-avatar-initial">{user.firstName[0].toUpperCase()}</span>
            ) : (
              <Icon name="user" size={28} />
            )}
          </div>
          <button
            className="account-avatar-edit"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label={uploading ? '上傳中' : '上傳照片'}
          >
            <Icon name="pencil" size={11} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarFile} />
        </div>

        <div className="account-info">
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
      </div>

      {isRepositioning && (
        <div className="avatar-reposition">
          <label className="avatar-zoom">
            <Icon name="search" size={13} />
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.05}
              value={pos.scale}
              onChange={handleZoomChange}
            />
          </label>
          <div className="avatar-reposition-actions">
            <button className="text-btn" onClick={confirmReposition}>
              <Icon name="check-circle" size={14} />
              完成
            </button>
            <button className="text-btn" onClick={cancelReposition}>
              <Icon name="x" size={14} />
              取消
            </button>
          </div>
          <p className="storage-note">拖曳照片可移動位置，拉桿可縮放，完成後按「完成」儲存。</p>
        </div>
      )}
    </div>
  )
}

export default AccountHeader
