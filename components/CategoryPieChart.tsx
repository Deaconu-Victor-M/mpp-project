import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface CategoryPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  useEffect(() => {
    console.log('CategoryPieChart received data:', data);
  }, [data]);

  if (!data || data.length === 0) {
    console.log('CategoryPieChart: No data available');
    return (
      <div className="flex items-center justify-center h-[300px] bg-[#F7F7F7] rounded-xl p-4">
        <p className="text-[#4F4F4F] text-center">No leads data available</p>
      </div>
    );
  }

  // Special handling for single category case
  if (data.length === 1) {
    const category = data[0];
    return (
      <div className="bg-[#F7F7F7] rounded-xl p-4 mb-6">
        <div className="h-[300px] flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <p className="text-lg font-medium">All leads are in one category</p>
            <div className="flex items-center justify-center mt-2">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: category.color }}
              ></div>
              <p className="text-xl font-semibold">{category.name}</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center mt-4">
            <div 
              className="w-40 h-40 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: category.color }}
            >
              <div className="text-white text-lg font-bold">
                {category.value} leads
              </div>
            </div>
          </div>
          <p className="mt-8 text-gray-500">Add more categories to see a comparison</p>
        </div>
      </div>
    );
  }
  
  // Calculate total for possible use
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom active shape renderer for hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
      </g>
    );
  };

  return (
    <div className="w-full h-auto relative flex flex-col items-center md:items-start md:flex-row md:gap-3 justify-start mx-auto">
      <ResponsiveContainer className="w-full aspect-square max-w-[400px] max-h-[400px]">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
              index
            }) => {
              const radius = (innerRadius + outerRadius) / 2;
              const RADIAN = Math.PI / 180;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              
              return (
                <text
                  x={x}
                  y={y}
                  fill="#000000"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium pointer-events-none"
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
            cornerRadius={6}
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap md:flex-col justify-center md:justify-start gap-3 md:w-[180px] w-full pb-5">
        {data.map((entry, index) => (
          <div 
            key={`legend-${index}`} 
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-200 ${activeIndex === index ? 'scale-150' : ''}`}
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-sm ${activeIndex === index ? 'font-medium' : ''}`}>
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart; 