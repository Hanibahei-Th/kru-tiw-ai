import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_DIMENSION = 1024;

export type PreparedImage = { uri: string; base64: string };

type SourceAsset = { uri: string; width?: number; height?: number };

export async function prepareImage(asset: SourceAsset): Promise<PreparedImage> {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const longestSide = Math.max(width, height);

  const actions =
    longestSide > MAX_DIMENSION
      ? [width >= height ? { resize: { width: MAX_DIMENSION } } : { resize: { height: MAX_DIMENSION } }]
      : [];

  const result = await manipulateAsync(asset.uri, actions, {
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return { uri: result.uri, base64: result.base64 ?? "" };
}
