"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Github, ExternalLink, Star, GitFork, Calendar, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { githubCache } from "@/utils/github-cache"

interface Project {
  title: string
  description: string
  tech: string[]
  github: string
  demo: string
  stars: number
  forks: number
  language: string
  updated: string
  status?: string
  source: "personal" | "org"
  archived?: boolean
  priority?: number
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "personal" | "org">("all")

  const fetchProjects = useCallback(async () => {
    try {
      // Check cache first
      const cachedProjects = githubCache.get("github_projects_data")
      if (cachedProjects) {
        setProjects(cachedProjects)
        setLoading(false)
        return
      }

      // Fetch from both accounts
      const [personalResponse, orgResponse] = await Promise.all([
        fetch("https://api.github.com/users/DhruvWebDev/repos?sort=updated&per_page=100"),
        fetch("https://api.github.com/orgs/SolanaCore/repos?sort=updated&per_page=100"),
      ])

      const [personalRepos, orgRepos] = await Promise.all([personalResponse.json(), orgResponse.json()])

      // Process organization repositories (80% - prioritize all good org projects)
      const orgProjects = orgRepos
        .filter((repo: any) => !repo.fork)
        .sort((a: any, b: any) => {
          // Sort by: stars first, then recent activity, then creation date
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count
          }
          if (new Date(b.updated_at).getTime() !== new Date(a.updated_at).getTime()) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .map((repo: any) => ({
          title: formatProjectTitle(repo.name),
          description: repo.description || "A cutting-edge project built for the Solana ecosystem.",
          tech: getProjectTech(repo.language, repo.topics || [], true),
          github: repo.html_url,
          demo: repo.homepage || "#",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          updated: new Date(repo.updated_at).toLocaleDateString(),
          source: "org" as const,
          archived: repo.archived,
          status: repo.archived ? "Paused" : undefined,
          priority: calculateProjectPriority(repo, true), // Higher priority for org projects
        }))

      // Process personal repositories (20% - only top projects)
      const personalProjects = personalRepos
        .filter((repo: any) => !repo.fork && !repo.archived)
        .sort((a: any, b: any) => {
          // Sort by: stars first, then forks, then recent activity
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count
          }
          if (b.forks_count !== a.forks_count) {
            return b.forks_count - a.forks_count
          }
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })
        .slice(0, Math.max(3, Math.ceil(orgProjects.length * 0.25))) // Take top 25% of org count, minimum 3
        .map((repo: any) => ({
          title: formatProjectTitle(repo.name),
          description: repo.description || "A modern application built with cutting-edge technologies.",
          tech: getProjectTech(repo.language, repo.topics || []),
          github: repo.html_url,
          demo: repo.homepage || "#",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          updated: new Date(repo.updated_at).toLocaleDateString(),
          source: "personal" as const,
          archived: repo.archived,
          priority: calculateProjectPriority(repo, false),
        }))

      // Combine projects with proper ratio (80% org, 20% personal)
      const totalProjects = 12 // Total projects to show
      const orgCount = Math.ceil(totalProjects * 0.8) // 80% = ~10 projects
      const personalCount = totalProjects - orgCount // 20% = ~2 projects

      const selectedOrgProjects = orgProjects.slice(0, orgCount)
      const selectedPersonalProjects = personalProjects.slice(0, personalCount)

      // Combine and sort by priority
      const allProjects = [...selectedOrgProjects, ...selectedPersonalProjects].sort((a, b) => b.priority - a.priority)

      // Cache the data
      githubCache.set("github_projects_data", allProjects)
      setProjects(allProjects)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setLoading(false)
    }
  }, [])

  // Add this helper function after the fetchProjects function
  const calculateProjectPriority = (repo: any, isOrg: boolean): number => {
    let priority = 0

    // Base priority boost for org projects
    if (isOrg) {
      priority += 100
    }

    // Stars weight (most important)
    priority += repo.stargazers_count * 10

    // Forks weight
    priority += repo.forks_count * 5

    // Recent activity boost (updated in last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    if (new Date(repo.updated_at) > sixMonthsAgo) {
      priority += 20
    }

    // Language/topic bonuses
    if (repo.language === "TypeScript" || repo.language === "Rust") {
      priority += 15
    }

    if (repo.topics?.includes("solana") || repo.topics?.includes("web3") || repo.topics?.includes("blockchain")) {
      priority += 25
    }

    if (repo.topics?.includes("nextjs") || repo.topics?.includes("react")) {
      priority += 10
    }

    // Description quality bonus
    if (repo.description && repo.description.length > 50) {
      priority += 5
    }

