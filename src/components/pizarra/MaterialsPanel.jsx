import React from 'react';
import { MATERIALS_BY_CATEGORY, MATERIALS_LIBRARY } from '../../lib/mister11-materials.js';

const MaterialsPanel = ({
  openCats,
  setOpenCats,
  placingMat,
  setPlacingMat,
  setActiveTool,
  isMobile,
  setShowMatsDrawer,
}) => {
  return (
    <div className="pizarra-sidebar-content">
      <div className="panel-title">MATERIAL</div>
      <div className="materials-list">
        {Object.entries(MATERIALS_BY_CATEGORY).map(([catKey, catData]) => {
          const catLabel = catData.label || catKey;
          const catItems = catData.items || catData || [];
          const isOpen = openCats[catKey];
          return (
            <div key={catKey} className="material-category">
              <div className="collapsible-header" onClick={() =>
                setOpenCats(p => ({ ...p, [catKey]: !p[catKey] }))}>
                <span className="collapsible-arrow">{isOpen ? '▼' : '▶'}</span>
                <span className="material-header-label">{catLabel}</span>
              </div>
              {isOpen && (
                <div className="material-items">
                  {catItems.map(id => {
                    const mat = MATERIALS_LIBRARY[id];
                    if (!mat) return null;
                    return (
                      <div key={id}
                        className={`material-item ${placingMat === id ? 'active' : ''}`}
                        onClick={() => { 
                          setPlacingMat(id); 
                          setActiveTool('place_material');
                          if (isMobile && setShowMatsDrawer) setShowMatsDrawer(false);
                        }}>
                        <div dangerouslySetInnerHTML={{ __html: mat.svgPanel }} />
                        <span>{mat.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialsPanel;
