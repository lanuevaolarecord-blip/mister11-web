import React, { createContext, useState, useContext } from 'react';

const PizarraContext = createContext();

export const usePizarra = () => useContext(PizarraContext);

export const PizarraProvider = ({ children }) => {
  const [estadosPizarra, setEstadosPizarra] = useState({});
  const [formaciones, setFormaciones] = useState({});

  const guardarEstado = (key, canvasJSON) => {
    setEstadosPizarra(prev => ({ ...prev, [key]: canvasJSON }));
  };

  const obtenerEstado = (key) => {
    return estadosPizarra[key] || null;
  };

  const limpiarEstado = (key) => {
    setEstadosPizarra(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const guardarFormacion = (key, formacionLocal, formacionRival) => {
    setFormaciones(prev => ({ ...prev, [key]: { local: formacionLocal, rival: formacionRival } }));
  };

  const obtenerFormaciones = (key) => {
    return formaciones[key] || null;
  };

  return (
    <PizarraContext.Provider value={{
      guardarEstado,
      obtenerEstado,
      limpiarEstado,
      guardarFormacion,
      obtenerFormaciones
    }}>
      {children}
    </PizarraContext.Provider>
  );
};
