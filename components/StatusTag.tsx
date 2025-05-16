'use client';

interface StatusTagProps {
  status: string;
}

export default function StatusTag({ status }: StatusTagProps) {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';
  let dotColor = 'bg-gray-200';
  switch (status) {
    case 'In conversations':
      bgColor = 'bg-[#F9EB52]/10';
      dotColor = 'bg-[#F9EB52]';
      textColor = 'text-[#F9EB52]';
      break;
    case 'Active':
      bgColor = 'bg-[#5FAF94]/10';
      dotColor = 'bg-[#5FAF94]';
      textColor = 'text-[#5FAF94]';
      break;
    case 'Completed':
      bgColor = 'bg-[#5D80C1]/10';
      dotColor = 'bg-[#5D80C1]';
      textColor = 'text-[#5D80C1]';
      break;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor}`}>
      <div className={`w-1 h-1 rounded-full ${dotColor}`}></div>
      {status}
    </div>
  );
} 