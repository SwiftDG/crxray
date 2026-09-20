import AdmZip from 'adm-zip'

const EXTENSION_ID_PATTERN = /^[a-p]{32}$/

function sendJson(response, status, payload) {
  response.status(status).json(payload)
}

function getExtensionId(value = '') {
  const candidate = value.trim().toLowerCase()

  if (EXTENSION_ID_PATTERN.test(candidate)) {
    return candidate
  }

  const match = candidate.match(/[a-p]{32}/)
  return match ? match[0] : null
}

function getZipPayload(buffer) {
  const crxMagic = buffer.subarray(0, 4).toString('utf8')

  if (crxMagic !== 'Cr24') {
    return buffer
  }

  const version = buffer.readUInt32LE(4)
  let offset = 16

  if (version === 3) {
    offset = 12 + buffer.readUInt32LE(8)
  }

  const payload = buffer.subarray(offset)

  if (payload.subarray(0, 4).toString('utf8') !== 'PK\u0003\u0004') {
    throw new Error('The extension package did not contain a readable manifest.')
  }

  return payload
}

function addSignal(signals, key, title, level, detail, points) {
  signals.push({ key, title, level, detail, points })
}

function buildAssessment(manifest) {
  const permissions = [
    ...(manifest.permissions ?? []),
    ...(manifest.optional_permissions ?? []),
    ...(manifest.host_permissions ?? []),
    ...(manifest.optional_host_permissions ?? []),
  ]

  const normalized = permissions.map((permission) => String(permission).toLowerCase())
  const signals = []
  const hasBroadHostAccess = normalized.some(
    (permission) =>
      permission === '<all_urls>' ||
      permission === '*://*/*' ||
      permission === 'http://*/*' ||
      permission === 'https://*/*',
  )

  if (hasBroadHostAccess) {
    addSignal(
      signals,
      'eye',
      'Reads and changes data on every website',
      'High concern',
      'This host access can let an extension view page content, alter what you see, and interact with forms across many websites.',
      30,
    )
  }

  if (normalized.includes('history')) {
    addSignal(
      signals,
      'history',
      'Requests access to browsing history',
      'High concern',
      'This can expose details about the websites and pages a person has visited.',
      22,
    )
  }

  if (normalized.includes('tabs')) {
    addSignal(
      signals,
      'tabs',
      'Reads information about browser tabs',
      'Review needed',
      'This can reveal details about open tabs and the pages currently being visited.',
      12,
    )
  }

  if (normalized.includes('cookies')) {
    addSignal(
      signals,
      'cookies',
      'Requests access to browser cookies',
      'High concern',
      'Cookies can contain session information. Access should be strongly justified by the extension’s purpose.',
      25,
    )
  }

  if (normalized.includes('webrequest') || normalized.includes('webrequestblocking')) {
    addSignal(
      signals,
      'network',
      'Observes browser network requests',
      'High concern',
      'This can expose requests made while browsing and may reveal activity across websites.',
      24,
    )
  }

  if (normalized.includes('clipboardread') || normalized.includes('clipboardwrite')) {
    addSignal(
      signals,
      'clipboard',
      'Reads or writes clipboard content',
      'Review needed',
      'Clipboard access can expose copied text such as links, messages, or sensitive details.',
      14,
    )
  }

  if (normalized.includes('management')) {
    addSignal(
      signals,
      'management',
      'Can inspect other browser extensions',
      'High concern',
      'This may reveal which extensions are installed and can affect browser-extension management.',
      24,
    )
  }

  if (normalized.includes('downloads')) {
    addSignal(
      signals,
      'downloads',
      'Can manage downloads',
      'Review needed',
      'The extension can interact with downloaded files and download activity.',
      12,
    )
  }

  if (normalized.includes('nativemessaging')) {
    addSignal(
      signals,
      'native',
      'Can communicate with installed desktop software',
      'High concern',
      'This allows communication between the browser extension and native applications on a device.',
      28,
    )
  }

  if (normalized.includes('debugger')) {
    addSignal(
      signals,
      'debugger',
      'Requests browser debugging access',
      'High concern',
      'Debugging access is powerful and should only be granted to extensions with a clear, trusted purpose.',
      30,
    )
  }

  if (normalized.includes('proxy')) {
    addSignal(
      signals,
      'proxy',
      'Can control browser proxy settings',
      'High concern',
      'Proxy control can affect how browser traffic is routed.',
      26,
    )
  }

  if (manifest.background?.service_worker || manifest.background?.scripts) {
    addSignal(
      signals,
      'background',
      'Uses background activity',
      'Expected',
      'The extension can continue performing allowed tasks when its popup is closed.',
      4,
    )
  }

  if (signals.length === 0) {
    addSignal(
      signals,
      'shield',
      'No high-sensitivity permission found',
      'Lower concern',
      'The manifest did not expose one of CrxRay’s highest-sensitivity permission signals.',
      5,
    )
  }

  const score = Math.min(100, signals.reduce((total, signal) => total + signal.points, 0))
  const grade = score >= 80 ? 'D' : score >= 55 ? 'C' : score >= 25 ? 'B' : 'A'

  const statusByGrade = {
    A: 'Lower risk profile',
    B: 'Some permissions need context',
    C: 'Elevated risk signals found',
    D: 'High risk signals found',
  }

  const summaryByGrade = {
    A: 'This extension requests a relatively limited permission set based on the public manifest.',
    B: 'Some permissions need a quick review to confirm that they match what the extension claims to do.',
    C: 'This extension requests several sensitive permissions. Check the publisher and purpose before installing.',
    D: 'This extension requests broad or sensitive access. Do not install it until you understand why each permission is needed.',
  }

  return {
    grade,
    score,
    status: statusByGrade[grade],
    summary: summaryByGrade[grade],
    permissionCount: permissions.length,
    signals,
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'Use a GET request for extension scans.' })
  }

  const extensionId = getExtensionId(request.query.input)

  if (!extensionId) {
    return sendJson(response, 400, {
      error: 'Enter a valid Chrome Web Store link or 32-character extension ID.',
    })
  }

  try {
    const updateQuery = new URLSearchParams({
      response: 'redirect',
      prodversion: '120.0.0.0',
      acceptformat: 'crx2,crx3',
      x: `id=${extensionId}&installsource=ondemand&uc`,
    })

    const downloadUrl = `https://clients2.google.com/service/update2/crx?${updateQuery}`
    const packageResponse = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'CrxRay privacy scanner',
      },
    })

    if (!packageResponse.ok) {
      throw new Error('Chrome Web Store did not return an installable package for this extension.')
    }

    const packageBuffer = Buffer.from(await packageResponse.arrayBuffer())
    const zip = new AdmZip(getZipPayload(packageBuffer))
    const manifestEntry = zip.getEntry('manifest.json')

    if (!manifestEntry) {
      throw new Error('This extension package does not include a manifest.json file.')
    }

    const manifest = JSON.parse(manifestEntry.getData().toString('utf8'))
    const assessment = buildAssessment(manifest)

    return sendJson(response, 200, {
      extensionId,
      name: manifest.name || 'Unnamed extension',
      version: manifest.version || 'Unknown version',
      manifestVersion: manifest.manifest_version || 'Unknown',
      ...assessment,
    })
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'CrxRay could not retrieve this extension manifest.',
    })
  }
}
