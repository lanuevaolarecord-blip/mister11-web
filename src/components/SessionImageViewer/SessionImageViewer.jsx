import React, { useState } from 'react';
import { ImageModal } from './ImageModal';
import './SessionImageViewer.css';

export const SessionImageViewer = ({
  images = [],
  exercisesData = [],
  initialIndex = 0,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  triggerElement = null
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const handleOpen = () => setInternalIsOpen(true);
  const handleClose = () => {
    if (controlledOnClose) controlledOnClose();
    setInternalIsOpen(false);
  };

  return (
    <>
      {/* Elemento disparador si se suministra */}
      {triggerElement && (
        <div onClick={handleOpen} style={{ cursor: 'pointer' }}>
          {triggerElement}
        </div>
      )}

      {/* Modal Principal de Pantalla Completa */}
      {isOpen && (
        <ImageModal
          isOpen={isOpen}
          onClose={handleClose}
          images={Array.isArray(images) ? images : [images]}
          initialIndex={initialIndex}
          exercisesData={Array.isArray(exercisesData) ? exercisesData : [exercisesData]}
        />
      )}
    </>
  );
};

export default SessionImageViewer;
