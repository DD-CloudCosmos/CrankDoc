/**
 * Confirmation guard for scripts that delete data.
 *
 * CrankDoc has one Supabase project and it is the live site, so a script
 * that clears tables must never run by accident. The caller has to name
 * the project it is about to wipe, either as a flag or an environment variable:
 *
 *   node scripts/reseed-motorcycles.js --confirm-wipe=<project-ref>
 *   CONFIRM_WIPE=<project-ref> npm run seed:all
 *
 * The project ref is the first part of the Supabase URL
 * (https://<project-ref>.supabase.co).
 */

/** "https://abcd1234.supabase.co" -> "abcd1234". Returns null for anything that is not a URL. */
function projectRef(supabaseUrl) {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || null
  } catch {
    return null
  }
}

/**
 * Checks that the caller explicitly confirmed wiping this project.
 *
 * @param {string[]} argv - command line arguments (process.argv.slice(2))
 * @param {Record<string, string | undefined>} env - environment variables
 * @param {string} supabaseUrl - the project the script is connected to
 * @param {string[]} tables - tables the script is about to clear, for the message
 * @returns {{ ok: boolean, message: string }}
 */
function checkWipeConfirmation(argv, env, supabaseUrl, tables) {
  const ref = projectRef(supabaseUrl)
  if (!ref) {
    return { ok: false, message: `Cannot read a project ref from the Supabase URL "${supabaseUrl}".` }
  }

  const flag = argv.find((arg) => arg.startsWith('--confirm-wipe='))
  const given = flag ? flag.slice('--confirm-wipe='.length) : env.CONFIRM_WIPE

  if (given === ref) {
    return { ok: true, message: `Confirmed: clearing ${tables.length} tables in project ${ref}.` }
  }

  const problem = given
    ? `The confirmation "${given}" does not match the connected project "${ref}".`
    : 'No confirmation was given.'

  return {
    ok: false,
    message: [
      `STOPPED: this script deletes every row in these tables of project "${ref}":`,
      `  ${tables.join(', ')}`,
      '',
      'On the live database that empties the site until every seed step has finished,',
      'and gives every bike and guide a new id (old links and saved garages break).',
      '',
      problem,
      'To go ahead, name the project you want to wipe:',
      `  node scripts/reseed-motorcycles.js --confirm-wipe=${ref}`,
      `  CONFIRM_WIPE=${ref} npm run seed:all`,
    ].join('\n'),
  }
}

module.exports = { projectRef, checkWipeConfirmation }
