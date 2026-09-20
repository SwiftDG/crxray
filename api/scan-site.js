import dns from 'node:dns/promises'
import net from 'node:net'

const TRACKERS = [
  { name: 'Google Analytics', match: 'google-analytics.com' },
  { name: 'Google Tag Manager', match: 'googletagmanager.com' },
  { name: 'Google Ads', match: 'doubleclick.net' },
  { name: 'Meta Pixel', match: 'connect.facebook.net' },
  { name: 'Hotjar', match: 'hotjar.com' },
  { name: 'Microsoft Clarity', match: 'clarity.ms' },
  { name: 'Segment', match: 'segment.com' },
  { name: 'Mixpanel', match: 'mixpanel.com' },
  { name: 'TikTok Pixel', match: 'analytics.tiktok.com' },
]

const CONSENT_PROVIDERS = [
  { name: 'OneTrust', match: 'onetrust' },
  { name: 'Cookiebot', match: 'cookiebot' },
  { name: 'TrustArc', match: 'trustarc' },
  { name: 'Didomi', match: 'didomi' },
  { name: 'Osano', match: 'osano' },
  { name: 'Quantcast Choice', match: 'quantcast' },
]

function sendJson(response, status, payload) {
  response.status(status).json(payload)
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [first, second] = address.split('.').map(Number)

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first >= 224
    )
  }

  const value = address.toLowerCase()

  return (
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe80') ||
    value.startsWith('::ffff:127.')
  )
}

async function assertPublicHost(hostname) {
  const localNames = ['localhost', '0.0.0.0']

  if (localNames.includes(hostname) || hostname.endsWith('.local')) {
    throw new Error('CrxRay can only scan public websites.')
  }

  const records = await dns.lookup(hostname, { all: true })

  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error('CrxRay can only scan public websites.')
  }
}

function parseTarget(value = '') {
  const raw = value.trim()

  if (!raw) {
    throw new Error('Enter a website URL to scan.')
  }

  const target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)

  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('Use a public http or https website URL.')
  }

  if (target.username || target.password) {
    throw new Error('Website URLs with embedded credentials are not supported.')
  }

  if (target.port && !['80', '443'].includes(target.port)) {
    throw new Error('Only standard public website ports are supported.')
  }

  return target
}

async function fetchPublicPage(initialUrl) {
  let currentUrl = initialUrl

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await assertPublicHost(currentUrl.hostname)

    const pageResponse = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'CrxRay privacy scanner',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if ([301, 302, 303, 307, 308].includes(pageResponse.status)) {
      const location = pageResponse.headers.get('location')

      if (!location) {
        throw new Error('The website redirected without a destination.')
      }

      currentUrl = new URL(location, currentUrl)
      continue
    }

    return { currentUrl, pageResponse }
  }

  throw new Error('The website redirected too many times.')
}

function getPageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  return match ? match[1].replace(/\s+/g, ' ').trim().slice(0, 120) : 'Untitled website'
}

function getThirdPartyScripts(html, hostname) {
  const matches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
  const hosts = new Set()

  for (const match of matches) {
    try {
      const scriptUrl = new URL(match[1], `https://${hostname}`)

      if (scriptUrl.hostname !== hostname && !scriptUrl.hostname.endsWith(`.${hostname}`)) {
        hosts.add(scriptUrl.hostname)
      }
    } catch {
      // Ignore malformed script URLs.
    }
  }

  return hosts.size
}

function addSignal(signals, title, level, detail, points) {
  signals.push({ title, level, detail, points })
}

