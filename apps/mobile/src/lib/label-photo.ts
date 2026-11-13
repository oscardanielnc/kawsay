import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Long side of the photo sent to the API: small print stays legible, the request stays under the 1.5 MB limit. */
const MAX_SIDE = 1600;

/**
 * A food label photo from the camera or the gallery (F23 piece 3), cropped by the user to the nutrition table and
 * shrunk to a JPEG. Nothing is stored: the image goes to the API once and is dropped. null when the user cancels or
 * denies the permission.
 */
export async function takeLabelPhoto(
  from: 'camera' | 'library',
): Promise<{ base64: string; mimeType: 'image/jpeg' } | null> {
  const permission =
    from === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  };
  const result =
    from === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const wide = asset.width >= asset.height;
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(wide ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ base64: true, compress: 0.8, format: SaveFormat.JPEG });
  return saved.base64 ? { base64: saved.base64, mimeType: 'image/jpeg' } : null;
}
