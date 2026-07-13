import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, TextInput, View, type NativeSyntheticEvent, type ImageLoadEventData } from 'react-native';
import { PanGestureHandler, State, type PanGestureHandlerGestureEvent, type PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/expo';

import { Text } from '@/components/Themed';
import Icon from '@/components/Icon';
import { buttonTextStyles } from '@/components/Button';
import { colors, fonts } from '@/constants/theme';

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;

interface AvatarPosition {
  x: number;
  y: number;
  scale: number;
}

interface NaturalSize {
  w: number;
  h: number;
}

// 必須跟下面 avatar 樣式的寬高一致，才能正確算出縮放後的可拖曳範圍（對照 apps/web AccountHeader.tsx）
const AVATAR_SIZE = 76;
const DEFAULT_POS: AvatarPosition = { x: 50, y: 50, scale: 1 };
const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const readAvatarPosition = (metadata: unknown): AvatarPosition => {
  const pos = (metadata as { avatarPosition?: Partial<AvatarPosition> } | null | undefined)?.avatarPosition;
  if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    const scale = Number.isFinite(pos.scale) ? clamp(pos.scale as number, MIN_SCALE, MAX_SCALE) : 1;
    return { x: clamp(pos.x as number, 0, 100), y: clamp(pos.y as number, 0, 100), scale };
  }
  return DEFAULT_POS;
};

// 圖片以「短邊貼齊裁切框」為基準（等同 cover），使用者的縮放倍率疊加在這個基準之上，
// 這樣兩軸的可拖曳範圍（overflow）才會隨縮放正確增加，而不是只放大裁切後的畫面
const getOverflow = (natural: NaturalSize, scale: number) => {
  const baseScale = AVATAR_SIZE / Math.min(natural.w, natural.h);
  const effectiveScale = baseScale * scale;
  const renderedW = natural.w * effectiveScale;
  const renderedH = natural.h * effectiveScale;
  return {
    renderedW,
    renderedH,
    overflowX: Math.max(0, renderedW - AVATAR_SIZE),
    overflowY: Math.max(0, renderedH - AVATAR_SIZE),
  };
};

