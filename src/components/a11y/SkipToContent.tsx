/** First focusable control on marketing and auth pages. */
export function SkipToContent({
  href = "#main-content",
}: {
  href?: string;
}) {
  return (
    <a href={href} className="skip-to-content">
      Skip to content
    </a>
  );
}
