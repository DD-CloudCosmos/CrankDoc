/**
 * Helpers for scripts/import-trees.js, kept separate so they can be tested
 * without a database connection.
 */

/**
 * Picks the guide files to import.
 *
 * With no file names, every file is imported. With file names (given on the
 * command line), only those are imported, so one corrected guide can be
 * published without touching the rest.
 *
 * @param {string[]} allFiles - JSON file names found in data/trees
 * @param {string[]} requested - file names given on the command line
 * @returns {{ files: string[], unknown: string[] }}
 */
function selectTreeFiles(allFiles, requested) {
  if (requested.length === 0) return { files: allFiles, unknown: [] }
  const names = requested.map((name) => (name.endsWith('.json') ? name : `${name}.json`))
  return {
    files: allFiles.filter((file) => names.includes(file)),
    unknown: names.filter((name) => !allFiles.includes(name)),
  }
}

/**
 * Finds the guide that is already in the database, if any.
 *
 * - Universal guides have no bike. Comparing a column to NULL needs `.is()`:
 *   `.eq('motorcycle_id', null)` never matches, which used to insert a
 *   duplicate of every universal guide on each run.
 * - A model can have several generation rows. The guide may be attached to
 *   any of them, so look across all of the model's rows.
 *
 * @param {object} supabase - Supabase client
 * @param {string} title - guide title
 * @param {string[]} motorcycleIds - ids of the bike's rows; empty for a universal guide
 * @returns {Promise<{ id: string } | null>}
 */
async function findExistingTree(supabase, title, motorcycleIds) {
  const query = supabase.from('diagnostic_trees').select('id').eq('title', title)
  const scoped = motorcycleIds.length === 0 ? query.is('motorcycle_id', null) : query.in('motorcycle_id', motorcycleIds)
  const { data, error } = await scoped.limit(1)
  if (error) throw new Error(`Could not check for an existing guide "${title}": ${error.message}`)
  return data && data.length > 0 ? data[0] : null
}

module.exports = { selectTreeFiles, findExistingTree }