// RN 的 fetch().blob() 對本機 file:// URI 常會丟出「Creating blobs from 'ArrayBuffer' and
// 'ArrayBufferView' are not supported」——RN 的 Blob 實作沒辦法從 fetch 內部轉出的 ArrayBuffer
// 建立 Blob，只有透過 XMLHttpRequest 直接以 responseType='blob' 取得的 Blob 才是原生模組認得的
// 那種（RN 社群/Firebase Storage RN 文件都是用這個 workaround），所以這裡改用 XHR 而不是 fetch。
const uriToBlob = (uri: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('讀取照片檔案失敗'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

interface AccountHeaderProps {
  user: ClerkUser;
}

// 對照 apps/web 的 AccountHeader.tsx；web 版用滑鼠 pointer 事件算拖曳量，這裡改用
// react-native-gesture-handler 的 PanGestureHandler，translationX/Y 本來就是相對手勢起點
// 的累計位移，跟 web 版「從 pointerdown 起點算 dx/dy」是同一個概念，換算公式整段照搬。
export default function AccountHeader({ user }: AccountHeaderProps) {
  const dragStartPos = useRef<AvatarPosition | null>(null);

  const [pos, setPos] = useState<AvatarPosition>(() => readAvatarPosition(user.unsafeMetadata));
  const [posBeforeEdit, setPosBeforeEdit] = useState<AvatarPosition>(pos);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);

  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user.firstName ?? '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    // 正在拖曳／縮放調整頭像時，不能因為 Clerk user 物件因為其他更新（如改名）而重新同步，
    // 蓋掉使用者還沒按「完成」儲存的操作
    if (isRepositioning) return;
    setPos(readAvatarPosition(user.unsafeMetadata));
  }, [user.unsafeMetadata, isRepositioning]);

  useEffect(() => {
    setNaturalSize(null);
  }, [user.imageUrl]);

  useEffect(() => {
    setNameValue(user.firstName ?? '');
  }, [user.firstName]);

  const saveMetadata = async (nextPos: AvatarPosition) => {
    const metadata: Record<string, unknown> = { ...user.unsafeMetadata, avatarPosition: nextPos };
    await user.update({ unsafeMetadata: metadata });
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('沒有相簿權限', '請到系統設定開啟 EasyLearn 的相簿存取權限');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets[0]) return;

    setPosBeforeEdit(pos);
    setUploading(true);
    try {
      const blob = await uriToBlob(result.assets[0].uri);
      await user.setProfileImage({ file: blob });
      // 立刻把新照片的預設裁切位置存進 Clerk metadata：就算使用者這次調整完直接按「取消」，
      // 下次讀到的也是這張新照片的預設值，不會沿用上一張照片留下的舊裁切座標
      await saveMetadata(DEFAULT_POS);
      setPos(DEFAULT_POS);
      setPosBeforeEdit(DEFAULT_POS);
      setIsRepositioning(true);
    } catch (err) {
      console.error('avatar upload failed', err);
      Alert.alert('上傳照片失敗', '請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  const cancelReposition = () => {
    setPos(posBeforeEdit);
    setIsRepositioning(false);
  };

  const confirmReposition = async () => {
    try {
      await saveMetadata(pos);
      setIsRepositioning(false);
    } catch (err) {
      console.error('save avatar position failed', err);
      Alert.alert('儲存頭像位置失敗', '請稍後再試');
    }
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!isRepositioning || !naturalSize || !dragStartPos.current) return;
    const startPos = dragStartPos.current;
    const { overflowX, overflowY } = getOverflow(naturalSize, startPos.scale);
    const { translationX, translationY } = event.nativeEvent;
    const nextX = overflowX > 0 ? clamp(startPos.x + (translationX / (overflowX / 2)) * 50, 0, 100) : 50;
    const nextY = overflowY > 0 ? clamp(startPos.y + (translationY / (overflowY / 2)) * 50, 0, 100) : 50;
    setPos({ x: nextX, y: nextY, scale: startPos.scale });
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (!isRepositioning) return;
    if (event.nativeEvent.state === State.BEGAN) {
      dragStartPos.current = pos;
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      dragStartPos.current = null;
    }
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      await user.update({ firstName: trimmed });
      setNameEditing(false);
    } catch (err) {
      console.error('save name failed', err);
      Alert.alert('儲存名稱失敗', '請稍後再試');
    } finally {
      setSavingName(false);
    }
  };

  const cancelNameEdit = () => {
    setNameValue(user.firstName ?? '');
    setNameEditing(false);
  };

  const handleImageLoad = (e: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { width, height } = e.nativeEvent.source;
    setNaturalSize({ w: width, h: height });
  };

  const imgStyle = naturalSize
    ? (() => {
        const { renderedW, renderedH, overflowX, overflowY } = getOverflow(naturalSize, pos.scale);
        const fracX = (pos.x - 50) / 50;
        const fracY = (pos.y - 50) / 50;
        return {
          position: 'absolute' as const,
          width: renderedW,
          height: renderedH,
          left: (AVATAR_SIZE - renderedW) / 2 + fracX * (overflowX / 2),
          top: (AVATAR_SIZE - renderedH) / 2 + fracY * (overflowY / 2),
        };
      })()
    : { width: '100%' as const, height: '100%' as const };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <PanGestureHandler
            enabled={isRepositioning}
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <View style={[styles.avatar, isRepositioning && styles.avatarRepositioning]}>
              {user.hasImage ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={imgStyle}
                  onLoad={handleImageLoad}
                />
              ) : user.firstName ? (
                <Text style={styles.avatarInitial}>{user.firstName[0].toUpperCase()}</Text>
              ) : (
                <Icon name="user" size={28} color={colors.inkSoft} />
              )}
            </View>
          </PanGestureHandler>
          <Pressable style={styles.avatarEditBtn} onPress={pickAvatar} disabled={uploading}>
            <Icon name="pencil" size={11} color={colors.primaryInk} />
          </Pressable>
        </View>

        <View style={styles.info}>
          {nameEditing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameValue}
                onChangeText={setNameValue}
                maxLength={40}
                autoFocus
              />
              <Pressable onPress={saveName} disabled={savingName || !nameValue.trim()} hitSlop={8}>
                <Icon name="check-circle" size={14} color={colors.primary} />
              </Pressable>
              <Pressable onPress={cancelNameEdit} disabled={savingName} hitSlop={8}>
                <Icon name="x" size={14} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.firstName || '未命名'}</Text>
              <Pressable onPress={() => setNameEditing(true)} hitSlop={8}>
                <Icon name="pencil" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {isRepositioning && (
        <View style={styles.repositionPanel}>
          <View style={styles.zoomRow}>
            <Slider
              style={styles.zoomSlider}
              minimumValue={MIN_SCALE}
              maximumValue={MAX_SCALE}
              step={0.05}
              value={pos.scale}
              onValueChange={(v) => setPos((prev) => ({ ...prev, scale: clamp(v, MIN_SCALE, MAX_SCALE) }))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="rgba(255, 180, 84, 0.25)"
              thumbTintColor={colors.primary}
            />
          </View>
          <View style={styles.repositionActions}>
            <Pressable style={styles.repositionBtn} onPress={confirmReposition}>
              <Icon name="check-circle" size={14} color={colors.primary} />
              <Text style={buttonTextStyles.text}>完成</Text>
            </Pressable>
            <Pressable style={styles.repositionBtn} onPress={cancelReposition}>
              <Icon name="x" size={14} color={colors.primary} />
              <Text style={buttonTextStyles.text}>取消</Text>
            </Pressable>
          </View>
          <Text style={styles.repositionNote}>拖曳照片可移動位置，拉桿可縮放，完成後按「完成」儲存。</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.optionBg,
    borderWidth: 2,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRepositioning: {
    // 原本用 borderStyle:'dashed' 表示「正在調整」，但 RN 的 dashed border 疊在圓形
    // （borderRadius 50%）上是已知的平台限制，繞著曲線的虛線間距算不出來，實機上只會
    // 斷斷續續露出一小段，不是我們的樣式寫錯——改用純色框，一樣能清楚表示進入編輯模式。
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontFamily: fonts.mono.bold,
    fontWeight: '700',
    fontSize: 26,
    color: colors.cyan,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.optionBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.bg,
  },
  repositionPanel: {
    gap: 10,
    marginTop: 10,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomSlider: {
    flex: 1,
  },
  repositionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  repositionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  repositionNote: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.inkSoft,
  },
});
