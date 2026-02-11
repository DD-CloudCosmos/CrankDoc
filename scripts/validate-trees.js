#!/usr/bin/env node

/**
 * Validates all diagnostic tree JSON files in data/trees/
 * Checks: valid JSON, required fields, node references, no dead ends
 */

const fs = require('fs')
const path = require('path')

const TREES_DIR = path.join(__dirname, '..', 'data', 'trees')

let totalFiles = 0
let valid = 0
let invalid = 0
let totalNodes = 0

const files = fs.readdirSync(TREES_DIR).filter((f) => f.endsWith('.json')).sort()

for (const file of files) {
  totalFiles++
  const filePath = path.join(TREES_DIR, file)
  const errors = []

  let tree
  try {
    tree = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`INVALID JSON: ${file} — ${e.message}`)
    invalid++
    continue
  }

  // Check required fields
  if (!tree.title) errors.push('missing title')
  if (!tree.tree_data) errors.push('missing tree_data')
  if (!tree.tree_data?.nodes) errors.push('missing tree_data.nodes')
  if (!tree.difficulty) errors.push('missing difficulty')
  if (!tree.category) errors.push('missing category')

  if (!tree.tree_data?.nodes) {
    errors.push('no nodes to validate')
    console.error(`FAIL: ${file} — ${errors.join(', ')}`)
    invalid++
    continue
  }

  const nodes = tree.tree_data.nodes
  const nodeIds = new Set(nodes.map((n) => n.id))
  totalNodes += nodes.length

  // Check start node exists
  if (!nodeIds.has('start')) {
    errors.push('missing "start" node')
  }

  // Check each node
  for (const node of nodes) {
    if (!node.id) errors.push(`node missing id`)
    if (!node.type) errors.push(`node ${node.id}: missing type`)
    if (!node.text) errors.push(`node ${node.id}: missing text`)
    if (!node.safety) errors.push(`node ${node.id}: missing safety`)

    // Check references
    if (node.type === 'question' && node.options) {
      for (const opt of node.options) {
        if (!nodeIds.has(opt.next)) {
          errors.push(`node ${node.id}: option references missing node "${opt.next}"`)
        }
      }
    }
    if (node.type === 'check' && node.next) {
      if (!nodeIds.has(node.next)) {
        errors.push(`node ${node.id}: next references missing node "${node.next}"`)
      }
    }

    // Check solution nodes have action
    if (node.type === 'solution' && !node.action) {
      errors.push(`node ${node.id}: solution missing action`)
    }
  }

  if (errors.length > 0) {
    console.error(`FAIL: ${file} (${nodes.length} nodes) — ${errors.join('; ')}`)
    invalid++
  } else {
    console.log(`  OK: ${file} (${nodes.length} nodes)`)
    valid++
  }
}

console.log(`\n${'='.repeat(50)}`)
console.log(`Files: ${totalFiles} total, ${valid} valid, ${invalid} invalid`)
console.log(`Nodes: ${totalNodes} total across all files`)
console.log(`${'='.repeat(50)}`)

if (invalid > 0) process.exit(1)
