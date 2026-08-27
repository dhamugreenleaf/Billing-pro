import { useEffect } from 'react';

const useSEO = ({ title, description, noindex }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    
    // Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // Robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = 'noindex, nofollow';
    } else {
      if (metaRobots) {
        metaRobots.content = 'index, follow';
      }
    }
    
    // Cleanup if needed? Usually we want it to persist until overwritten by another page.
    // If a component unmounts and we want to remove the tag, we could, but it's better 
    // to just let the next route overwrite it.
  }, [title, description, noindex]);
};

export default useSEO;
