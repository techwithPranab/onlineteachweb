import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import PropTypes from 'prop-types';
import { BreadcrumbSchema } from '../Schema';

/**
 * Breadcrumb Navigation Component
 * Improves UX and SEO with hierarchical navigation
 */
const Breadcrumb = ({ items, className = '' }) => {
  // Build schema items
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const schemaItems = [
    {
      name: 'Home',
      url: baseUrl + '/'
    },
    ...items.map(item => ({
      name: item.label,
      url: baseUrl + item.path
    }))
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        <Link 
          to="/" 
          className="flex items-center text-gray-500 hover:text-primary-600 transition-colors"
          aria-label="Go to homepage"
        >
          <Home className="h-4 w-4" />
        </Link>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
              
              {isLast ? (
                <span 
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-gray-500 hover:text-primary-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired
    })
  ).isRequired,
  className: PropTypes.string
};

export default Breadcrumb;
