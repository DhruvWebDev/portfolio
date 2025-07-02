"use client"

import { useState, useEffect, useCallback } from "react"
import { githubCache } from "@/utils/github-cache"

interface GitHubStats {
  user: any
  contributions: any[]
  recentActivity: any[]
  languageStats: any
  repositoryStats: any
  totalStats: any
}

export function useGitHubData() {
  const [data, setData] = useState<GitHubStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGitHubData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedData = githubCache.get("github_complete_data")
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const [userResponse, contributionResponse, eventsResponse, reposResponse] = await Promise.all([
        fetch("https://api.github.com/users/DhruvWebDev"),
        fetch("https://github-contributions-api.jogruber.de/v4/DhruvWebDev?y=last"),
        fetch("https://api.github.com/users/DhruvWebDev/events?per_page=30"),
        fetch("https://api.github.com/users/DhruvWebDev/repos?per_page=100&sort=updated"),
      ])

      const [userData, contributionData, eventsData, reposData] = await Promise.all([
        userResponse.json(),
        contributionResponse.json(),
        eventsResponse.json(),
        reposResponse.json(),
      ])

      // Process contributions
      const contributions =
        contributionData.contributions?.map((day: any) => ({
          date: day.date,
          count: day.count,
          level: day.count === 0 ? 0 : day.count <= 3 ? 1 : day.count <= 6 ? 2 : day.count <= 9 ? 3 : 4,
        })) || []

      // Process recent activity
      const recentActivity = eventsData
        .filter((event: any) => ["PushEvent", "CreateEvent", "PullRequestEvent"].includes(event.type))
        .slice(0, 10)
        .map((event: any) => ({
          type: event.type,
          repo: event.repo.name,
          date: new Date(event.created_at).toLocaleDateString(),
          time: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: getEventAction(event),
        }))

      // Process language statistics
      const languageStats = await processLanguageStats(reposData)

      // Process repository statistics
      const repositoryStats = processRepositoryStats(reposData)

      // Calculate total statistics
      const totalStats = {
        totalContributions: contributions.reduce((sum: number, day: any) => sum + day.count, 0),
        currentStreak: calculateCurrentStreak(contributions),
        longestStreak: calculateLongestStreak(contributions),
        totalRepositories: reposData.length,
        totalStars: reposData.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
        totalForks: reposData.reduce((sum: number, repo: any) => sum + repo.forks_count, 0),
        publicRepos: reposData.filter((repo: any) => !repo.private).length,
        mostStarredRepo: reposData.reduce(
          (max: any, repo: any) => (repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max),
          null,
        ),
      }

      const completeData = {
        user: userData,
        contributions,
        recentActivity,
        languageStats,
        repositoryStats,
        totalStats,
      }

      // Cache the data for 15 minutes
      githubCache.set("github_complete_data", completeData, 15 * 60 * 1000)
      setData(completeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch GitHub data")
      console.error("Error fetching GitHub data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGitHubData()
  }, [fetchGitHubData])

  return { data, loading, error, refetch: fetchGitHubData }
}

function getEventAction(event: any): string {
  switch (event.type) {
    case "PushEvent":
      return `Pushed ${event.payload?.commits?.length || 1} commit(s)`
    case "CreateEvent":
      return `Created ${event.payload?.ref_type || "repository"}`
    case "PullRequestEvent":
      return `${event.payload?.action || "opened"} pull request`
    default:
      return event.type.replace("Event", "")
  }
}

async function processLanguageStats(repos: any[]) {
  const languageRepos: { [key: string]: number } = {}

  repos.forEach((repo) => {
    if (repo.language) {
      languageRepos[repo.language] = (languageRepos[repo.language] || 0) + 1
    }
  })

  const totalRepos = Object.values(languageRepos).reduce((sum, count) => sum + count, 0)

  const languageStats = Object.entries(languageRepos).map(([language, count]) => ({
    name: language,
    count,
    percentage: Math.round((count / totalRepos) * 100),
    color: getLanguageColor(language),
  }))

  return languageStats.sort((a, b) => b.count - a.count)
}

function processRepositoryStats(repos: any[]) {
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  return {
    recentlyUpdated: repos.filter((repo) => new Date(repo.updated_at) > oneMonthAgo).length,
    activeInSixMonths: repos.filter((repo) => new Date(repo.updated_at) > sixMonthsAgo).length,
    forkedRepos: repos.filter((repo) => repo.fork).length,
    originalRepos: repos.filter((repo) => !repo.fork).length,
    hasIssues: repos.filter((repo) => repo.has_issues && repo.open_issues_count > 0).length,
    topRepositories: repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5),
  }
}

function calculateCurrentStreak(contributions: any[]): number {
  let streak = 0
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function calculateLongestStreak(contributions: any[]): number {
  let maxStreak = 0
  let currentStreak = 0

  contributions.forEach((day) => {
    if (day.count > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  return maxStreak
}

function getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    JavaScript: "#f1e05a",
    TypeScript: "#2b7489",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#239120",
    PHP: "#4F5D95",
    Ruby: "#701516",
    Go: "#00ADD8",
    Rust: "#dea584",
    Swift: "#ffac45",
    Kotlin: "#F18E33",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#1572B6",
    Shell: "#89e051",
    Dockerfile: "#384d54",
  }
  return colors[language] || "#8b949e"
}
