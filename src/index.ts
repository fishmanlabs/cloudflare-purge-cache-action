import * as core from '@actions/core'
import Cloudflare from 'cloudflare'

interface PurgeBody {
  purge_everything?: boolean
  files?: string[]
  tags?: string[]
  hosts?: string[]
  prefixes?: string[]
}

/**
 * Parse a multiline or comma-separated input string into an array of strings.
 * @param input - The input string to parse.
 * @returns An array of strings or undefined.
 */
function parseInput(input: string | undefined): string[] | undefined {
  if (!input) {
    return undefined
  }
  return input
    .split(/\r?\n|,/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

/**
 * Retry a function up to a specified number of attempts.
 * @param fn - The function to retry.
 * @param attempts - The number of attempts.
 */
async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt < attempts) {
        core.warning(`attempt ${attempt} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retry attempts reached')
}

async function run(): Promise<void> {
  try {
    const apiToken = core.getInput('api_token', { required: true })
    const zoneId = core.getInput('zone_id', { required: true })
    const purgeEverything =
      core.getInput('purge_everything', { required: true }) === 'true'
    const purgeFiles = parseInput(core.getInput('purge_files'))
    const purgeTags = parseInput(core.getInput('purge_tags'))
    const purgeHosts = parseInput(core.getInput('purge_hosts'))
    const purgePrefixes = parseInput(core.getInput('purge_prefixes'))

    core.debug(`API Token: ${apiToken}`)
    core.debug(`Zone ID: ${zoneId}`)
    core.debug(`Purge Everything: ${purgeEverything}`)
    core.debug(`Purge Files: ${purgeFiles}`)
    core.debug(`Purge Tags: ${purgeTags}`)
    core.debug(`Purge Hosts: ${purgeHosts}`)
    core.debug(`Purge Prefixes: ${purgePrefixes}`)

    const cf = new Cloudflare({ apiToken })

    const body: PurgeBody = {}
    const purgeTypes: string[] = []

    if (purgeEverything) {
      body.purge_everything = true
      await retry(async () => {
        await cf.cache.purge({ zone_id: zoneId, ...body })
        core.info('Purged everything successfully')
      }, 3)
      return
    }

    if (purgeFiles && purgeFiles.length > 0) {
      body.files = purgeFiles
      purgeTypes.push(`${purgeFiles.length} file(s)`)
    }

    if (purgeTags && purgeTags.length > 0) {
      body.tags = purgeTags
      purgeTypes.push(`${purgeTags.length} tag(s)`)
    }

    if (purgeHosts && purgeHosts.length > 0) {
      body.hosts = purgeHosts
      purgeTypes.push(`${purgeHosts.length} host(s)`)
    }

    if (purgePrefixes && purgePrefixes.length > 0) {
      body.prefixes = purgePrefixes
      purgeTypes.push(`${purgePrefixes.length} prefix(es)`)
    }

    if (Object.keys(body).length === 0) {
      core.warning('No purge operations specified')
      return
    }

    await retry(async () => {
      await cf.cache.purge({ zone_id: zoneId, ...body })
      core.info(`Successfully purged: ${purgeTypes.join(', ')}`)
    }, 3)
  } catch (error) {
    core.setFailed(`action failed with error: ${error}`)
  }
}

run()
