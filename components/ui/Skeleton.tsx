import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      aria-hidden="true"
    />
  );
}

// Calendar View Skeleton Components
export function MeetingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-5 w-48" variant="text" />
        <Skeleton className="h-6 w-20" variant="rectangular" />
      </div>
      <Skeleton className="h-4 w-32 mb-2" variant="text" />
      <Skeleton className="h-4 w-40" variant="text" />
    </div>
  );
}

export function DailyViewSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <MeetingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WeeklyViewSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {[...Array(7)].map((_, dayIdx) => (
        <div key={dayIdx} className="border rounded-lg p-2">
          <Skeleton className="h-4 w-16 mb-2" variant="text" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" variant="rectangular" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthlyViewSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center py-2 font-medium text-gray-600">
          {day}
        </div>
      ))}
      {/* Calendar days */}
      {[...Array(35)].map((_, idx) => (
        <div key={idx} className="border rounded p-2 h-24">
          <Skeleton className="h-3 w-6 mb-1" variant="text" />
          <Skeleton className="h-2 w-full" variant="rectangular" />
        </div>
      ))}
    </div>
  );
}

// Research Brief Skeleton
export function BriefHeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-20 mb-2" variant="text" />
            <Skeleton className="h-6 w-full mb-1" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickFactsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-blue-50 rounded-lg p-4">
          <Skeleton className="h-4 w-24 mb-2" variant="text" />
          <Skeleton className="h-5 w-full mb-1" variant="text" />
          <Skeleton className="h-4 w-4/5" variant="text" />
        </div>
      ))}
    </div>
  );
}

export function DeepDiveSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <Skeleton className="h-6 w-48 mb-4" variant="text" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-5/6" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-4/5" variant="text" />
      </div>
    </div>
  );
}

export function CallStrategySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-green-50 rounded-lg p-4">
          <Skeleton className="h-5 w-32 mb-2" variant="text" />
          <Skeleton className="h-4 w-full mb-1" variant="text" />
          <Skeleton className="h-4 w-4/5" variant="text" />
        </div>
      ))}
    </div>
  );
}

export function ResearchBriefSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <BriefHeaderSkeleton />
      <QuickFactsSkeleton />
      <DeepDiveSkeleton />
      <CallStrategySkeleton />
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-4 w-32 mb-3" variant="text" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" variant="text" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Ad-hoc List Skeleton
export function AdHocListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Skeleton className="h-5 w-64 mb-2" variant="text" />
              <Skeleton className="h-4 w-32 mb-1" variant="text" />
              <Skeleton className="h-4 w-40" variant="text" />
            </div>
            <Skeleton className="h-6 w-20" variant="rectangular" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Campaign List Skeleton
export function CampaignListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" variant="text" />
              <Skeleton className="h-4 w-32" variant="text" />
            </div>
            <Skeleton className="h-6 w-16" variant="rectangular" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-1" variant="text" />
              <Skeleton className="h-4 w-32" variant="text" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1" variant="text" />
              <Skeleton className="h-4 w-32" variant="text" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
