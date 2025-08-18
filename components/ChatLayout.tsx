import { useEffect } from 'react';

interface ChatLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode; // ChatWindow
}

export default function ChatLayout({ header, children }: ChatLayoutProps) {
  useEffect(() => {
    const headerType = typeof header === 'object' && header !== null && 'type' in header && typeof header.type === 'function' ? header.type.name : 'unknown';
    console.log("[ChatLayout] rendered", headerType);
  }, [header]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 md:p-6">
      {/* Header content */}
      {header}
      
      {/* Main content area - ensure chat messages are above input */}
      <div className="flex-1 mt-4 mb-20">
        {children}
      </div>
    </div>
  );
}
