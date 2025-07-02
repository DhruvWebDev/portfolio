"use client"

import React from "react"
import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Github, GitCommit, Activity, Star, GitFork, TrendingUp, Calendar, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useGitHubData } from "@/hooks/use-github-data"
import { ContributionGraphSkeleton, ActivityCardSkeleton, StatsCardSkeleton } from "@/components/loading-skeleton"

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { data: githubData, loading, error } = useGitHubData()

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [])

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  const ContributionGraph = React.memo(() => {
    if (!githubData?.contributions.length) return null

    const { contributions, totalStats } = githubData
    const weeks = []
    for (let i = 0; i < contributions.length; i += 7) {
      weeks.push(contributions.slice(i, i + 7))
    }

    const getColor = (level: number) => {
      const colors = ["bg-gray-800/30", "bg-green-900/60", "bg-green-700/70", "bg-green-500/80", "bg-green-400"]
      return colors[level] || colors[0]
    }

    return (
      <div className="p-6 bg-gray-900/20 rounded-lg border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            GitHub Contributions
          </h3>
          <div className="text-sm text-gray-400">{totalStats.totalContributions} contributions in the last year</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{totalStats.currentStreak}</div>
            <div className="text-xs text-gray-400">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{totalStats.longestStreak}</div>
            <div className="text-xs text-gray-400">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalStats.totalRepositories}</div>
            <div className="text-xs text-gray-400">Repositories</div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getColor(day.level)} border border-white/10 hover:ring-2 hover:ring-white/20 hover:ring-offset-1 hover:ring-offset-black transition-all duration-200 cursor-pointer`}
                  title={`${day.count} contributions on ${day.date}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getColor(level)} border border-white/10`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    )
  })

  const GitHubStats = React.memo(() => {
    if (!githubData) return null

    const { totalStats, repositoryStats } = githubData

    return (
      <Card className="bg-gray-900/20 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            GitHub Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{totalStats.totalStars}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                Total Stars
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{totalStats.totalForks}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <GitFork className="w-3 h-3" />
                Total Forks
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{repositoryStats.recentlyUpdated}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" />
                Active This Month
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{repositoryStats.originalRepos}</div>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Code2 className="w-3 h-3" />
                Original Repos
              </div>
            </div>
          </div>

          {totalStats.mostStarredRepo && (
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Most Starred Repository</div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{totalStats.mostStarredRepo.name}</span>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  {totalStats.mostStarredRepo.stargazers_count} ⭐
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  })

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.03), transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.05), transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-900/10" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Introduction */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="text-white">Hey, I'm</span>
                <br />
                <span className="text-gray-300">Dhruv</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl">
                Full-stack developer passionate about building modern web applications. I love creating seamless user
                experiences with cutting-edge technology.
              </p>

              {!loading && githubData?.user && (
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={githubData.user.avatar_url || "/placeholder.svg"}
                      alt="Dhruv's Avatar"
                      className="w-16 h-16 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">{githubData.user.name}</h3>
                      <p className="text-gray-400">{githubData.user.bio}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      <span>{githubData.user.public_repos} repositories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{githubData.user.followers} followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{githubData.user.following} following</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/projects">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-200 border-0 font-semibold">
                    View Projects
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => window.open("https://github.com/DhruvWebDev", "_blank")}
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Profile
                </Button>
              </div>
            </motion.div>

            {/* Right side - GitHub Activity */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {loading ? (
                <>
                  <ContributionGraphSkeleton />
                  <ActivityCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <ContributionGraph />
                  <GitHubStats />

                  {/* Recent Activity */}
                  <Card className="bg-gray-900/20 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <GitCommit className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {githubData?.recentActivity.map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 text-sm"
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <span className="text-gray-300">{activity.repo}</span>
                              <div className="text-xs text-gray-500">{activity.action}</div>
                            </div>
                            <span className="text-gray-500 text-xs">{activity.date}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
