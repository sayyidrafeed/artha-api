#!/usr/bin/env bun
/**
 * TypeScript diagnostic script for Artha API
 * Run with: bun run scripts/diagnose-types.ts
 */

async function runCommand(
  name: string,
  command: string[],
  options?: { maxOutput?: number silent?: boolean },
): Promise<{ exitCode: number stdout: string stderr: string }> {
  if (!options?.silent) {
    console.log(`\n${"=".repeat(60)}`)
    console.log(`Running: ${name}`)
    console.log(`${"=".repeat(60)}`)
  }

  try {
    const proc = Bun.spawn(command, {
      stdout: "pipe",
      stderr: "pipe",
      cwd: process.cwd(),
    })

    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    const maxOutput = options?.maxOutput ?? 5000
    const truncatedStdout =
      stdout.length > maxOutput
        ? stdout.slice(0, maxOutput) + "\n... (truncated)"
        : stdout
    const truncatedStderr =
      stderr.length > maxOutput
        ? stderr.slice(0, maxOutput) + "\n... (truncated)"
        : stderr

    if (!options?.silent) {
      if (truncatedStdout) console.log(truncatedStdout)
      if (truncatedStderr) console.error("STDERR:", truncatedStderr)
      console.log(`Exit code: ${exitCode}`)
    }

    return { exitCode, stdout, stderr }
  } catch (error) {
    const errorMsg = `Failed to run ${name}: ${error}`
    if (!options?.silent) {
      console.error(errorMsg)
    }
    return { exitCode: 1, stdout: "", stderr: errorMsg }
  }
}

async function checkFile(path: string): Promise<boolean> {
  try {
    const file = Bun.file(path)
    return await file.exists()
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  console.log("🔍 TypeScript Diagnostics for Artha API")
  console.log(`Node version: ${process.version}`)
  console.log(`Bun version: ${Bun.version}`)
  console.log(`Platform: ${process.platform}`)

  let hasErrors = false

  // 1. Check configuration files exist
  console.log("\n📁 Configuration Files Check:")
  const configFiles = [
    "tsconfig.json",
    "package.json",
    "bunfig.toml",
    "bun.lock",
  ]
  for (const file of configFiles) {
    const exists = await checkFile(file)
    console.log(`  ${exists ? "✅" : "❌"} ${file}`)
    if (!exists) hasErrors = true
  }

  // 2. Parse tsconfig.json
  console.log("\n📋 tsconfig.json Validation:")
  try {
    const tsconfigFile = Bun.file("tsconfig.json")
    const tsconfigContent = await tsconfigFile.text()
    const tsconfig = JSON.parse(tsconfigContent)

    console.log(`  Target: ${tsconfig.compilerOptions?.target ?? "not set"}`)
    console.log(`  Module: ${tsconfig.compilerOptions?.module ?? "not set"}`)
    console.log(
      `  ModuleResolution: ${tsconfig.compilerOptions?.moduleResolution ?? "not set"}`,
    )
    console.log(
      `  Types: ${JSON.stringify(tsconfig.compilerOptions?.types ?? [])}`,
    )
    console.log(`  Include: ${JSON.stringify(tsconfig.include ?? [])}`)
    console.log(`  Exclude: ${JSON.stringify(tsconfig.exclude ?? [])}`)

    if (!tsconfig.compilerOptions?.types?.includes("bun-types")) {
      console.log("  ⚠️  Warning: bun-types not in types array")
    }
  } catch (error) {
    console.error("  ❌ Error parsing tsconfig.json:", error)
    hasErrors = true
  }

  // 3. Check TypeScript compiler
  const tscResult = await runCommand(
    "TypeScript Config Show",
    ["bunx", "tsc", "--showConfig"],
    { silent: true },
  )
  if (tscResult.exitCode !== 0) {
    console.log("\n❌ TypeScript configuration invalid")
    hasErrors = true
  } else {
    console.log("\n✅ TypeScript configuration valid")
  }

  // 4. Run type checkers
  console.log("\n🔬 Type Checking:")

  const tsgoResult = await runCommand(
    "tsgo Check",
    ["bunx", "tsgo", "--noEmit"],
    {
      maxOutput: 3000,
      silent: true,
    },
  )
  console.log(`  tsgo: ${tsgoResult.exitCode === 0 ? "✅ Pass" : "❌ Fail"}`)
  if (tsgoResult.exitCode !== 0) {
    console.log(tsgoResult.stdout.slice(0, 2000))
    hasErrors = true
  }

  const tscCheckResult = await runCommand(
    "tsc Check",
    ["bunx", "tsc", "--noEmit", "--pretty"],
    {
      maxOutput: 3000,
      silent: true,
    },
  )
  console.log(
    `  tsc:  ${tscCheckResult.exitCode === 0 ? "✅ Pass" : "❌ Fail"}`,
  )
  if (tscCheckResult.exitCode !== 0) {
    console.log(tscCheckResult.stdout.slice(0, 2000))
    hasErrors = true
  }

  // 5. Check module resolution
  console.log("\n📦 Module Resolution Check:")
  const traceResult = await runCommand(
    "Path Alias Resolution",
    ["bunx", "tsc", "--noEmit", "--traceResolution"],
    {
      maxOutput: 2000,
      silent: true,
    },
  )

  const pathAliasIssues = traceResult.stdout
    .split("\n")
    .filter((line) => line.includes("@/") || line.includes("Cannot find"))
  if (pathAliasIssues.length > 0) {
    console.log("  ⚠️  Potential path alias issues found:")
    pathAliasIssues.slice(0, 10).forEach((line) => console.log(`    ${line}`))
  } else {
    console.log("  ✅ No obvious path alias issues")
  }

  // 6. Check installed types
  console.log("\n📚 Installed Types Check:")
  const nodeModulesExists = await checkFile("node_modules")
  if (!nodeModulesExists) {
    console.log("  ❌ node_modules not found - run bun install")
    hasErrors = true
  } else {
    const bunTypesExists = await checkFile("node_modules/bun-types")
    const cfTypesExists = await checkFile(
      "node_modules/@cloudflare/workers-types",
    )

    console.log(`  ${bunTypesExists ? "✅" : "❌"} bun-types`)
    console.log(`  ${cfTypesExists ? "✅" : "❌"} @cloudflare/workers-types`)

    if (!bunTypesExists || !cfTypesExists) {
      hasErrors = true
    }
  }

  // 7. Check for duplicate type definitions
  console.log("\n🔍 Duplicate Type Definitions:")
  const dupResult = await runCommand(
    "Find bun-related types",
    ["find", "node_modules", "-name", "*.d.ts", "-path", "*bun*"],
    {
      silent: true,
    },
  )

  const bunTypeFiles = dupResult.stdout.split("\n").filter((f) => f.trim())
  if (bunTypeFiles.length > 5) {
    console.log(
      `  ⚠️  Found ${bunTypeFiles.length} bun-related type files (may indicate duplicates)`,
    )
    bunTypeFiles.slice(0, 5).forEach((f) => console.log(`    ${f}`))
  } else {
    console.log(`  ✅ Found ${bunTypeFiles.length} bun-related type files`)
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  if (hasErrors) {
    console.log("❌ Diagnostics completed with errors")
    console.log("\nRecommended actions:")
    console.log("  1. Run: bun install")
    console.log("  2. Check tsconfig.json paths configuration")
    console.log(
      "  3. Ensure bun-types and @cloudflare/workers-types are installed",
    )
    console.log("  4. Run: bun run diagnose (for full output)")
    process.exit(1)
  } else {
    console.log("✅ All diagnostics passed")
    process.exit(0)
  }
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
