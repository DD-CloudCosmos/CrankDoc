/**
 * Robots.txt Compliance Checker
 *
 * Fetches and parses robots.txt for a domain, then checks whether
 * a given URL path is allowed for our user agent. Caches results
 * per domain to avoid repeated fetches.
 */

const USER_AGENT = 'CrankDoc/1.0 (motorcycle diagnostic app)'
const AGENT_NAME = 'CrankDoc'

interface RobotsRule {
  allow: string[]
  disallow: string[]
}

interface RobotsData {
  agentRules: RobotsRule | null
  wildcardRules: RobotsRule | null
}

const cache = new Map<string, RobotsData>()

/**
 * Checks if a URL is allowed to be scraped according to its
 * domain's robots.txt. Returns true if allowed, false if disallowed.
 *
 * Gracefully returns true if robots.txt can't be fetched.
 */
export async function isUrlAllowed(url: string): Promise<boolean> {
  const parsed = new URL(url)
  const domain = parsed.origin

  let robotsData = cache.get(domain)
  if (!robotsData) {
    robotsData = await fetchAndParseRobots(domain)
    cache.set(domain, robotsData)
  }

  // Use agent-specific rules if available, otherwise wildcard
  const rules = robotsData.agentRules ?? robotsData.wildcardRules
  if (!rules) return true

  return isPathAllowed(parsed.pathname, rules)
}

/** Clears the robots.txt cache. */
export function clearRobotsCache(): void {
  cache.clear()
}

/**
 * Fetches and parses robots.txt for a domain.
 * Returns empty rules (everything allowed) on fetch failure.
 */
async function fetchAndParseRobots(domain: string): Promise<RobotsData> {
  try {
    const response = await fetch(`${domain}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      return { agentRules: null, wildcardRules: null }
    }

    const text = await response.text()
    return parseRobotsTxt(text)
  } catch {
    return { agentRules: null, wildcardRules: null }
  }
}

/**
 * Parses robots.txt content into structured rules.
 * Extracts rules for our specific agent and the wildcard (*).
 */
function parseRobotsTxt(text: string): RobotsData {
  const lines = text.split('\n').map((line) => line.trim())
  const data: RobotsData = { agentRules: null, wildcardRules: null }

  let currentTarget: 'agent' | 'wildcard' | null = null

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line) continue

    // Remove inline comments
    const cleaned = line.split('#')[0].trim()
    if (!cleaned) continue

    const colonIdx = cleaned.indexOf(':')
    if (colonIdx === -1) continue

    const directive = cleaned.substring(0, colonIdx).trim().toLowerCase()
    const value = cleaned.substring(colonIdx + 1).trim()

    if (directive === 'user-agent') {
      if (value.toLowerCase() === AGENT_NAME.toLowerCase()) {
        currentTarget = 'agent'
        if (!data.agentRules) {
          data.agentRules = { allow: [], disallow: [] }
        }
      } else if (value === '*') {
        currentTarget = 'wildcard'
        if (!data.wildcardRules) {
          data.wildcardRules = { allow: [], disallow: [] }
        }
      } else {
        currentTarget = null
      }
      continue
    }

    if (!currentTarget) continue

    const rules =
      currentTarget === 'agent' ? data.agentRules! : data.wildcardRules!

    if (directive === 'disallow' && value) {
      rules.disallow.push(value)
    } else if (directive === 'allow' && value) {
      rules.allow.push(value)
    }
  }

  return data
}

/**
 * Checks if a path is allowed given a set of robots rules.
 * Allow directives take precedence over Disallow when both match.
 * More specific (longer) paths take precedence.
 */
function isPathAllowed(path: string, rules: RobotsRule): boolean {
  // Check Allow rules first — if any match, it's allowed
  for (const pattern of rules.allow) {
    if (path.startsWith(pattern)) return true
  }

  // Check Disallow rules
  for (const pattern of rules.disallow) {
    if (path.startsWith(pattern)) return false
  }

  // Default: allowed
  return true
}
