'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

function DeepWorkTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(3600) // Default to 1 hour (3600 seconds)
  const [initialTime, setInitialTime] = useState(3600) // Keep track of initial time set
  const [dailyStats, setDailyStats] = useState<{ date: string; duration: number }[]>([])

  useEffect(() => {
    const storedStats = localStorage.getItem('deepWorkStats')
    if (storedStats) {
      setDailyStats(JSON.parse(storedStats))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
    } else if (time === 0) {
      setIsRunning(false)
      saveSession(initialTime) // Save session when timer reaches zero
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, time, initialTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleStartStop = () => {
    if (!isRunning && time === 0) {
      // If timer is at 0, reset to 1 hour before starting
      setTime(3600)
      setInitialTime(3600)
    }
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(3600) // Reset to 1 hour
    setInitialTime(3600)
  }

  const handleFinish = () => {
    const duration = initialTime - time
    saveSession(duration)
    setIsRunning(false)
    setTime(3600) // Reset to 1 hour
    setInitialTime(3600)
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputTime = event.target.value
    const [hours, minutes, seconds] = inputTime.split(':').map(Number)
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds
    setTime(totalSeconds)
    setInitialTime(totalSeconds)
  }

  const saveSession = (duration: number) => {
    const today = new Date().toISOString().split('T')[0]
    const updatedStats = [...dailyStats]
    const todayIndex = updatedStats.findIndex((stat) => stat.date === today)
    if (todayIndex !== -1) {
      updatedStats[todayIndex].duration += duration
    } else {
      updatedStats.push({ date: today, duration: duration })
    }
    setDailyStats(updatedStats)
    localStorage.setItem('deepWorkStats', JSON.stringify(updatedStats))
  }

  const resetLocalStorage = () => {
    localStorage.removeItem('deepWorkStats')
    setDailyStats([])
  }

  // Generate dates for the last 12 months
  const generateDates = () => {
    const dates = []
    const today = new Date()
    const currentDate = new Date(today.getFullYear(), today.getMonth() - 11, 1)

    while (currentDate <= today) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  // Get contribution level (0-4) based on hours
  const getContributionLevel = (hours: number) => {
    if (hours === 0) return 0
    if (hours < 2) return 1
    if (hours < 4) return 2
    if (hours < 6) return 3
    return 4
  }

  const dates = generateDates()

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Deep Work Timer</CardTitle>
            <CardDescription>Focus on your work and track your progress</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Input
              type="text"
              value={formatTime(time)}
              onChange={handleTimeChange}
              className="text-4xl font-bold mb-4 text-center w-48"
              disabled={isRunning}
            />
            <div className="flex gap-4">
              <Button onClick={handleStartStop} size="lg">
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button onClick={handleReset} size="lg" variant="outline">
                Reset
              </Button>
              <Button onClick={handleFinish} size="lg" variant="secondary">
                Finish
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deep Work Stats</CardTitle>
            <CardDescription>Your contribution graph</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Grid */}
                <div className="flex mt-2">
                  {/* Contribution cells */}
                  <div className="flex-1 flex gap-[2px]">
                    {dates.map((date, index) => {
                      if (index % 7 === 0) {
                        return (
                          <div key={date.toISOString()} className="flex-1 flex flex-col gap-[2px]">
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                              const cellDate = new Date(date)
                              cellDate.setDate(cellDate.getDate() + dayIndex)
                              const dateStr = cellDate.toISOString().split('T')[0]
                              const stat = dailyStats.find((s) => s.date === dateStr)
                              const hours = stat ? stat.duration / 3600 : 0
                              const level = getContributionLevel(hours)
                              
                              return (
                                <div
                                  key={dateStr}
                                  className={`
                                    h-[10px] w-full rounded-sm
                                    ${level === 0 && 'bg-[#ebedf0]'}
                                    ${level === 1 && 'bg-[#9be9a8]'}
                                    ${level === 2 && 'bg-[#40c463]'}
                                    ${level === 3 && 'bg-[#30a14e]'}
                                    ${level === 4 && 'bg-[#216e39]'}
                                  `}
                                  title={`${hours.toFixed(1)} hours on ${dateStr}`}
                                />
                              )
                            })}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`
                    h-[10px] w-[10px] rounded-sm
                    ${level === 0 && 'bg-[#ebedf0]'}
                    ${level === 1 && 'bg-[#9be9a8]'}
                    ${level === 2 && 'bg-[#40c463]'}
                    ${level === 3 && 'bg-[#30a14e]'}
                    ${level === 4 && 'bg-[#216e39]'}
                  `}
                />
              ))}
              <span>More</span>
            </div>

            {/* Reset localStorage button */}
            <div className="mt-4 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Reset All Data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your Deep Work session data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetLocalStorage}>
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DeepWorkTimer