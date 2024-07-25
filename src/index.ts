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
 * Validate that only one purge option is provided.
 * @param purgeFiles - Array of files to purge.
 * @param purgeTags - Array of tags to purge.
 * @param purgeHosts - Array of hosts to purge.
 * @param purgePrefixes - Array of prefixes to purge.
 */
function validateSinglePurgeOption(
  purgeFiles?: string[],
  purgeTags?: string[],
  purgeHosts?: string[],
  purgePrefixes?: string[]
): void {
  const options = [purgeFiles, purgeTags, purgeHosts, purgePrefixes].filter(
    option => option !== undefined
  )
  if (options.length > 1) {
    throw new Error(
      'only one of purge_files, purge_tags, purge_hosts, or purge_prefixes can be provided.'
    )
  }
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

    if (!purgeEverything) {
      validateSinglePurgeOption(
        purgeFiles,
        purgeTags,
        purgeHosts,
        purgePrefixes
      )
    }

    const cf = new Cloudflare({ apiToken })

    const body: PurgeBody = {}
    if (purgeEverything) {
      body.purge_everything = true
    } else {
      if (purgeFiles) {
        body.files = purgeFiles
      } else if (purgeTags) {
        body.tags = purgeTags
      } else if (purgeHosts) {
        body.hosts = purgeHosts
      } else if (purgePrefixes) {
        body.prefixes = purgePrefixes
      }
    }

    await retry(async () => {
      await cf.cache.purge({ zone_id: zoneId, ...body })
      core.info('purge request sent successfully')
    }, 3)
  } catch (error) {
    core.setFailed(`action failed with error: ${error}`)
  }
}

run()
