import { getPageImage, source } from '@/lib/source';
import { baseUrl } from '@/lib/shared';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

export const revalidate = false;

async function loadFont(family: string, weight = 400): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(url, {
    headers: {
      // IE9 UA makes Google Fonts return woff (not woff2); Satori supports woff but not woff2
      'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    },
  }).then((r) => r.text());
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error(`Could not find font URL for ${family} ${weight}`);
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const [pressStart2PData, ibmPlexMonoData] = await Promise.all([
    loadFont('Press Start 2P'),
    loadFont('IBM Plex Mono'),
  ]);

  const title = page.data.title;
  const description = page.data.description
    ? page.data.description.length > 120
      ? `${page.data.description.slice(0, 120)}…`
      : page.data.description
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#0D0D0D',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 3px)',
          position: 'relative',
        }}
      >
        {/* Right gold accent bar */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 6,
            height: '100%',
            backgroundColor: '#F5C800',
          }}
        />
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 80px 48px 64px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top label */}
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 16,
              color: '#888888',
              letterSpacing: '0.05em',
            }}
          >
            is-pinoy.dev docs
          </span>

          {/* Center: title + description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span
              style={{
                fontFamily: 'Press Start 2P',
                fontSize: 38,
                color: '#F5C800',
                lineHeight: 1.5,
                maxWidth: 900,
              }}
            >
              {title}
            </span>
            {description && (
              <span
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 20,
                  color: '#FAFAF5',
                  lineHeight: 1.5,
                  maxWidth: 900,
                }}
              >
                {description}
              </span>
            )}
          </div>

          {/* Bottom: domain */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 16,
                color: '#888888',
                letterSpacing: '0.05em',
              }}
            >
              {baseUrl.replace('https://', '')}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Press Start 2P', data: pressStart2PData, weight: 400, style: 'normal' },
        { name: 'IBM Plex Mono', data: ibmPlexMonoData, weight: 400, style: 'normal' },
      ],
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
