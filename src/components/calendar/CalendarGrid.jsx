import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import ContentCard from './ContentCard';

const CalendarGrid = ({ 
  content = [], 
  pillars = [], 
  onContentClick,
  onDateClick,
  onGenerateContent,
  selectedDate = null 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  // Calcular días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Agrupar contenido por fecha
  const contentByDate = useMemo(() => {
    const grouped = {};
    content.forEach(item => {
      const date = new Date(item.scheduled_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    return grouped;
  }, [content]);

  // Obtener pilares por ID
  const getPillarById = (pillarId) => {
    return pillars.find(pillar => pillar.id === pillarId);
  };

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Obtener contenido para una fecha específica
  const getContentForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return contentByDate[dateKey] || [];
  };

  // Renderizar día del calendario
  const renderDay = (day) => {
    const dayContent = getContentForDate(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    return (
      <div
        key={day.toISOString()}
        className={`
          min-h-[120px] p-2 border border-gray-200 bg-white
          ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400 bg-gray-50'}
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
          ${isTodayDate ? 'bg-blue-100' : ''}
          hover:bg-gray-50 cursor-pointer transition-colors
        `}
        onClick={() => onDateClick && onDateClick(day)}
      >
        {/* Número del día */}
        <div className="flex items-center justify-between mb-2">
          <span className={`
            text-sm font-medium
            ${isTodayDate ? 'text-blue-600 font-bold' : ''}
            ${isSelected ? 'text-blue-600' : ''}
          `}>
            {format(day, 'd')}
          </span>
          
          {/* Indicador de contenido */}
          {dayContent.length > 0 && (
            <div className="flex space-x-1">
              {dayContent.slice(0, 3).map((item, index) => {
                const pillar = getPillarById(item.pillar_id);
                return (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: pillar?.color || '#6B7280' }}
                    title={pillar?.name || 'Sin pilar'}
                  />
                );
              })}
              {dayContent.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{dayContent.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contenido del día */}
        <div className="space-y-1">
          {dayContent.slice(0, 2).map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              pillar={getPillarById(item.pillar_id)}
              isCompact={true}
              onEdit={onContentClick}
            />
          ))}
          {dayContent.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{dayContent.length - 2} más
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar vista de mes
  const renderMonthView = () => (
    <div className="bg-white rounded-lg shadow">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
          <div key={index} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {days.map(renderDay)}
      </div>
    </div>
  );

  // Renderizar vista de semana
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ 
      start: weekStart, 
      end: endOfWeek(weekStart, { weekStartsOn: 1 }) 
    });

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header de la semana */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(weekStart, 'dd MMM', { locale: es })} - {format(weekDays[6], 'dd MMM yyyy', { locale: es })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>

        {/* Grid de la semana */}
        <div className="grid grid-cols-7">
          {weekDays.map(renderDay)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controles de vista */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              viewMode === 'month' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              viewMode === 'week' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Semana
          </button>
        </div>

        {/* Botón de generar contenido */}
        {onGenerateContent && (
          <button
            onClick={onGenerateContent}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Generar Contenido
          </button>
        )}
      </div>

      {/* Calendario */}
      {viewMode === 'month' ? renderMonthView() : renderWeekView()}
    </div>
  );
};

export default CalendarGrid;
