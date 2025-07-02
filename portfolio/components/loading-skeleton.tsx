"use client"

export function ContributionGraphSkeleton() {
  return (
    <div className="p-6 bg-gray-900/20 rounded-lg border border-white/10 backdrop-blur-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-800/50 rounded w-48"></div>
        <div className="h-4 bg-gray-800/50 rounded w-32"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="h-8 bg-gray-800/50 rounded mb-1"></div>
          <div className="h-3 bg-gray-800/50 rounded"></div>
        </div>
        <div className="text-center">
          <div className="h-8 bg-gray-800/50 rounded mb-1"></div>
          <div className="h-3 bg-gray-800/50 rounded"></div>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {Array.from({ length: 53 }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div key={dayIndex} className="w-3 h-3 bg-gray-800/30 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActivityCardSkeleton() {
  return (
    <div className="bg-gray-900/20 border-white/10 backdrop-blur-sm rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-800/50 rounded"></div>
        <div className="h-6 bg-gray-800/50 rounded w-32"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="h-4 bg-gray-700 rounded flex-1"></div>
            <div className="h-4 w-16 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-900/20 border-white/10 backdrop-blur-sm rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-800/50 rounded"></div>
        <div className="h-6 bg-gray-800/50 rounded w-40"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-800/50 rounded mb-2"></div>
            <div className="h-4 bg-gray-800/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
