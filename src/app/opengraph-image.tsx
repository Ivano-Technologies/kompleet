// Card revision 4 (900px wordmark, new card line). Editing this file changes the image URL cache key.
import {
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderBrandImage,
} from "@/lib/seo/og/brandImage";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderBrandImage();
}
