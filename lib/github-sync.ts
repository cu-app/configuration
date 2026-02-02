// GitHub Sync: Auto-commit config.json to tenant repositories
// Part of the distribution pipeline: Dashboard → Supabase → GitHub → CDN → Apps

export interface GitHubSyncResult {
  success: boolean
  repo?: string
  commit?: string
  url?: string
  error?: string
}

export interface GitHubSyncOptions {
  tenantId: string
  tenantName: string
  charterNumber: string
  config: Record<string, unknown>
  version: string
  commitMessage?: string
}

/**
 * Push configuration to a tenant's GitHub repository
 * Creates config.json in the repo with the full tenant config
 */
export async function syncToGitHub(options: GitHubSyncOptions): Promise<GitHubSyncResult> {
  const {
    tenantId,
    tenantName,
    charterNumber,
    config,
    version,
    commitMessage,
  } = options

  const githubToken = process.env.GITHUB_TOKEN

  if (!githubToken) {
    return { success: false, error: 'GitHub token not configured' }
  }

  try {
    const repoName = `${tenantId}-mobile-app`.toLowerCase()
    const owner = await getGitHubUsername(githubToken)

    if (!owner) {
      return { success: false, error: 'Could not determine GitHub username' }
    }

    // Check if repo exists
    const repoExists = await checkRepoExists(githubToken, owner, repoName)

    if (!repoExists) {
      // Create the repository if it doesn't exist
      const createResult = await createRepository(githubToken, repoName, tenantName, charterNumber)
      if (!createResult.success) {
        return createResult
      }
    }

    // Prepare config file content
    const configContent = JSON.stringify(config, null, 2)
    const filePath = 'config.json'
    const message = commitMessage || `Config update v${version} - ${new Date().toISOString()}`

    // Get current file SHA if it exists (needed for updates)
    const currentSha = await getFileSha(githubToken, owner, repoName, filePath)

    // Create or update the file
    const updateResult = await updateFile(
      githubToken,
      owner,
      repoName,
      filePath,
      configContent,
      message,
      currentSha
    )

    if (!updateResult.success) {
      return updateResult
    }

    return {
      success: true,
      repo: `${owner}/${repoName}`,
      commit: updateResult.commit,
      url: `https://github.com/${owner}/${repoName}/blob/main/${filePath}`,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[github-sync] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Get the authenticated user's GitHub username
 */
async function getGitHubUsername(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.login
  } catch {
    return null
  }
}

/**
 * Check if a repository exists
 */
async function checkRepoExists(token: string, owner: string, repo: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Create a new GitHub repository
 */
async function createRepository(
  token: string,
  repoName: string,
  tenantName: string,
  charterNumber: string
): Promise<GitHubSyncResult> {
  try {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: `${tenantName} Mobile Banking Config - Charter #${charterNumber}`,
        private: false,
        auto_init: true,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      return { success: false, error: error.message || 'Failed to create repository' }
    }

    // Wait a moment for GitHub to initialize the repo
    await new Promise(resolve => setTimeout(resolve, 1000))

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get the SHA of an existing file (needed for updates)
 */
async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.sha
  } catch {
    return null
  }
}

/**
 * Create or update a file in the repository
 */
async function updateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  existingSha: string | null
): Promise<GitHubSyncResult & { commit?: string }> {
  try {
    const body: Record<string, string> = {
      message,
      content: Buffer.from(content).toString('base64'),
    }

    if (existingSha) {
      body.sha = existingSha
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json()
      return { success: false, error: error.message || 'Failed to update file' }
    }

    const data = await res.json()
    return {
      success: true,
      commit: data.commit?.sha,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Sync multiple files to a repository (for full Flutter app updates)
 */
export async function syncMultipleFiles(
  tenantId: string,
  files: Record<string, string>,
  commitMessage: string
): Promise<GitHubSyncResult> {
  const githubToken = process.env.GITHUB_TOKEN

  if (!githubToken) {
    return { success: false, error: 'GitHub token not configured' }
  }

  try {
    const repoName = `${tenantId}-mobile-app`.toLowerCase()
    const owner = await getGitHubUsername(githubToken)

    if (!owner) {
      return { success: false, error: 'Could not determine GitHub username' }
    }

    // Get the default branch reference
    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
      { headers: { Authorization: `Bearer ${githubToken}` } }
    )

    if (!branchRes.ok) {
      return { success: false, error: 'Could not get branch reference' }
    }

    const branchData = await branchRes.json()
    const latestCommitSha = branchData.object.sha

    // Get the tree SHA of the latest commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
      { headers: { Authorization: `Bearer ${githubToken}` } }
    )
    const commitData = await commitRes.json()
    const baseTreeSha = commitData.tree.sha

    // Create blobs for all files
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            encoding: 'utf-8',
          }),
        })
        const blob = await blobRes.json()
        return { path, sha: blob.sha }
      })
    )

    // Create a new tree with all files
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobs.map(({ path, sha }) => ({
          path,
          mode: '100644',
          type: 'blob',
          sha,
        })),
      }),
    })
    const treeData = await treeRes.json()

    // Create a new commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })
    const newCommit = await newCommitRes.json()

    // Update the reference
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    })

    return {
      success: true,
      repo: `${owner}/${repoName}`,
      commit: newCommit.sha,
      url: `https://github.com/${owner}/${repoName}`,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[github-sync] Multi-file sync error:', message)
    return { success: false, error: message }
  }
}