function buildAssessment(html, hostname) {
  const content = html.toLowerCase()
  const signals = []
  const trackers = TRACKERS.filter((tracker) => content.includes(tracker.match))
  const consentProvider = CONSENT_PROVIDERS.find((provider) => content.includes(provider.match))
  const cookieNoticeDetected =
    content.includes('cookie consent') ||
    content.includes('cookie banner') ||
    content.includes('accept cookies') ||
    content.includes('cookie preferences') ||
    Boolean(consentProvider)

  const acceptsAll = /accept all|accept cookies|allow all/i.test(html)
  const rejectsAll = /reject all|decline all|reject cookies/i.test(html)
  const hasSettings = /manage preferences|cookie settings|customize cookies|manage cookies/i.test(html)
  const thirdPartyScriptCount = getThirdPartyScripts(html, hostname)

  if (cookieNoticeDetected) {
    addSignal(
      signals,
      'Cookie consent interface detected',
      consentProvider ? 'Detected' : 'Possible',
      consentProvider
        ? `This page appears to use ${consentProvider.name} to manage consent choices.`
        : 'This page contains common cookie-consent language in its public page source.',
      4,
    )
  } else {
    addSignal(
      signals,
      'No cookie-consent pattern found',
      'Review needed',
      'CrxRay did not find a common consent banner pattern in the fetched page source. The site may still load one after the page opens.',
      8,
    )
  }

  if (trackers.length > 0) {
    addSignal(
      signals,
      `${trackers.length} common tracking service${trackers.length === 1 ? '' : 's'} found`,
      trackers.length >= 3 ? 'High concern' : 'Review needed',
      `CrxRay found references to ${trackers.map((tracker) => tracker.name).join(', ')} in the public page source.`,
      trackers.length >= 3 ? 28 : 15,
    )
  }

  if (acceptsAll && !rejectsAll) {
    addSignal(
      signals,
      'Accept option found without an equally clear reject option',
      'Review needed',
      'The page source suggests consent may be easier to accept than to decline. Check the banner carefully before choosing.',
      16,
    )
  }

  if (hasSettings) {
    addSignal(
      signals,
      'Preference controls appear available',
      'Positive signal',
      'The page appears to provide a way to review or customise consent choices.',
      2,
    )
  }

  if (thirdPartyScriptCount >= 10) {
    addSignal(
      signals,
      'Many third-party scripts loaded',
      'Review needed',
      `CrxRay found ${thirdPartyScriptCount} third-party script hosts in the public page source.`,
      16,
    )
  }

  const score = Math.min(100, signals.reduce((total, signal) => total + signal.points, 0))
  const grade = score >= 70 ? 'D' : score >= 45 ? 'C' : score >= 20 ? 'B' : 'A'

  const statusByGrade = {
    A: 'Lower privacy concern',
    B: 'Some privacy signals need context',
    C: 'Elevated tracking or consent signals found',
    D: 'High privacy concern signals found',
  }

  const summaryByGrade = {
    A: 'CrxRay found relatively few tracking and consent concerns in the public page source.',
    B: 'This page contains some tracking or consent signals worth reviewing before accepting cookies.',
    C: 'This page exposes several tracking or consent signals. Review the consent choices before accepting.',
    D: 'This page exposes multiple tracking or consent signals. Review the banner carefully and avoid accepting everything by default.',
  }

  return {
    grade,
    score,
    status: statusByGrade[grade],
    summary: summaryByGrade[grade],
    signals,
    trackers: trackers.map((tracker) => tracker.name),
    cookieNotice: {
      detected: cookieNoticeDetected,
      provider: consentProvider?.name ?? null,
      acceptsAll,
      rejectsAll,
      hasSettings,
    },
    thirdPartyScriptCount,
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'Use a GET request for website privacy scans.' })
  }

  try {
    const target = parseTarget(request.query.url)
    const { currentUrl, pageResponse } = await fetchPublicPage(target)

    if (!pageResponse.ok) {
      throw new Error(`The website returned HTTP ${pageResponse.status}.`)
    }

    const html = (await pageResponse.text()).slice(0, 1_500_000)
    const assessment = buildAssessment(html, currentUrl.hostname)

    return sendJson(response, 200, {
      url: currentUrl.toString(),
      host: currentUrl.hostname,
      title: getPageTitle(html),
      ...assessment,
    })
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'CrxRay could not scan this website.',
    })
  }
}
