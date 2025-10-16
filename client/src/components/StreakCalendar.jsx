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
            1: 'bg-green-100 border-green-200', // 1 activity
            2: 'bg-green-300 border-green-400', // 2 activities
            3: 'bg-green-500 border-green-600', // 3 activities
            4: 'bg-green-700 border-green-800'  // 3+ activities
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

    const groupByWeeks = (data) => {
        const weeks = [];
        let currentWeek = [];

        // Add empty days at the beginning if needed
        const firstDay = data[0];
        if (firstDay) {
            const startPadding = firstDay.dayOfWeek;
            for (let i = 0; i < startPadding; i++) {
                currentWeek.push(null);
            }
        }

        data.forEach((day, index) => {
            currentWeek.push(day);

            if (currentWeek.length === 7) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });

        // Add remaining days
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        return weeks;
    };

    const getMonthLabels = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const labels = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            labels.push(months[date.getMonth()]);
        }

        return labels;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-53 gap-1">
                        {Array.from({ length: 365 }).map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const weeks = groupByWeeks(calendarData);
    const monthLabels = getMonthLabels();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    📅 Learning Activity Calendar
                </h3>
                <p className="text-sm text-gray-600">
                    Activity tracker for your English learning journey
                </p>
            </div>

            <div className="relative">
                {/* Month labels */}
                <div className="flex justify-between text-xs text-gray-500 mb-2 px-4">
                    {monthLabels.map((month, index) => (
                        <span key={index}>{month}</span>
                    ))}
                </div>

                {/* Day labels */}
                <div className="flex flex-col text-xs text-gray-500 absolute -left-8 top-8">
                    <span className="h-3 flex items-center">Mon</span>
                    <span className="h-3 flex items-center mt-1">Wed</span>
                    <span className="h-3 flex items-center mt-1">Fri</span>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-53 gap-1">
                    {weeks.map((week, weekIndex) =>
                        week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-3 h-3 rounded-sm border cursor-pointer transition-all duration-200 hover:scale-110 ${day ? getColorClass(day.level) : 'bg-transparent border-transparent'
                                    }`}
                                onMouseEnter={() => day && setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                                title={day ? `${formatDate(day.date)}: ${getActivityText(day)}` : ''}
                            />
                        ))
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(level => (
                            <div
                                key={level}
                                className={`w-3 h-3 rounded-sm border ${getColorClass(level)}`}
                            />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>

            {/* Hover tooltip */}
            {hoveredDay && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-medium text-gray-800">
                        {formatDate(hoveredDay.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                        {getActivityText(hoveredDay)}
                    </div>
                    {hoveredDay.activities.speak && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mt-1">
                            🎤 Speaking
                        </span>
                    )}
                    {hoveredDay.activities.write && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mt-1">
                            ✍️ Writing
                        </span>
                    )}
                    {hoveredDay.activities.describe && (
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-1 mt-1">
                            🖼️ Describing
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StreakCalendar;