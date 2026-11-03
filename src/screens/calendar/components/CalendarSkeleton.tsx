export function CalendarSkeleton() {
  return (
    <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-4 md:space-y-0 animate-pulse">
      {/* Left Column: Month Grid & Day Slots Shimmer */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-5">
          {/* Month Header Shimmer */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 bg-bone rounded-lg" />
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-bone" />
              <div className="w-8 h-8 rounded-full bg-bone" />
            </div>
          </div>

          {/* Weekday Labels Shimmer */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-3.5 bg-bone/70 rounded mx-auto w-6" />
            ))}
          </div>

          {/* 35 Calendar Cells Shimmer */}
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-bone/50 border border-line/40" />
            ))}
          </div>

          {/* Day Slots Shimmer */}
          <div className="pt-4 border-t border-line/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-bone rounded" />
              <div className="h-3 w-16 bg-bone/70 rounded" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 rounded-xl bg-bone/60 border border-line/40" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Weekly Schedule & Overrides Shimmer */}
      <div className="space-y-4">
        {/* Weekly Schedule Shimmer */}
        <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-36 bg-bone rounded" />
              <div className="h-3 w-48 bg-bone/60 rounded" />
            </div>
            <div className="h-6 w-16 bg-bone rounded-lg" />
          </div>

          {/* 7 Schedule Rows */}
          <div className="space-y-2.5 pt-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-bone/40 border border-line/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-5 rounded-full bg-bone" />
                  <div className="h-3.5 w-16 bg-bone rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-bone rounded" />
                  <div className="h-3 w-2 bg-bone/50 rounded" />
                  <div className="h-6 w-16 bg-bone rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Overrides Shimmer */}
        <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-bone rounded" />
            <div className="h-7 w-24 bg-bone rounded-xl" />
          </div>
          <div className="h-14 rounded-xl bg-bone/40 border border-line/40" />
        </div>
      </div>
    </div>
  )
}

