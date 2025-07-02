"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Code, Database, Globe, Server, Zap, Github, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { githubCache } from "@/utils/github-cache"

interface SkillData {
  [key: string]: {
    count: number
    percentage: number
    category: string
    icon: string
    color: string
  }
}

interface LanguageStats {
  name: string
  count: number
  percentage: number
  color: string
}

export default function Skills() {
  const [skills, setSkills] = useState<SkillData>({})
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRepos, setTotalRepos] = useState(0)
  const [orgStats, setOrgStats] = useState<any>(null)

  useEffect(() => {
    const fetchSkillsFromGitHub = async () => {
      try {
        // Check cache first
        const cachedSkills = githubCache.get("github_skills_data")
        if (cachedSkills) {
          setSkills(cachedSkills.skills)
          setLanguageStats(cachedSkills.languageStats)
          setTotalRepos(cachedSkills.totalRepos)
          setOrgStats(cachedSkills.orgStats)
          setLoading(false)
          return
        }

        // Fetch from both accounts
        const [personalRepos, orgRepos] = await Promise.all([
          fetch("https://api.github.com/users/DhruvWebDev/repos?per_page=100").then((r) => r.json()),
          fetch("https://api.github.com/orgs/SolanaCore/repos?per_page=100").then((r) => r.json()),
        ])

        const allRepos = [...personalRepos, ...orgRepos]
        setTotalRepos(allRepos.length)

        // Analyze languages and topics
        const languageCount: { [key: string]: number } = {}
        const topicCount: { [key: string]: number } = {}

        allRepos.forEach((repo: any) => {
          if (repo.language) {
            languageCount[repo.language] = (languageCount[repo.language] || 0) + 1
          }

          if (repo.topics && Array.isArray(repo.topics)) {
            repo.topics.forEach((topic: string) => {
              topicCount[topic] = (topicCount[topic] || 0) + 1
            })
          }
        })

        // Create detailed language statistics
        const languageStatsData = Object.entries(languageCount)
          .map(([language, count]) => ({
            name: language,
            count: count as number,
            percentage: Math.round(((count as number) / allRepos.length) * 100),
            color: getLanguageColor(language),
          }))
          .sort((a, b) => b.count - a.count)

        // Create skills data
        const skillsData: SkillData = {}

        Object.entries(languageCount).forEach(([language, count]) => {
          const category = getLanguageCategory(language)
          skillsData[language] = {
            count: count as number,
            percentage: Math.round(((count as number) / allRepos.length) * 100),
            category,
            icon: getLanguageIcon(language),
            color: getLanguageColor(language),
          }
        })

        // Process relevant topics
        const relevantTopics = [
          "react",
          "nextjs",
          "nodejs",
          "typescript",
          "javascript",
          "python",
          "solana",
          "web3",
          "blockchain",
          "defi",
          "nft",
          "rust",
          "anchor",
          "mongodb",
          "postgresql",
          "firebase",
          "docker",
          "kubernetes",
          "tailwindcss",
          "express",
          "graphql",
          "prisma",
          "supabase",
        ]

        Object.entries(topicCount).forEach(([topic, count]) => {
          if (relevantTopics.includes(topic.toLowerCase()) && count >= 2) {
            const skillName = formatSkillName(topic)
            const category = getTopicCategory(topic)
            skillsData[skillName] = {
              count: count as number,
              percentage: Math.round(((count as number) / allRepos.length) * 100),
              category,
              icon: getTopicIcon(topic),
              color: getTopicColor(topic),
            }
          }
        })

        // Organization statistics
        const orgStatsData = {
          personalRepos: personalRepos.length,
          orgRepos: orgRepos.length,
          personalStars: personalRepos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
          orgStars: orgRepos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
          personalLanguages: [...new Set(personalRepos.map((r: any) => r.language).filter(Boolean))].length,
          orgLanguages: [...new Set(orgRepos.map((r: any) => r.language).filter(Boolean))].length,
        }

        // Cache the data
        const cacheData = {
          skills: skillsData,
          languageStats: languageStatsData,
          totalRepos: allRepos.length,
          orgStats: orgStatsData,
        }
        githubCache.set("github_skills_data", cacheData)

        setSkills(skillsData)
        setLanguageStats(languageStatsData)
        setOrgStats(orgStatsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching skills data:", error)
        setLoading(false)
      }
    }

    fetchSkillsFromGitHub()
  }, [])

  // Helper functions (same as before but with color additions)
  const getLanguageCategory = (language: string): string => {
    const categories: { [key: string]: string } = {
      JavaScript: "Frontend",
      TypeScript: "Frontend",
      React: "Frontend",
      HTML: "Frontend",
      CSS: "Frontend",
      Python: "Backend",
      "Node.js": "Backend",
      Rust: "Blockchain",
      Solidity: "Blockchain",
      Go: "Backend",
      Java: "Backend",
      "C++": "Systems",
      C: "Systems",
    }
    return categories[language] || "Other"
  }

  const getTopicCategory = (topic: string): string => {
    const categories: { [key: string]: string } = {
      react: "Frontend",
      nextjs: "Frontend",
      tailwindcss: "Frontend",
      nodejs: "Backend",
      express: "Backend",
      python: "Backend",
      solana: "Blockchain",
      web3: "Blockchain",
      blockchain: "Blockchain",
      defi: "Blockchain",
      nft: "Blockchain",
      rust: "Blockchain",
      anchor: "Blockchain",
      mongodb: "Database",
      postgresql: "Database",
      firebase: "Database",
      prisma: "Database",
      supabase: "Database",
      docker: "DevOps",
      kubernetes: "DevOps",
    }
    return categories[topic.toLowerCase()] || "Other"
  }

  const getLanguageColor = (language: string): string => {
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

  const getTopicColor = (topic: string): string => {
    const colors: { [key: string]: string } = {
      react: "#61dafb",
      nextjs: "#000000",
      nodejs: "#339933",
      solana: "#9945ff",
      web3: "#f16822",
      rust: "#dea584",
      mongodb: "#47a248",
      postgresql: "#336791",
      docker: "#2496ed",
    }
    return colors[topic.toLowerCase()] || "#6b7280"
  }

  const getLanguageIcon = (language: string): string => "💻"
  const getTopicIcon = (topic: string): string => {
    const icons: { [key: string]: string } = {
      react: "⚛️",
      nextjs: "▲",
      nodejs: "🟢",
      python: "🐍",
      solana: "🌞",
      web3: "🌐",
      blockchain: "⛓️",
      rust: "🦀",
      mongodb: "🍃",
      postgresql: "🐘",
      docker: "🐳",
      firebase: "🔥",
    }
    return icons[topic.toLowerCase()] || "🔧"
  }

  const formatSkillName = (skill: string): string => {
    const formatted: { [key: string]: string } = {
      nextjs: "Next.js",
      nodejs: "Node.js",
      typescript: "TypeScript",
      javascript: "JavaScript",
      tailwindcss: "Tailwind CSS",
      mongodb: "MongoDB",
      postgresql: "PostgreSQL",
    }
    return formatted[skill.toLowerCase()] || skill.charAt(0).toUpperCase() + skill.slice(1)
  }

  const groupSkillsByCategory = () => {
    const grouped: { [key: string]: any[] } = {}
    Object.entries(skills).forEach(([skill, data]) => {
      if (!grouped[data.category]) grouped[data.category] = []
      grouped[data.category].push({ name: skill, ...data })
    })
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => b.count - a.count)
    })
    return grouped
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      Frontend: <Globe className="w-6 h-6" />,
      Backend: <Server className="w-6 h-6" />,
      Database: <Database className="w-6 h-6" />,
      Blockchain: <Zap className="w-6 h-6" />,
      DevOps: <Code className="w-6 h-6" />,
      Other: <Code className="w-6 h-6" />,
    }
    return icons[category] || <Code className="w-6 h-6" />
  }

  const groupedSkills = groupSkillsByCategory()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">Technical Skills</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Skills automatically detected from {totalRepos} repositories across GitHub accounts
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              DhruvWebDev
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              SolanaCore
            </span>
          </div>
        </motion.div>

        {/* Language Statistics Overview */}
        {!loading && languageStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-gray-900/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Language Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {languageStats.slice(0, 8).map((lang, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: lang.color }} />
                        <span className="text-gray-300 flex-1">{lang.name}</span>
                        <span className="text-gray-400 text-sm">{lang.count} repos</span>
                        <span className="text-white font-medium">{lang.percentage}%</span>
                      </div>
                    ))}
                  </div>

                  {orgStats && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Account Statistics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-blue-400">{orgStats.personalRepos}</div>
                          <div className="text-xs text-gray-400">Personal Repos</div>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-purple-400">{orgStats.orgRepos}</div>
                          <div className="text-xs text-gray-400">Org Repos</div>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-yellow-400">
                            {orgStats.personalStars + orgStats.orgStars}
                          </div>
                          <div className="text-xs text-gray-400">Total Stars</div>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                          <div className="text-xl font-bold text-green-400">
                            {Math.max(orgStats.personalLanguages, orgStats.orgLanguages)}
                          </div>
                          <div className="text-xs text-gray-400">Languages</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Skills by Category */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-900/20 p-6 rounded-lg border border-white/10 animate-pulse">
                <div className="h-6 bg-gray-800/50 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-800/50 rounded"></div>
                      <div className="h-2 bg-gray-800/50 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(groupedSkills).map(([category, categorySkills], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                className="bg-gray-900/20 p-6 rounded-lg border border-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center mb-6">
                  <div className="text-white mr-3">{getCategoryIcon(category)}</div>
                  <h2 className="text-xl font-semibold text-white">{category}</h2>
                  <span className="ml-auto text-sm text-gray-400">{categorySkills.length} skills</span>
                </div>
                <div className="space-y-4">
                  {categorySkills.slice(0, 8).map((skill, skillIndex) => (
                    <div key={skillIndex} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium flex items-center gap-2">
                          <span>{skill.icon}</span>
                          {skill.name}
                        </span>
                        <div className="text-right">
                          <span className="text-gray-400 text-sm">{skill.count} repos</span>
                          <div className="text-xs text-gray-500">{skill.percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: skill.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(skill.percentage * 2, 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 + skillIndex * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