    // Homepage/demo bonus
    if (repo.homepage) {
      priority += 10
    }

    return priority
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const formatProjectTitle = (name: string): string => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .replace(/([A-Z])/g, " $1")
      .trim()
  }

  const getProjectTech = (language: string, topics: string[], isOrg = false): string[] => {
    const techStack = []

    // Add primary language
    if (language) techStack.push(language)

    // Add common technologies based on topics and language
    const techMap: { [key: string]: string } = {
      react: "React",
      nextjs: "Next.js",
      nodejs: "Node.js",
      typescript: "TypeScript",
      javascript: "JavaScript",
      tailwindcss: "Tailwind",
      solana: "Solana",
      web3: "Web3",
      blockchain: "Blockchain",
      defi: "DeFi",
      nft: "NFT",
      rust: "Rust",
      anchor: "Anchor",
      mongodb: "MongoDB",
      postgresql: "PostgreSQL",
      firebase: "Firebase",
      docker: "Docker",
      express: "Express",
      graphql: "GraphQL",
      prisma: "Prisma",
      supabase: "Supabase",
      webrtc: "WebRTC",
      mediasoup: "Mediasoup",
      ffmpeg: "FFMPEG",
      arweave: "Arweave",
      evm: "EVM",
      solidity: "Solidity",
      redis: "Redis",
      timescaledb: "TimescaleDB",
      "actix-web": "Actix Web",
    }

    // Add relevant topics
    topics.forEach((topic) => {
      const tech = techMap[topic.toLowerCase()]
      if (tech && !techStack.includes(tech)) {
        techStack.push(tech)
      }
    })

    // Add some default tech based on language for org projects
    if (isOrg) {
      if (language === "Rust" && !techStack.includes("Solana")) {
        techStack.push("Solana")
      }
      if (language === "TypeScript" && !techStack.includes("Web3")) {
        techStack.push("Web3")
      }
    }

    return techStack.slice(0, 6) // Limit to 6 items
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true
    return project.source === filter
  })

  const ProjectCard = ({ project, index }: { project: Project; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/50 transition-all duration-300"
    >
      {/* Status Badge */}
      {project.status && (
        <div className="absolute top-4 right-4">
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1"
          >
            <Pause className="w-3 h-3" />
            {project.status}
          </Badge>
        </div>
      )}

      {/* Source Badge */}
      <div className="absolute top-4 left-4">
        <Badge
          variant="outline"
          className={`text-xs ${
            project.source === "org"
              ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
              : "border-blue-500/30 text-blue-400 bg-blue-500/10"
          }`}
        >
          {project.source === "org" ? "SolanaCore" : "Personal"}
        </Badge>
      </div>

      {/* Project Content */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
          {project.title}
        </h3>

        <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">{project.description}</p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tech.map((tech, techIndex) => (
            <Badge
              key={techIndex}
              variant="secondary"
              className="bg-gray-800/60 text-gray-300 border-gray-700/50 hover:bg-gray-700/60 transition-colors text-xs px-2 py-1"
            >
              {tech}
            </Badge>
          ))}
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {project.stars > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {project.stars}
              </div>
            )}
            {project.forks > 0 && (
              <div className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {project.forks}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {project.updated}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 bg-transparent h-8 px-3"
              onClick={() => window.open(project.github, "_blank")}
            >
              <Github className="w-3 h-3 mr-1" />
              Code
            </Button>
            {project.demo !== "#" && (
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 bg-transparent h-8 px-3"
                onClick={() => window.open(project.demo, "_blank")}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Demo
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Grid Background */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">Featured Projects</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Featuring the best projects from SolanaCore organization and top personal repositories
          </p>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { key: "all", label: `All Projects (${projects.length})` },
              { key: "org", label: `SolanaCore (${projects.filter((p) => p.source === "org").length})` },
              { key: "personal", label: `Personal (${projects.filter((p) => p.source === "personal").length})` },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key as any)}
                className={
                  filter === key
                    ? "bg-white text-black hover:bg-gray-200"
                    : "border-gray-600/50 text-gray-300 hover:bg-gray-700/50 bg-transparent"
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-800/50 rounded mb-3"></div>
                <div className="h-4 bg-gray-800/50 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 bg-gray-800/50 rounded"></div>
                  <div className="h-6 w-16 bg-gray-800/50 rounded"></div>
                  <div className="h-6 w-16 bg-gray-800/50 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-800/50 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-800/50 rounded"></div>
                    <div className="h-8 w-16 bg-gray-800/50 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={`${project.source}-${project.title}`} project={project} index={index} />
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
