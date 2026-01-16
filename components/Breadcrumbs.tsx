import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    action?: () => void;
    active?: boolean;
}

interface Props {
    items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<Props> = ({ items }) => {
    return (
        <nav className="flex items-center space-x-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-4" aria-label="Breadcrumb">
            <button className="hover:text-ink transition-colors flex items-center">
                <Home size={12} />
            </button>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={10} className="text-gray-300" />
                    <button
                        onClick={item.action}
                        disabled={item.active}
                        className={`${item.active ? 'text-brand-600 font-bold cursor-default' : 'hover:text-ink transition-colors'}`}
                    >
                        {item.label}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
