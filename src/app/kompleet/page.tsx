import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export default async function KompleetPage() {
  const htmlContent = fs.readFileSync(
    path.join(process.cwd(), 'public', 'kompleet.html'),
    'utf-8'
  );
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
