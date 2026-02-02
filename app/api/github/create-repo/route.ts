import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { cuId, cuName, charter, files } = await req.json()

    // Create GitHub repo using GitHub API
    const repoName = `${cuId}-mobile-app`.toLowerCase()
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    // 1. Create repository
    const createRepoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `${cuName} Mobile Banking App - Charter #${charter}`,
        private: false,
        auto_init: true,
      }),
    })

    if (!createRepoRes.ok) {
      const error = await createRepoRes.json()
      return NextResponse.json({ error: error.message }, { status: createRepoRes.status })
    }

    const repo = await createRepoRes.json()
    const owner = repo.owner.login
    const defaultBranch = repo.default_branch

    // 2. Get the SHA of the default branch
    const getBranchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`,
      {
        headers: { Authorization: `Bearer ${githubToken}` },
      },
    )
    const branchData = await getBranchRes.json()
    const latestCommitSha = branchData.object.sha

    // 3. Get the tree SHA of the latest commit
    const getCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
      {
        headers: { Authorization: `Bearer ${githubToken}` },
      },
    )
    const commitData = await getCommitRes.json()
    const baseTreeSha = commitData.tree.sha

    // 4. Create blobs for all files
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content as string,
            encoding: "utf-8",
          }),
        })
        const blob = await blobRes.json()
        return { path, sha: blob.sha }
      }),
    )

    // 5. Create a new tree with all files
    const createTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobs.map(({ path, sha }) => ({
          path,
          mode: "100644",
          type: "blob",
          sha,
        })),
      }),
    })
    const treeData = await createTreeRes.json()

    // 6. Create a new commit
    const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Initial Flutter app for ${cuName}`,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })
    const newCommit = await createCommitRes.json()

    // 7. Update the reference
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: newCommit.sha,
      }),
    })

    return NextResponse.json({
      success: true,
      repoUrl: repo.html_url,
      repoName: `${owner}/${repoName}`,
      zappUrl: `https://zapp.run/github/${owner}/${repoName}?entry=lib/main.dart`,
    })
  } catch (error: any) {
    console.error("[v0] GitHub repo creation failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
