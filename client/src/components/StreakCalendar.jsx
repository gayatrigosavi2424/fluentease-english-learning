import React, { useState, useEffect } from 'react';
import { getStreakCalendar } from '../services/streaks';

const StreakCalendar = ({ userId }) => {
    const [calendarData, setCalendarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState(null);

    useEffect(() => {
        if (userId) {
            loadCalendarData();
        }
    }, [userId]);

    // Auto-refresh calendar every 30 seconds to show new activities
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing calendar...');
            loadCalendarData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [userId]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            const data = await getStreakCalendar(userId, 365);
            setCalendarData(data);
        } catch (error) {
            console.error('Error loading calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColorClass = (level) => {
        const colors = {
            0: 'bg-gray-100 border-gray-200', // No activity
            1: 'bg-green-200 border-green-300', // 1 activity
            2: 'bg-green-400 border-green-500', // 2 activities
            3: 'bg-green-600 border-green-700', // 3 activities
            4: 'bg-green-800 border-green-900'  // 3+ activities
        };
        return colors[level] || colors[0];
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getActivityText = (dayData) => {
        if (dayData.count === 0) return 'No activities';

        const activities = [];
        if (dayData.activities.speak) activities.push('Speaking');
        if (dayData.activities.write) activities.push('Writing');
        if (dayData.activities.describe) activities.push('Describing');

        return `${dayData.count} ${dayData.count === 1 ? 'activity' : 'activities'}: ${activities.join(', ')}`;
    };

    const getMonthData = (offset) => {
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const monthData = calendarData.filter(day => {
            const dayDate = new Date(day.date);
            return dayDate.getMonth() === month && dayDate.getFullYear() === year;
        });

        const grid = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            grid.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayData = monthData.find(d => d.date === dateStr);
            grid.push(dayData || { date: dateStr, count: 0, level: 0, activities: {} });
        }

        return {
            grid,
            monthName: targetDate.toLocaleDateString('en-US', { month: 'short' }),
            fullMonthName: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            year,
            month
        };
    };

    const getAllMonths = () => {
        const months = [];
        for (let i = -11; i <= 0; i++) {
            months.push(getMonthData(i));
        }
        return months;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const allMonths = getAllMonths();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    📅 Learning Activity Calendar
                </h3>
                <p className="text-sm text-gray-600">
                    Activity tracker for your English learning journey
                </p>
            </div>

            {/* Scrollable months container */}
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-6">
                    {allMonths.map((monthData, monthIndex) => {
                        const weeks = [];
                        for (let i = 0; i < monthData.grid.length; i += 7) {
                            weeks.push(monthData.grid.slice(i, i + 7));
                        }

                        return (
                            <div key={monthIndex} className="flex-shrink-0">
                                {/* Month label */}
                                <div className="text-center mb-2">
                                    <h4 className="text-sm font-bold text-gray-700">{monthData.monthName}</h4>
                                </div>

                                {/* Calendar Grid */}
                                <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    {/* Day headers */}
                                    <div className="grid grid-cols-7 bg-gray-100 border-b">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                            <div key={idx} className="text-center py-1 text-[9px] font-semibold text-gray-600 w-8">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar days */}
                                    <div className="bg-white p-1">
                                        {weeks.map((week, weekIndex) => (
                                            <div key={weekIndex} className="flex gap-0.5 mb-0.5 last:mb-0">
                                                {week.map((day, dayIndex) => (
                                                    <div
                                                        key={dayIndex}
                                                        className="w-8 h-8 flex items-center justify-center"
                                                    >
                                                        {day ? (
                                                            <div
                                                                className={`w-7 h-7 rounded-sm border cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-md flex items-center justify-center ${getColorClass(day.level)}`}
                                                                onMouseEnter={() => setHoveredDay(day)}
                                                                onMouseLeave={() => setHoveredDay(null)}
                                                                title={`${formatDate(day.date)}: ${getActivityText(day)}`}
                                                            >
                                                                <span className="text-[9px] font-medium text-gray-700">
                                                                    {new Date(day.date).getDate()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-7 h-7"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(level => (
                    <div
                        key={level}
                        className={`w-4 h-4 rounded border-2 ${getColorClass(level)}`}
                    />
                ))}
                <span>More</span>
            </div>

            {/* Hover tooltip */}
            {hoveredDay && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                    <div className="text-sm font-semibold text-gray-800 mb-1">
                        {formatDate(hoveredDay.date)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                        {getActivityText(hoveredDay)}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {hoveredDay.activities.speak && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                                🎤 Speaking
                            </span>
                        )}
                        {hoveredDay.activities.write && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                                ✍️ Writing
                            </span>
                        )}
                        {hoveredDay.activities.describe && (
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">
                                🖼️ Describing
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreakCalendar;
